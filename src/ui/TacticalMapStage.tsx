import type { ReactNode } from "react";
import type { MissionSession } from "../domain/types";
import type { GameAction } from "../game/gameReducer";
import { TacticalMap } from "./TacticalMap";
import type { MapElementSelection } from "./mapSelection";

export type TacticalMapVariant = "MISSION" | "INTELLIGENCE" | "DEBRIEF";

interface TacticalMapStageProps {
  variant: TacticalMapVariant;
  mission: MissionSession;
  showBelief: boolean;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  dispatch: (action: GameAction) => void;
  mapSelection: MapElementSelection | null;
  readOnly?: boolean;
  toolbar?: ReactNode;
  statusText?: string;
}

const stageTitles: Record<TacticalMapVariant, string> = {
  MISSION: "TACTICAL AREA // 1000 × 1000",
  INTELLIGENCE: "MISSION INTELLIGENCE",
  DEBRIEF: "MISSION DEBRIEF",
};

export function TacticalMapStage({
  variant,
  mission,
  showBelief,
  selectedIndex,
  onSelect,
  dispatch,
  mapSelection,
  readOnly = false,
  toolbar,
  statusText,
}: TacticalMapStageProps) {
  const resolvedStatus = statusText ?? (showBelief ? "敌方内部状态" : "有限情报任务规划");
  const aircraftLabel = variant === "DEBRIEF" ? "F-117 最终位置" : "F-117";
  const radarLabel = showBelief
    ? "真实雷达 / 敌方 Contact"
    : variant === "DEBRIEF" ? "任务雷达情报" : "雷达情报 / 误差区";

  return <section className="map-stage">
    <div className="map-label"><span>{stageTitles[variant]}</span><span>{resolvedStatus}</span></div>
    {toolbar}
    <TacticalMap
      mission={mission}
      showBelief={showBelief}
      selectedIndex={selectedIndex}
      onSelect={onSelect}
      dispatch={dispatch}
      mapSelection={mapSelection}
      readOnly={readOnly}
    />
    <div className="map-legend">
      <span><i className="legend-aircraft" />{aircraftLabel}</span>
      {variant === "MISSION" && <span><i className="legend-waypoint" />航点</span>}
      <span><i className="legend-extraction" />撤离区</span>
      <span><i className="legend-radar" />{radarLabel}</span>
    </div>
  </section>;
}
