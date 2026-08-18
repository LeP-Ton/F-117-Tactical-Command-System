import { gameConfig } from "../config/gameConfig";
import type { BeliefMapState, BeliefObservation, RadarContact, Vector2 } from "./types";

export function createBeliefMap(): BeliefMapState {
  const gridSize = gameConfig.belief.gridSize;
  return {
    gridSize,
    probabilities: Array.from({ length: gridSize * gridSize }, () => 0),
    propagationAccumulatorSeconds: 0,
    estimatedVelocity: { x: 0, y: 0 },
    recentObservations: [],
    lastUpdatedAt: 0,
  };
}

function normalize(values: number[]): number[] {
  const sum = values.reduce((total, value) => total + value, 0);
  return sum > 1 ? values.map((value) => value / sum) : values;
}

function estimateVelocity(state: BeliefMapState, observations: BeliefObservation[]): Vector2 {
  const byRadar = new Map<string, BeliefObservation[]>();
  observations.forEach((observation) => {
    const history = byRadar.get(observation.radarId) ?? [];
    history.push(observation);
    byRadar.set(observation.radarId, history);
  });

  const estimates = [...byRadar.values()].flatMap((history) => {
    const first = history[0];
    const last = history.at(-1);
    if (!first || !last || last.timestamp - first.timestamp < gameConfig.belief.velocityMinimumSpanMs) return [];
    const seconds = (last.timestamp - first.timestamp) / 1000;
    const reliability = Math.min(first.confidence, last.confidence)
      / Math.max(1, (first.errorRadius + last.errorRadius) / 2);
    return [{
      velocity: {
        x: (last.position.x - first.position.x) / seconds,
        y: (last.position.y - first.position.y) / seconds,
      },
      reliability,
    }];
  });
  if (estimates.length === 0) return state.estimatedVelocity;

  const totalWeight = estimates.reduce((sum, estimate) => sum + estimate.reliability, 0) || 1;
  const measured = estimates.reduce((velocity, estimate) => ({
    x: velocity.x + estimate.velocity.x * estimate.reliability / totalWeight,
    y: velocity.y + estimate.velocity.y * estimate.reliability / totalWeight,
  }), { x: 0, y: 0 });
  const speed = Math.hypot(measured.x, measured.y);
  const scale = speed > gameConfig.belief.maxEstimatedSpeed
    ? gameConfig.belief.maxEstimatedSpeed / speed
    : 1;
  const smoothing = gameConfig.belief.velocitySmoothing;
  return {
    x: state.estimatedVelocity.x * (1 - smoothing) + measured.x * scale * smoothing,
    y: state.estimatedVelocity.y * (1 - smoothing) + measured.y * scale * smoothing,
  };
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

  const observation: BeliefObservation = {
    position: { ...contact.estimatedPosition },
    timestamp: contact.timestamp,
    radarId: contact.radarId,
    confidence: contact.confidence,
    errorRadius: contact.errorRadius,
  };
  const recentObservations = [...state.recentObservations, observation]
    .filter((item) => contact.timestamp - item.timestamp <= gameConfig.belief.velocityObservationWindowMs)
    .slice(-gameConfig.belief.maximumObservationCount);
  const estimatedVelocity = estimateVelocity(state, recentObservations);

  return {
    ...state,
    probabilities,
    estimatedVelocity,
    lastObservation: observation,
    recentObservations,
    lastEvidenceAt: contact.timestamp,
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
    // 固定按四邻域分配，越界部分自然流失，避免概率被挤压并堆积在地图边缘。
    neighbors.forEach(([nextX, nextY]) => {
      const neighborIndex = nextY! * state.gridSize + nextX!;
      next[neighborIndex] = (next[neighborIndex] ?? 0) + probability * diffusion / 4;
    });
    const directedX = x + Math.sign(shiftX);
    const directedY = y + Math.sign(shiftY);
    if (directedX >= 0 && directedX < state.gridSize) {
      next[y * state.gridSize + directedX] = (next[y * state.gridSize + directedX] ?? 0) + probability * Math.abs(shiftX);
    }
    if (directedY >= 0 && directedY < state.gridSize) {
      next[directedY * state.gridSize + x] = (next[directedY * state.gridSize + x] ?? 0) + probability * Math.abs(shiftY);
    }
  });

  return {
    ...state,
    probabilities: next.map((value) => value * gameConfig.belief.decayRate),
    estimatedVelocity: {
      x: state.estimatedVelocity.x * gameConfig.belief.velocityDecayRate,
      y: state.estimatedVelocity.y * gameConfig.belief.velocityDecayRate,
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

export interface BeliefEstimate {
  position?: Vector2;
  probability: number;
  totalProbability: number;
  ageMs?: number;
  isValid: boolean;
}

export function getBeliefPeak(state: BeliefMapState, timestamp = state.lastUpdatedAt): BeliefEstimate {
  const maximum = Math.max(...state.probabilities);
  const index = state.probabilities.indexOf(maximum);
  const cellWidth = gameConfig.world.width / state.gridSize;
  const cellHeight = gameConfig.world.height / state.gridSize;
  const totalProbability = state.probabilities.reduce((sum, value) => sum + value, 0);
  const ageMs = state.lastEvidenceAt === undefined ? undefined : Math.max(0, timestamp - state.lastEvidenceAt);
  const isValid = index >= 0
    && ageMs !== undefined
    && ageMs <= gameConfig.belief.maximumBeliefAgeMs
    && maximum >= gameConfig.belief.minimumPeakProbability
    && totalProbability >= gameConfig.belief.minimumTotalProbability;
  if (!isValid) return { probability: Math.max(0, maximum), totalProbability, ageMs, isValid: false };

  const peakX = index % state.gridSize;
  const peakY = Math.floor(index / state.gridSize);
  let weightedX = 0;
  let weightedY = 0;
  let localWeight = 0;
  for (let y = Math.max(0, peakY - 1); y <= Math.min(state.gridSize - 1, peakY + 1); y += 1) {
    for (let x = Math.max(0, peakX - 1); x <= Math.min(state.gridSize - 1, peakX + 1); x += 1) {
      const weight = state.probabilities[y * state.gridSize + x] ?? 0;
      weightedX += (x + 0.5) * cellWidth * weight;
      weightedY += (y + 0.5) * cellHeight * weight;
      localWeight += weight;
    }
  }
  return {
    position: {
      x: weightedX / localWeight,
      y: weightedY / localWeight,
    },
    probability: Math.max(0, maximum),
    totalProbability,
    ageMs,
    isValid: true,
  };
}
