import { canEditWaypoint } from "../domain/route";
import { distanceBetween } from "../domain/missionRules";
import type { MissionSession } from "../domain/types";
import type { GameAction } from "../game/gameReducer";
import { CollapsibleSection } from "./CollapsibleSection";

interface ControlPanelProps {
  mission: MissionSession;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  dispatch: (action: GameAction) => void;
  onOpenCampaign: () => void;
  onReturnCampaign: () => void;
}

const statusLabels = {
  PLANNING: "航线规划",
  RUNNING: "自动执行",
  PAUSED: "暂停重规划",
  SUCCESS: "任务成功",
  FAILED: "任务失败",
} as const;

export function ControlPanel({ mission, selectedIndex, onSelect, dispatch, onOpenCampaign, onReturnCampaign }: ControlPanelProps) {
  const editable = mission.status === "PLANNING" || mission.status === "PAUSED";
  const selectedEditable = editable && selectedIndex !== null && canEditWaypoint(mission.route, selectedIndex);
  const targetDistance = distanceBetween(mission.aircraft.position, mission.target.position);

  return (
    <aside className="control-panel">
      <section className="panel-section mission-status">
        <div className="section-kicker">MISSION CONTROL</div>
        <h2>{statusLabels[mission.status]}</h2>
        <div className="status-line">
          <span className={`status-dot status-${mission.status.toLowerCase()}`} />
          {mission.status === "RUNNING" ? "航电系统在线" : "等待指令"}
        </div>
        <div className="button-row">
          {mission.status === "PLANNING" && (
            <button className="secondary-button" onClick={onOpenCampaign}>战役地图</button>
          )}
          {mission.status === "PLANNING" && (
            <button
              className="primary-button"
              disabled={mission.route.waypoints.length < 2}
              onClick={() => dispatch({ type: "START" })}
            >
              开始执行
            </button>
          )}
          {mission.status === "RUNNING" && (
            <button className="primary-button" onClick={() => dispatch({ type: "PAUSE" })}>
              暂停 / 重规划
            </button>
          )}
          {mission.status === "PAUSED" && (
            <button className="primary-button" onClick={() => dispatch({ type: "RESUME" })}>
              继续执行
            </button>
          )}
          <button className="secondary-button" onClick={() => dispatch({ type: "RESET" })}>
            重置任务
          </button>
          {(mission.status === "SUCCESS" || mission.status === "FAILED") && (
            <button className="primary-button" onClick={() => {
              dispatch({ type: "RETURN_CAMPAIGN" });
              onReturnCampaign();
            }}>返回战役地图</button>
          )}
        </div>
      </section>

      <section className="panel-section objective-section">
        <div className="section-heading"><span>MISSION OBJECTIVE</span><span>{mission.target.id}</span></div>
        <div className={`objective-state ${mission.target.destroyed ? "destroyed" : ""}`}>
          {mission.target.destroyed ? "目标已摧毁 // 前往撤离区" : "目标仍有效 // 自动攻击待命"}
        </div>
        <div className="objective-meta">
          <span>距离 {targetDistance.toFixed(0)} u</span>
          <span>{mission.target.destroyed ? "弹药已投放" : "弹药待命"}</span>
        </div>
        <p className="hint">进入目标半径 {mission.target.attackRadius} u 后自动投弹；攻击会显著提高敌方警戒。</p>
      </section>

      <CollapsibleSection
        className="route-section"
        title="航点序列"
        meta={`${mission.route.waypoints.length - 1} NAV`}
      >
        <div className="waypoint-list">
          {mission.route.waypoints.map((waypoint, index) => {
            const canEdit = editable && canEditWaypoint(mission.route, index);
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
                {!canEdit && index !== 0 && <span className="lock-mark">◆</span>}
              </button>
            );
          })}
        </div>
        <div className="route-actions">
          <button
            disabled={!selectedEditable || selectedIndex === mission.route.activeWaypointIndex}
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
        <p className="hint">点击地图添加航点，拖动航点调整位置。飞行中需先暂停才能重规划。</p>
      </CollapsibleSection>
    </aside>
  );
}
