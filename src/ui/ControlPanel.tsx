import { canEditWaypoint, getPlannedRouteDistance, getRemainingRouteDistance } from "../domain/route";
import { distanceBetween, distanceToExtraction } from "../domain/missionRules";
import type { MissionSession } from "../domain/types";
import type { GameAction } from "../game/gameReducer";
import { CollapsibleSection } from "./CollapsibleSection";
import { WeatherForecastPanel } from "./WeatherForecastPanel";
import { useI18n } from "../i18n/I18n";

interface ControlPanelProps {
  mission: MissionSession;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  dispatch: (action: GameAction) => void;
  onOpenCampaign: () => void;
  onReturnCampaign: () => void;
  onOpenDebrief?: () => void;
}

export function ControlPanel({ mission, selectedIndex, onSelect, dispatch, onOpenCampaign, onReturnCampaign, onOpenDebrief }: ControlPanelProps) {
  const { copy } = useI18n();
  const editable = mission.status === "PLANNING" || mission.status === "RUNNING";
  const editMode = mission.status === "RUNNING" ? "RUNNING" : "PLANNING";
  const selectedEditable = editable && selectedIndex !== null && canEditWaypoint(mission.route, selectedIndex, editMode);
  const targetDistance = distanceBetween(mission.aircraft.position, mission.target.position);
  const extractionDistance = distanceToExtraction(mission.aircraft.position, mission.extractionArea);
  const plannedRouteDistance = getPlannedRouteDistance(mission.route);
  const remainingRouteDistance = getRemainingRouteDistance(mission.route, mission.aircraft.position);

  return (
    <aside className="control-panel">
      <section className="panel-section mission-status">
        <div className="section-kicker">{copy.control.kicker}</div>
        <h2>{copy.control.status[mission.status]}</h2>
        <div className="status-line">
          <span className={`status-dot status-${mission.status.toLowerCase()}`} />
          {copy.control.statusMessage[mission.status]}
        </div>
        <div className="button-row">
          {mission.status === "PLANNING" && (
            <button className="primary-button return-network-button" onClick={onOpenCampaign}>{copy.control.returnNetwork}</button>
          )}
          {mission.status === "PLANNING" && (
            <button
              className="primary-button"
              disabled={mission.route.waypoints.length < 2}
              onClick={() => dispatch({ type: "START" })}
            >
              {copy.control.confirmRoute}
            </button>
          )}
          {mission.status === "PLANNING" && <button className="secondary-button" onClick={() => dispatch({ type: "RESET" })}>
            {copy.control.resetRoute}
          </button>}
          {(mission.status === "SUCCESS" || mission.status === "FAILED") && (
            mission.status === "SUCCESS" && onOpenDebrief ? <button className="secondary-button" onClick={onOpenDebrief}>{copy.control.debriefMission}</button> : null
          )}
          {(mission.status === "SUCCESS" || mission.status === "FAILED") && (
            <button className="primary-button return-network-button" onClick={() => {
              dispatch({ type: "RETURN_CAMPAIGN" });
              onReturnCampaign();
            }}>{copy.control.returnNetwork}</button>
          )}
        </div>
      </section>

      <section className="panel-section objective-section">
        <div className="section-heading"><span>{copy.control.targetDesignation}</span><span>{copy.common.targetName}</span></div>
        <div className={`objective-state ${mission.target.destroyed ? "destroyed" : ""}`}>
          {mission.target.destroyed ? copy.control.targetDestroyed : copy.control.targetValid}
        </div>
        <div className="objective-meta">
          <div><span>{mission.target.destroyed ? copy.control.extractionDistance : copy.control.targetDistance}</span><strong>{(mission.target.destroyed ? extractionDistance : targetDistance).toFixed(0)} u</strong></div>
          <div><span>{copy.control.weaponStatus}</span><strong>{mission.target.destroyed ? copy.control.weaponReleased : copy.control.weaponReady}</strong></div>
        </div>
      </section>

      <CollapsibleSection
        className="route-section"
        title={copy.control.waypointSequence}
        meta={formatWaypointCount(mission.route.waypoints.length - 1, copy.common.countUnit)}
      >
        <div className="route-distance-summary">
          <div><span>{copy.control.plannedDistance}</span><strong>{plannedRouteDistance.toFixed(0)} u</strong></div>
          <div><span>{copy.control.remainingDistance}</span><strong>{remainingRouteDistance.toFixed(0)} u</strong></div>
        </div>
        <div className="waypoint-list">
          {mission.route.waypoints.map((waypoint, index) => {
            return (
              <button
                type="button"
                key={waypoint.id}
                className={`waypoint-row ${index === selectedIndex ? "selected" : ""}`}
                onClick={() => onSelect(index)}
              >
                <span className="waypoint-index">{index === 0 ? "INS" : String(index).padStart(2, "0")}</span>
                <span className="waypoint-coordinate">
                  X {Math.round(waypoint.position.x).toString().padStart(4, "0")} / Y {Math.round(waypoint.position.y).toString().padStart(4, "0")}
                </span>
                <span className={`waypoint-state state-${waypoint.status.toLowerCase()}`}>
                  {copy.enums.waypointStatus[waypoint.status]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="route-actions">
          <button
            disabled={!selectedEditable || selectedIndex === 1 || (selectedIndex !== null && !canEditWaypoint(mission.route, selectedIndex - 1, editMode))}
            onClick={() => selectedIndex !== null && dispatch({ type: "REORDER_WAYPOINT", fromIndex: selectedIndex, toIndex: selectedIndex - 1 })}
          >
            {copy.control.moveUp}
          </button>
          <button
            disabled={!selectedEditable || selectedIndex === mission.route.waypoints.length - 1}
            onClick={() => selectedIndex !== null && dispatch({ type: "REORDER_WAYPOINT", fromIndex: selectedIndex, toIndex: selectedIndex + 1 })}
          >
            {copy.control.moveDown}
          </button>
          <button
            className="danger-button"
            disabled={!selectedEditable}
            onClick={() => {
              if (selectedIndex !== null) dispatch({ type: "REMOVE_WAYPOINT", index: selectedIndex });
              onSelect(null);
            }}
          >
            {copy.control.remove}
          </button>
        </div>
        <p className="hint">{copy.control.routeHint}</p>
      </CollapsibleSection>

      <WeatherForecastPanel mission={mission} defaultExpanded={false} />
    </aside>
  );
}

function formatWaypointCount(value: number, countUnit: string): string {
  return countUnit ? `${value} ${countUnit}` : `${value} NAV`;
}
