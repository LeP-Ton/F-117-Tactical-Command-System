import type { ReactNode } from "react";
import type { MissionSession } from "../domain/types";
import type { GameAction } from "../game/gameReducer";
import { TacticalMap } from "./TacticalMap";
import type { MapElementSelection } from "./mapSelection";
import { useI18n } from "../i18n/I18n";

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
  const { copy } = useI18n();
  const resolvedStatus = statusText ?? (showBelief ? copy.stage.enemyInternal : copy.stage.limitedPlanning);
  const aircraftLabel = variant === "DEBRIEF" ? copy.stage.aircraftFinalPosition : "F-117";
  const radarLabel = showBelief
    ? copy.stage.realRadarContact
    : variant === "DEBRIEF" ? copy.stage.missionRadarIntel : copy.stage.radarIntelError;

  return <section className="map-stage" data-tutorial="tactical-map">
    <div className="map-label"><span>{copy.stage.title[variant]}</span><span>{resolvedStatus}</span></div>
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
      {variant === "MISSION" && <span><i className="legend-waypoint" />{copy.stage.waypoint}</span>}
      <span><i className="legend-extraction" />{copy.stage.extraction}</span>
      <span><i className="legend-radar" />{radarLabel}</span>
    </div>
  </section>;
}
