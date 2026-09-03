import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { gameConfig } from "../config/gameConfig";
import { getBeliefHeatmapOpacityScale, getBeliefPeak } from "../domain/beliefMap";
import { canEditWaypoint } from "../domain/route";
import type { MissionSession, RadarType, Vector2 } from "../domain/types";
import type { GameAction } from "../game/gameReducer";
import f117TopSilhouette from "../assets/f117-top-silhouette.png";
import type { MapElementSelection } from "./mapSelection";
import { useI18n } from "../i18n/I18n";
import {
  getSelectionCornerSegments,
  getSelectionPulseOpacity,
  type SelectionHighlightBounds,
} from "./mapSelectionHighlight";

interface TacticalMapProps {
  mission: MissionSession;
  showBelief: boolean;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  dispatch: (action: GameAction) => void;
  mapSelection: MapElementSelection | null;
  readOnly?: boolean;
}

interface CanvasMetrics {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

const radarContactColors: Record<RadarType, { stroke: string; fill: string }> = {
  EARLY_WARNING: { stroke: "rgba(224, 176, 72, 0.36)", fill: "rgba(224, 176, 72, 0.035)" },
  ACQUISITION: { stroke: "rgba(224, 112, 78, 0.36)", fill: "rgba(224, 112, 78, 0.035)" },
  FIRE_CONTROL: { stroke: "rgba(229, 74, 62, 0.4)", fill: "rgba(229, 74, 62, 0.04)" },
};

function getMetrics(canvas: HTMLCanvasElement): CanvasMetrics {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const scale = Math.min(width / gameConfig.world.width, height / gameConfig.world.height);
  return {
    width,
    height,
    scale,
    offsetX: (width - gameConfig.world.width * scale) / 2,
    offsetY: (height - gameConfig.world.height * scale) / 2,
  };
}

function worldToScreen(position: Vector2, metrics: CanvasMetrics): Vector2 {
  return {
    x: metrics.offsetX + position.x * metrics.scale,
    y: metrics.offsetY + position.y * metrics.scale,
  };
}

function screenToWorld(canvas: HTMLCanvasElement, clientX: number, clientY: number): Vector2 {
  const rect = canvas.getBoundingClientRect();
  const metrics = getMetrics(canvas);
  return {
    x: Math.max(0, Math.min(gameConfig.world.width, (clientX - rect.left - metrics.offsetX) / metrics.scale)),
    y: Math.max(0, Math.min(gameConfig.world.height, (clientY - rect.top - metrics.offsetY) / metrics.scale)),
  };
}

function drawAircraft(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  position: Vector2,
  heading: number,
): void {
  if (!image.complete || image.naturalWidth === 0) return;

  context.save();
  context.translate(position.x, position.y);
  context.rotate((heading * Math.PI) / 180);
  // 图片机头朝上，与航向 0° 的地图坐标基准一致，无需额外角度修正。
  context.drawImage(image, -16, -24, 32, 48);
  context.restore();
}

function createCircleHighlight(center: Vector2, radius: number): SelectionHighlightBounds {
  return {
    x: center.x - radius,
    y: center.y - radius,
    width: radius * 2,
    height: radius * 2,
  };
}

function resolveSelectionHighlight(
  mission: MissionSession,
  selection: MapElementSelection,
  showBelief: boolean,
): SelectionHighlightBounds | undefined {
  if (selection.kind === "AIRCRAFT") {
    return createCircleHighlight(mission.aircraft.position, 34);
  }
  if (selection.kind === "TARGET") {
    return createCircleHighlight(mission.target.position, mission.target.attackRadius + 12);
  }
  if (selection.kind === "EXTRACTION") {
    const area = mission.extractionArea;
    return {
      x: area.x - 8,
      y: area.y - 8,
      width: area.width + 16,
      height: area.height + 16,
    };
  }
  if (selection.kind === "WAYPOINT") {
    const waypoint = mission.route.waypoints.find((item) => item.id === selection.id);
    return waypoint ? createCircleHighlight(waypoint.position, 22) : undefined;
  }
  if (selection.kind === "TERRAIN") {
    const terrain = mission.terrain.find((item) => item.id === selection.id);
    return terrain
      ? {
          x: terrain.x - 8,
          y: terrain.y - 8,
          width: terrain.width + 16,
          height: terrain.height + 16,
        }
      : undefined;
  }
  if (selection.kind === "WEATHER") {
    const weather = mission.weather.find((item) => item.id === selection.id);
    return weather
      ? {
          x: weather.x - 8,
          y: weather.y - 8,
          width: weather.width + 16,
          height: weather.height + 16,
        }
      : undefined;
  }

  const radarPosition = showBelief
    ? mission.radars.find((radar) => radar.id === selection.id)?.position
    : mission.radarIntel.find((radar) => radar.radarId === selection.id)?.estimatedPosition;
  return radarPosition ? createCircleHighlight(radarPosition, 24) : undefined;
}

export function TacticalMap({ mission, showBelief, selectedIndex, onSelect, dispatch, mapSelection, readOnly = false }: TacticalMapProps) {
  const { copy } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const editable = mission.status === "PLANNING" || mission.status === "RUNNING";
  const editMode = mission.status === "RUNNING" ? "RUNNING" : "PLANNING";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const aircraftImage = new Image();
    aircraftImage.src = f117TopSilhouette;
    let animationFrameId: number | undefined;
    let disposed = false;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const render = (timestampMs = performance.now()) => {
      const pixelRatio = window.devicePixelRatio || 1;
      const metrics = getMetrics(canvas);
      const pixelWidth = Math.round(metrics.width * pixelRatio);
      const pixelHeight = Math.round(metrics.height * pixelRatio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, metrics.width, metrics.height);
      context.fillStyle = "#07100e";
      context.fillRect(0, 0, metrics.width, metrics.height);

      context.save();
      context.translate(metrics.offsetX, metrics.offsetY);
      context.scale(metrics.scale, metrics.scale);

      context.strokeStyle = "rgba(75, 133, 116, 0.18)";
      context.lineWidth = 1 / metrics.scale;
      for (let value = 0; value <= gameConfig.world.width; value += gameConfig.world.gridStep) {
        context.beginPath();
        context.moveTo(value, 0);
        context.lineTo(value, gameConfig.world.height);
        context.stroke();
      }
      for (let value = 0; value <= gameConfig.world.height; value += gameConfig.world.gridStep) {
        context.beginPath();
        context.moveTo(0, value);
        context.lineTo(gameConfig.world.width, value);
        context.stroke();
      }

      if (showBelief) {
        const cellWidth = gameConfig.world.width / mission.beliefMap.gridSize;
        const cellHeight = gameConfig.world.height / mission.beliefMap.gridSize;
        const peak = Math.max(...mission.beliefMap.probabilities, 0.0001);
        const estimate = getBeliefPeak(mission.beliefMap, mission.elapsedMs);
        const opacityScale = getBeliefHeatmapOpacityScale(estimate);
        mission.beliefMap.probabilities.forEach((probability, index) => {
          const intensity = Math.min(1, probability / peak);
          if (intensity < 0.015 || opacityScale === 0) return;
          const x = (index % mission.beliefMap.gridSize) * cellWidth;
          const y = Math.floor(index / mission.beliefMap.gridSize) * cellHeight;
          const alpha = (0.08 + intensity * 0.48) * opacityScale;
          context.fillStyle = `rgba(255, ${Math.round(185 - intensity * 105)}, 45, ${alpha})`;
          context.fillRect(x, y, cellWidth, cellHeight);
        });
      }

      const weatherColors = {
        CLOUD: ["rgba(96, 130, 135, 0.16)", "rgba(118, 155, 158, 0.4)"],
        RAIN: ["rgba(62, 105, 132, 0.2)", "rgba(82, 143, 176, 0.52)"],
        STORM: ["rgba(91, 78, 126, 0.27)", "rgba(151, 126, 180, 0.62)"],
        FOG: ["rgba(142, 154, 150, 0.17)", "rgba(178, 190, 184, 0.42)"],
      } as const;
      mission.weather.forEach((weather) => {
        const [fill, stroke] = weatherColors[weather.kind];
        context.fillStyle = fill;
        context.strokeStyle = stroke;
        context.lineWidth = 1 / metrics.scale;
        context.setLineDash([7 / metrics.scale, 6 / metrics.scale]);
        context.fillRect(weather.x, weather.y, weather.width, weather.height);
        context.strokeRect(weather.x, weather.y, weather.width, weather.height);
        context.setLineDash([]);
        context.fillStyle = "#819a9c";
        context.font = "12px monospace";
        context.fillText(copy.enums.weatherKind[weather.kind], weather.x + 9, weather.y + 19);
      });

      // 出动前预报使用任务绝对时刻；执行中仅保留尚未到达的预测轮廓。
      if (editable) mission.weatherForecast
        .filter((forecast) => forecast.horizonSeconds * 1000 > mission.elapsedMs)
        .forEach((forecast) => {
        context.save();
        context.setLineDash([3 / metrics.scale, 9 / metrics.scale]);
        context.strokeStyle = forecast.confidence === "高"
          ? "rgba(105, 180, 190, 0.46)"
          : forecast.confidence === "中" ? "rgba(105, 180, 190, 0.3)" : "rgba(105, 180, 190, 0.18)";
        context.lineWidth = 1 / metrics.scale;
        context.strokeRect(
          forecast.estimatedPosition.x,
          forecast.estimatedPosition.y,
          forecast.estimatedSize.width,
          forecast.estimatedSize.height,
        );
        context.fillStyle = "rgba(117, 177, 181, 0.65)";
        context.font = "9px monospace";
        context.fillText(`${copy.common.taskTimePrefix}${forecast.horizonSeconds}${copy.common.secondsUnit} ${copy.enums.weatherKind[forecast.kind]}`, forecast.estimatedPosition.x + 5, forecast.estimatedPosition.y + 12);
        context.restore();
      });

      const extractionArea = mission.extractionArea;
      context.save();
      context.fillStyle = "rgba(63, 191, 154, 0.08)";
      context.strokeStyle = "rgba(63, 191, 154, 0.55)";
      context.lineWidth = 2 / metrics.scale;
      context.fillRect(extractionArea.x, extractionArea.y, extractionArea.width, extractionArea.height);
      context.strokeRect(extractionArea.x, extractionArea.y, extractionArea.width, extractionArea.height);
      context.fillStyle = "#60c8a6";
      context.font = "12px monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        copy.canvas.extraction,
        extractionArea.x + extractionArea.width / 2,
        extractionArea.y + extractionArea.height / 2,
      );
      context.restore();

      context.beginPath();
      context.arc(mission.target.position.x, mission.target.position.y, mission.target.attackRadius, 0, Math.PI * 2);
      context.fillStyle = mission.target.destroyed ? "rgba(75, 91, 84, 0.16)" : "rgba(219, 82, 56, 0.1)";
      context.fill();
      context.strokeStyle = mission.target.destroyed ? "#596b64" : "#e05f43";
      context.lineWidth = 2 / metrics.scale;
      context.stroke();
      context.fillStyle = mission.target.destroyed ? "#65736e" : "#ea7658";
      context.fillRect(mission.target.position.x - 10, mission.target.position.y - 10, 20, 20);
      context.font = "12px monospace";
      context.fillText(mission.target.destroyed ? copy.canvas.destroyed : copy.canvas.target, mission.target.position.x + 16, mission.target.position.y + 4);

      mission.terrain.forEach((terrain) => {
        context.fillStyle = "rgba(73, 102, 84, 0.3)";
        context.strokeStyle = "rgba(111, 143, 119, 0.5)";
        context.lineWidth = 1 / metrics.scale;
        context.fillRect(terrain.x, terrain.y, terrain.width, terrain.height);
        context.strokeRect(terrain.x, terrain.y, terrain.width, terrain.height);
        context.fillStyle = "#718f7e";
        context.font = "13px monospace";
        context.fillText(copy.canvas.terrainMasking, terrain.x + 10, terrain.y + 22);
      });

      if (!showBelief) mission.radarIntel.forEach((report) => {
        if (!report.estimatedPosition) return;
        const position = report.estimatedPosition;
        context.save();
        context.setLineDash([8 / metrics.scale, 6 / metrics.scale]);
        if (report.estimatedRange !== undefined) {
          context.beginPath();
          context.arc(position.x, position.y, report.estimatedRange, 0, Math.PI * 2);
          context.strokeStyle = "rgba(242, 189, 74, 0.3)";
          context.lineWidth = 2 / metrics.scale;
          context.stroke();
        }
        context.beginPath();
        context.arc(position.x, position.y, report.positionErrorRadius, 0, Math.PI * 2);
        context.fillStyle = "rgba(242, 189, 74, 0.06)";
        context.fill();
        context.strokeStyle = "rgba(242, 189, 74, 0.72)";
        context.stroke();
        context.setLineDash([]);
        context.translate(position.x, position.y);
        context.rotate(Math.PI / 4);
        context.fillStyle = "#d9aa45";
        context.fillRect(-6, -6, 12, 12);
        context.restore();
        context.fillStyle = "#e4bd63";
        context.font = "12px monospace";
        const identificationMark = report.level === "CONFIRMED" && report.positionErrorRadius === 0 ? "" : "?";
        context.fillText(
          `${report.radarId}${identificationMark} ${copy.enums.radarType[report.radarType]} ${copy.enums.radarIntelLevel[report.level]}`,
          position.x + 12,
          position.y + 4,
        );
      });

      if (showBelief) mission.radars.forEach((radar) => {
        const radarColor = radar.type === "EARLY_WARNING"
          ? "rgba(224, 176, 72, 0.76)"
          : radar.type === "FIRE_CONTROL" ? "rgba(229, 74, 62, 0.82)" : "rgba(224, 112, 78, 0.78)";
        context.beginPath();
        context.arc(radar.position.x, radar.position.y, radar.range, 0, Math.PI * 2);
        context.strokeStyle = radarColor.replace(/0\.\d+\)$/, "0.24)");
        context.lineWidth = 2 / metrics.scale;
        context.stroke();
        const sweepRadians = ((radar.sweepAngleDegrees - 90) * Math.PI) / 180;
        context.beginPath();
        context.moveTo(radar.position.x, radar.position.y);
        context.lineTo(
          radar.position.x + Math.cos(sweepRadians) * radar.range,
          radar.position.y + Math.sin(sweepRadians) * radar.range,
        );
        context.strokeStyle = radarColor;
        context.stroke();
        context.fillStyle = radarColor;
        context.fillRect(radar.position.x - 6, radar.position.y - 6, 12, 12);
        context.font = "12px monospace";
        context.fillText(`${radar.id} ${copy.enums.radarType[radar.type]} ${copy.enums.operatorMode[radar.operator.mode]}`, radar.position.x + 12, radar.position.y + 4);
      });

      if (showBelief) mission.radarContacts.forEach((contact) => {
        const radarType = mission.radars.find((radar) => radar.id === contact.radarId)?.type ?? "EARLY_WARNING";
        const contactColor = radarContactColors[radarType];
        context.beginPath();
        context.arc(contact.estimatedPosition.x, contact.estimatedPosition.y, contact.errorRadius, 0, Math.PI * 2);
        context.fillStyle = contactColor.fill;
        context.fill();
        context.strokeStyle = contactColor.stroke;
        context.lineWidth = 1 / metrics.scale;
        context.stroke();
        context.beginPath();
        context.moveTo(contact.estimatedPosition.x - 8, contact.estimatedPosition.y);
        context.lineTo(contact.estimatedPosition.x + 8, contact.estimatedPosition.y);
        context.moveTo(contact.estimatedPosition.x, contact.estimatedPosition.y - 8);
        context.lineTo(contact.estimatedPosition.x, contact.estimatedPosition.y + 8);
        context.stroke();
      });

      if (showBelief && mission.commander.targetPosition) {
        const target = mission.commander.targetPosition;
        context.strokeStyle = "rgba(231, 88, 60, 0.8)";
        context.lineWidth = 2 / metrics.scale;
        context.beginPath();
        context.arc(target.x, target.y, 18, 0, Math.PI * 2);
        context.moveTo(target.x - 26, target.y);
        context.lineTo(target.x + 26, target.y);
        context.moveTo(target.x, target.y - 26);
        context.lineTo(target.x, target.y + 26);
        context.stroke();
        context.fillStyle = "#e56a4d";
        context.font = "12px monospace";
        context.fillText(copy.canvas.commandTarget, target.x + 22, target.y - 18);
      }

      context.beginPath();
      mission.route.waypoints.forEach((waypoint, index) => {
        if (index === 0) context.moveTo(waypoint.position.x, waypoint.position.y);
        else context.lineTo(waypoint.position.x, waypoint.position.y);
      });
      context.strokeStyle = "rgba(98, 211, 178, 0.7)";
      context.lineWidth = 3 / metrics.scale;
      context.setLineDash([10 / metrics.scale, 7 / metrics.scale]);
      context.stroke();
      context.setLineDash([]);

      mission.route.waypoints.forEach((waypoint, index) => {
        const completed = waypoint.status === "COMPLETED";
        context.beginPath();
        context.arc(waypoint.position.x, waypoint.position.y, index === selectedIndex ? 13 : 10, 0, Math.PI * 2);
        context.fillStyle = completed ? "#36544b" : index === selectedIndex ? "#f2bd4a" : "#52caa6";
        context.fill();
        context.strokeStyle = "#07100e";
        context.lineWidth = 3 / metrics.scale;
        context.stroke();
        context.fillStyle = "#cfe8df";
        context.font = "14px monospace";
        context.fillText(index === 0 ? "INS" : String(index).padStart(2, "0"), waypoint.position.x + 16, waypoint.position.y + 5);
      });

      drawAircraft(context, aircraftImage, mission.aircraft.position, mission.aircraft.headingDegrees);

      const selectionHighlight = mapSelection
        ? resolveSelectionHighlight(mission, mapSelection, showBelief)
        : undefined;
      if (selectionHighlight) {
        context.save();
        const pulseOpacity = reduceMotion ? 0.78 : getSelectionPulseOpacity(timestampMs);
        const cornerSegments = getSelectionCornerSegments(
          selectionHighlight,
          7 / metrics.scale,
          15 / metrics.scale,
        );
        context.setLineDash([]);
        context.strokeStyle = `rgba(255, 220, 112, ${pulseOpacity})`;
        context.lineWidth = 2 / metrics.scale;
        context.lineCap = "square";
        context.shadowColor = `rgba(255, 196, 64, ${pulseOpacity * 0.72})`;
        context.shadowBlur = (4 + pulseOpacity * 5) / metrics.scale;
        context.beginPath();
        cornerSegments.forEach((segment) => {
          context.moveTo(segment.from.x, segment.from.y);
          context.lineTo(segment.to.x, segment.to.y);
        });
        context.stroke();
        context.restore();
      }
      context.restore();
    };

    const renderAnimatedFrame = (timestampMs: number) => {
      render(timestampMs);
      if (!disposed) {
        animationFrameId = window.requestAnimationFrame(renderAnimatedFrame);
      }
    };
    const handleImageLoad = () => render(performance.now());

    aircraftImage.addEventListener("load", handleImageLoad);
    if (mapSelection && !reduceMotion) {
      animationFrameId = window.requestAnimationFrame(renderAnimatedFrame);
    } else {
      render();
    }
    const observer = new ResizeObserver(() => render(performance.now()));
    observer.observe(canvas);
    return () => {
      disposed = true;
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
      }
      aircraftImage.removeEventListener("load", handleImageLoad);
      observer.disconnect();
    };
  }, [copy, mission, selectedIndex, showBelief, mapSelection]);

  const findWaypointIndex = (position: Vector2): number => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;
    const metrics = getMetrics(canvas);
    return mission.route.waypoints.findIndex((waypoint) => {
      const screen = worldToScreen(waypoint.position, metrics);
      return Math.hypot(screen.x - position.x, screen.y - position.y) <= gameConfig.interaction.waypointHitRadius;
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hitIndex = findWaypointIndex({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    if (hitIndex >= 0) {
      onSelect(hitIndex);
      if (editable && canEditWaypoint(mission.route, hitIndex, editMode)) {
        setDraggingIndex(hitIndex);
        canvas.setPointerCapture(event.pointerId);
      }
      return;
    }
    if (editable) {
      dispatch({ type: "ADD_WAYPOINT", position: screenToWorld(canvas, event.clientX, event.clientY) });
      onSelect(mission.route.waypoints.length);
    } else {
      onSelect(null);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || draggingIndex === null) return;
    dispatch({ type: "MOVE_WAYPOINT", index: draggingIndex, position: screenToWorld(canvas, event.clientX, event.clientY) });
  };

  return (
    <canvas
      ref={canvasRef}
      className="tactical-map"
      aria-label={copy.canvas.mapLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setDraggingIndex(null)}
      onPointerCancel={() => setDraggingIndex(null)}
    />
  );
}
