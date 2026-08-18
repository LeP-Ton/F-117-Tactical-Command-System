import { gameConfig } from "../config/gameConfig";
import type { BeliefMapState, RadarContact, Vector2 } from "./types";

export function createBeliefMap(): BeliefMapState {
  const gridSize = gameConfig.belief.gridSize;
  return {
    gridSize,
    probabilities: Array.from({ length: gridSize * gridSize }, () => 0),
    propagationAccumulatorSeconds: 0,
    estimatedVelocity: { x: 0, y: 0 },
    lastUpdatedAt: 0,
  };
}

function normalize(values: number[]): number[] {
  const sum = values.reduce((total, value) => total + value, 0);
  return sum > 1 ? values.map((value) => value / sum) : values;
}

function injectContact(state: BeliefMapState, contact: RadarContact): BeliefMapState {
  const cellWidth = gameConfig.world.width / state.gridSize;
  const cellHeight = gameConfig.world.height / state.gridSize;
  const sigma = Math.max(0.7, contact.errorRadius / Math.max(cellWidth, cellHeight));
  const contactX = contact.estimatedPosition.x / cellWidth - 0.5;
  const contactY = contact.estimatedPosition.y / cellHeight - 0.5;
  const evidence = state.probabilities.map((_, index) => {
    const x = index % state.gridSize;
    const y = Math.floor(index / state.gridSize);
    const distanceSquared = (x - contactX) ** 2 + (y - contactY) ** 2;
    return Math.exp(-distanceSquared / (2 * sigma ** 2));
  });
  const evidenceSum = evidence.reduce((total, value) => total + value, 0) || 1;
  const weight = contact.confidence;
  const probabilities = normalize(state.probabilities.map((value, index) =>
    value * gameConfig.belief.evidencePersistence + (evidence[index] ?? 0) / evidenceSum * weight,
  ));

  let estimatedVelocity = state.estimatedVelocity;
  if (state.lastObservation && contact.timestamp > state.lastObservation.timestamp) {
    const seconds = (contact.timestamp - state.lastObservation.timestamp) / 1000;
    const rawVelocity = {
      x: (contact.estimatedPosition.x - state.lastObservation.position.x) / seconds,
      y: (contact.estimatedPosition.y - state.lastObservation.position.y) / seconds,
    };
    const speed = Math.hypot(rawVelocity.x, rawVelocity.y);
    const scale = speed > gameConfig.belief.maxEstimatedSpeed
      ? gameConfig.belief.maxEstimatedSpeed / speed
      : 1;
    estimatedVelocity = { x: rawVelocity.x * scale, y: rawVelocity.y * scale };
  }

  return {
    ...state,
    probabilities,
    estimatedVelocity,
    lastObservation: { position: { ...contact.estimatedPosition }, timestamp: contact.timestamp },
    lastUpdatedAt: contact.timestamp,
  };
}

function propagateStep(state: BeliefMapState): BeliefMapState {
  const next = Array.from({ length: state.probabilities.length }, () => 0);
  const diffusion = gameConfig.belief.diffusionRate;
  const cellWidth = gameConfig.world.width / state.gridSize;
  const cellHeight = gameConfig.world.height / state.gridSize;
  const shiftX = Math.sign(state.estimatedVelocity.x) * Math.min(
    0.18,
    Math.abs(state.estimatedVelocity.x) * gameConfig.belief.propagationIntervalSeconds / cellWidth,
  );
  const shiftY = Math.sign(state.estimatedVelocity.y) * Math.min(
    0.18,
    Math.abs(state.estimatedVelocity.y) * gameConfig.belief.propagationIntervalSeconds / cellHeight,
  );

  state.probabilities.forEach((probability, index) => {
    const x = index % state.gridSize;
    const y = Math.floor(index / state.gridSize);
    const neighbors = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
    ].filter(([nextX, nextY]) => nextX! >= 0 && nextX! < state.gridSize && nextY! >= 0 && nextY! < state.gridSize);
    const retained = probability * (1 - diffusion - Math.abs(shiftX) - Math.abs(shiftY));
    next[index] = (next[index] ?? 0) + Math.max(0, retained);
    neighbors.forEach(([nextX, nextY]) => {
      const neighborIndex = nextY! * state.gridSize + nextX!;
      next[neighborIndex] = (next[neighborIndex] ?? 0) + probability * diffusion / neighbors.length;
    });
    const directedX = Math.max(0, Math.min(state.gridSize - 1, x + Math.sign(shiftX)));
    const directedY = Math.max(0, Math.min(state.gridSize - 1, y + Math.sign(shiftY)));
    next[y * state.gridSize + directedX] = (next[y * state.gridSize + directedX] ?? 0) + probability * Math.abs(shiftX);
    next[directedY * state.gridSize + x] = (next[directedY * state.gridSize + x] ?? 0) + probability * Math.abs(shiftY);
  });

  return {
    ...state,
    probabilities: next.map((value) => value * gameConfig.belief.decayRate),
    estimatedVelocity: {
      x: state.estimatedVelocity.x * 0.985,
      y: state.estimatedVelocity.y * 0.985,
    },
  };
}

/** Belief 系统只接收 Contact，不接收真实 AircraftState。 */
export function advanceBeliefMap(
  beliefMap: BeliefMapState,
  newContacts: RadarContact[],
  timestamp: number,
  deltaSeconds: number,
): BeliefMapState {
  let next = newContacts
    .sort((first, second) => first.timestamp - second.timestamp)
    .reduce(injectContact, beliefMap);
  let accumulator = next.propagationAccumulatorSeconds + deltaSeconds;
  while (accumulator >= gameConfig.belief.propagationIntervalSeconds) {
    accumulator -= gameConfig.belief.propagationIntervalSeconds;
    next = propagateStep(next);
  }
  return { ...next, propagationAccumulatorSeconds: accumulator, lastUpdatedAt: timestamp };
}

export function getBeliefPeak(state: BeliefMapState): { position: Vector2; probability: number } {
  const maximum = Math.max(...state.probabilities);
  const index = state.probabilities.indexOf(maximum);
  const cellWidth = gameConfig.world.width / state.gridSize;
  const cellHeight = gameConfig.world.height / state.gridSize;
  return {
    position: {
      x: (index % state.gridSize + 0.5) * cellWidth,
      y: (Math.floor(index / state.gridSize) + 0.5) * cellHeight,
    },
    probability: Math.max(0, maximum),
  };
}
