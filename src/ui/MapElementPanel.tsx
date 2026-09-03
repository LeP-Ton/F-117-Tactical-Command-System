import type { MissionSession } from "../domain/types";
import { useI18n } from "../i18n/I18n";
import { CollapsibleSection } from "./CollapsibleSection";
import { isSameMapSelection, type MapElementSelection } from "./mapSelection";

interface MapElementPanelProps {
  mission: MissionSession;
  showBelief: boolean;
  selection: MapElementSelection | null;
  onSelectionChange: (selection: MapElementSelection | null) => void;
  defaultExpandedGroups?: boolean;
}

export function MapElementPanel({ mission, showBelief, selection, onSelectionChange, defaultExpandedGroups = false }: MapElementPanelProps) {
  const { copy } = useI18n();
  const select = (next: MapElementSelection) => {
    onSelectionChange(isSameMapSelection(selection, next) ? null : next);
  };
  const buttonClass = (next: MapElementSelection) =>
    `map-element-row ${isSameMapSelection(selection, next) ? "selected" : ""}`;
  const radarItems = showBelief
    ? mission.radars.map((radar) => ({
      id: radar.id,
      title: `${radar.id} · ${copy.enums.radarType[radar.type]}`,
      detail: `${copy.mapElements.realPosition} · ${copy.mapElements.range} ${radar.range.toFixed(0)} u · ${copy.enums.operatorMode[radar.operator.mode]}`,
    }))
    : mission.radarIntel
      .filter((report) => report.estimatedPosition)
      .map((report) => {
        const identificationMark = report.level === "CONFIRMED" && report.positionErrorRadius === 0 ? "" : "?";
        return {
          id: report.radarId,
          title: `${report.radarId}${identificationMark} · ${copy.enums.radarType[report.radarType]}`,
          detail: report.positionErrorRadius === 0
            ? `${copy.enums.radarIntelLevel[report.level]} · ${copy.mapElements.verified}`
            : `${copy.enums.radarIntelLevel[report.level]} · ${copy.mapElements.positionError} ±${report.positionErrorRadius.toFixed(0)} u`,
        };
      });

  return (
    <CollapsibleSection className="map-elements-section" title={copy.mapElements.title}>
      <CollapsibleSection className="map-element-group" title={copy.mapElements.missionObjectives} meta="3" defaultExpanded={defaultExpandedGroups}>
        <div className="map-element-list">
          <button className={buttonClass({ kind: "AIRCRAFT" })} onClick={() => select({ kind: "AIRCRAFT" })}>
            <strong>F-117</strong><span>{copy.mapElements.aircraftDetail}</span>
          </button>
          <button className={buttonClass({ kind: "TARGET" })} onClick={() => select({ kind: "TARGET" })}>
            <strong>{copy.common.targetName}</strong><span>{copy.mapElements.targetDetail} {mission.target.attackRadius} u</span>
          </button>
          <button className={buttonClass({ kind: "EXTRACTION" })} onClick={() => select({ kind: "EXTRACTION" })}>
            <strong>{copy.mapElements.extraction}</strong><span>{copy.mapElements.extractionDetail}</span>
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection className="map-element-group" title={copy.mapElements.route} meta={mission.route.waypoints.length} defaultExpanded={defaultExpandedGroups}>
        <div className="map-element-list">
          {mission.route.waypoints.map((waypoint, index) => (
            <button key={waypoint.id} className={buttonClass({ kind: "WAYPOINT", id: waypoint.id })} onClick={() => select({ kind: "WAYPOINT", id: waypoint.id })}>
              <strong>{index === 0 ? "INS" : `WP-${String(index).padStart(2, "0")}`} · {copy.mapElements.waypoint}</strong>
              <span>{copy.enums.waypointStatus[waypoint.status]} · {copy.mapElements.navigationPoint}</span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection className="map-element-group" title={copy.mapElements.environment} meta={mission.terrain.length + mission.weather.length} defaultExpanded={defaultExpandedGroups}>
        <div className="map-element-list">
          {mission.terrain.map((terrain) => (
            <button key={terrain.id} className={buttonClass({ kind: "TERRAIN", id: terrain.id })} onClick={() => select({ kind: "TERRAIN", id: terrain.id })}>
              <strong>{terrain.id} · {copy.mapElements.mountain}</strong>
              <span>{copy.mapElements.radarMasking} {((1 - terrain.detectionFactor) * 100).toFixed(0)}% · {copy.mapElements.terrainCover}</span>
            </button>
          ))}
          {mission.weather.map((weather) => (
            <button key={weather.id} className={buttonClass({ kind: "WEATHER", id: weather.id })} onClick={() => select({ kind: "WEATHER", id: weather.id })}>
              <strong>{weather.id} · {copy.enums.weatherKind[weather.kind]}</strong>
              <span>{copy.mapElements.signalAttenuation} {((1 - weather.detectionFactor) * 100).toFixed(0)}% · {copy.mapElements.dynamicWeatherCell}</span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection className="map-element-group" title={copy.mapElements.radar} meta={radarItems.length} defaultExpanded={defaultExpandedGroups}>
        <div className="map-element-list">
          {radarItems.map((radar) => (
            <button key={radar.id} className={buttonClass({ kind: "RADAR", id: radar.id })} onClick={() => select({ kind: "RADAR", id: radar.id })}>
              <strong>{radar.title}</strong><span>{radar.detail}</span>
            </button>
          ))}
        </div>
      </CollapsibleSection>
    </CollapsibleSection>
  );
}
