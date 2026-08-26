import { canEditWaypoint, getPlannedRouteDistance, getRemainingRouteDistance } from "../domain/route";
import { distanceBetween, distanceToExtraction } from "../domain/missionRules";
import type { MissionSession } from "../domain/types";
import type { GameAction } from "../game/gameReducer";
import { CollapsibleSection } from "./CollapsibleSection";
import { WeatherForecastPanel } from "./WeatherForecastPanel";

interface ControlPanelProps {
  mission: MissionSession;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  dispatch: (action: GameAction) => void;
  onOpenCampaign: () => void;
  onReturnCampaign: () => void;
  onOpenDebrief?: () => void;
}

const statusLabels = {
  PLANNING: "规划任务",
  RUNNING: "任务执行",
  SUCCESS: "任务成功",
  FAILED: "任务失败",
} as const;

const statusMessages = {
  PLANNING: "等待航线确认",
  RUNNING: "航电系统在线",
  SUCCESS: "任务目标达成",
  FAILED: "任务终止",
} as const;

export function ControlPanel({ mission, selectedIndex, onSelect, dispatch, onOpenCampaign, onReturnCampaign, onOpenDebrief }: ControlPanelProps) {
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
        <div className="section-kicker">MISSION CONTROL</div>
        <h2>{statusLabels[mission.status]}</h2>
        <div className="status-line">
          <span className={`status-dot status-${mission.status.toLowerCase()}`} />
          {statusMessages[mission.status]}
        </div>
        <div className="button-row">
          {mission.status === "PLANNING" && (
            <button className="primary-button return-network-button" onClick={onOpenCampaign}>返回任务网络</button>
          )}
          {mission.status === "PLANNING" && (
            <button
              className="primary-button"
              disabled={mission.route.waypoints.length < 2}
              onClick={() => dispatch({ type: "START" })}
            >
              确认航线
            </button>
          )}
          {mission.status === "PLANNING" && <button className="secondary-button" onClick={() => dispatch({ type: "RESET" })}>
            重置航线
          </button>}
          {(mission.status === "SUCCESS" || mission.status === "FAILED") && (
            mission.status === "SUCCESS" && onOpenDebrief ? <button className="secondary-button" onClick={onOpenDebrief}>复盘任务</button> : null
          )}
          {(mission.status === "SUCCESS" || mission.status === "FAILED") && (
            <button className="primary-button return-network-button" onClick={() => {
              dispatch({ type: "RETURN_CAMPAIGN" });
              onReturnCampaign();
            }}>返回任务网络</button>
          )}
        </div>
      </section>

      <section className="panel-section objective-section">
        <div className="section-heading"><span>TARGET DESIGNATION</span><span>{mission.target.id}</span></div>
        <div className={`objective-state ${mission.target.destroyed ? "destroyed" : ""}`}>
          {mission.target.destroyed ? "目标摧毁 // 转入撤离航段" : "目标有效"}
        </div>
        <div className="objective-meta">
          <div><span>{mission.target.destroyed ? "撤离区距离" : "目标距离"}</span><strong>{(mission.target.destroyed ? extractionDistance : targetDistance).toFixed(0)} u</strong></div>
          <div><span>武器状态</span><strong>{mission.target.destroyed ? "已投放" : "待命"}</strong></div>
        </div>
      </section>

      <CollapsibleSection
        className="route-section"
        title="航点序列"
        meta={`${mission.route.waypoints.length - 1} NAV`}
      >
        <div className="route-distance-summary">
          <div><span>规划总航程</span><strong>{plannedRouteDistance.toFixed(0)} u</strong></div>
          <div><span>剩余航程</span><strong>{remainingRouteDistance.toFixed(0)} u</strong></div>
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
                  {waypoint.status === "COMPLETED" ? "完成" : waypoint.status === "LOCKED" ? "锁定" : "待飞"}
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
            上移
          </button>
          <button
            disabled={!selectedEditable || selectedIndex === mission.route.waypoints.length - 1}
            onClick={() => selectedIndex !== null && dispatch({ type: "REORDER_WAYPOINT", fromIndex: selectedIndex, toIndex: selectedIndex + 1 })}
          >
            下移
          </button>
          <button
            className="danger-button"
            disabled={!selectedEditable}
            onClick={() => {
              if (selectedIndex !== null) dispatch({ type: "REMOVE_WAYPOINT", index: selectedIndex });
              onSelect(null);
            }}
          >
            删除
          </button>
        </div>
        <p className="hint">点击地图添加航点，拖动航点调整位置。任务执行中仅可调整当前目标之后的航点。</p>
      </CollapsibleSection>

      <WeatherForecastPanel mission={mission} defaultExpanded={false} />
    </aside>
  );
}
