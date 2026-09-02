import { getWeatherSpeedFactor } from "../../domain/weatherSystem";
import type { MissionSession } from "../../domain/types";
import type { GameAction } from "../../game/gameReducer";
import { CollapsibleSection } from "../CollapsibleSection";
import { ControlPanel } from "../ControlPanel";
import { DeploymentBriefingPanel } from "../DeploymentBriefingPanel";
import { EnemyStateSummary, RadarOperatorList, intentLabels } from "../EnemySystemPanels";
import { MapElementPanel } from "../MapElementPanel";
import type { MapElementSelection } from "../mapSelection";
import { TacticalMapStage } from "../TacticalMapStage";
import { TacticalWorkspace } from "../TacticalWorkspace";

const eventLabels: Record<string, string> = {
  WAYPOINT_ADDED: "新增航点", WAYPOINT_MOVED: "调整航点", WAYPOINT_REMOVED: "删除航点", WAYPOINT_REORDERED: "航点排序",
  MISSION_STARTED: "开始执行", MISSION_PAUSED: "任务暂停", MISSION_RESUMED: "继续执行", MISSION_RESET: "任务重置",
  WAYPOINT_REACHED: "抵达航点", ROUTE_COMPLETED: "航线完成", RADAR_CONTACT: "雷达接触", RADAR_MODE_CHANGED: "雷达模式切换",
  AWARENESS_STAGE_CHANGED: "警戒阶段变化", COMMANDER_ORDER: "Commander 命令", ATTACK: "武器投放", EXTRACTION: "进入撤离区",
  MISSION_SUCCESS: "任务成功", MISSION_FAILED: "任务失败", THREAT_STAGE_CHANGED: "威胁阶段变化", MISSILE_LAUNCHED: "导弹发射",
  MISSILE_DEFEATED: "导弹脱锁", AIRCRAFT_DESTROYED: "飞机损毁", FUEL_EXHAUSTED: "燃油耗尽",
};

const threatLabels = {
  UNDETECTED: "未发现异常", SUSPECTED: "疑似搜索活动", TRACKED: "持续照射 / 正在跟踪",
  LOCKED: "火控锁定", MISSILE_INBOUND: "导弹来袭",
} as const;

interface MissionWorkspaceProps {
  mission: MissionSession;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  dispatch: (action: GameAction) => void;
  showBelief: boolean;
  canUseAiDebug: boolean;
  onToggleBelief: () => void;
  adaptationStatus: "LOW" | "ACTIVE" | "HIGH";
  mapSelection: MapElementSelection | null;
  onMapSelectionChange: (selection: MapElementSelection | null) => void;
  onOpenCampaign: () => void;
  onReturnCampaign: () => void;
  onOpenDebrief?: () => void;
}

export function MissionWorkspace(props: MissionWorkspaceProps) {
  const { mission, selectedIndex, onSelect, dispatch, showBelief, canUseAiDebug, onToggleBelief, adaptationStatus, mapSelection, onMapSelectionChange } = props;
  const activeWaypoint = mission.route.waypoints[mission.route.activeWaypointIndex];
  const recentEvents = mission.events.slice(-5).reverse();
  const visibleRadarIntel = mission.radarIntel.filter((report) => report.level !== "UNKNOWN");
  const weatherSpeedFactor = getWeatherSpeedFactor(mission.aircraft.position, mission.weather);

  return <TacticalWorkspace
    leftPanel={<ControlPanel mission={mission} selectedIndex={selectedIndex} onSelect={onSelect} dispatch={dispatch} onOpenCampaign={props.onOpenCampaign} onReturnCampaign={props.onReturnCampaign} onOpenDebrief={props.onOpenDebrief} />}
    mapStage={<TacticalMapStage
      variant="MISSION"
      mission={mission}
      showBelief={showBelief}
      selectedIndex={selectedIndex}
      onSelect={onSelect}
      dispatch={dispatch}
      mapSelection={mapSelection}
      toolbar={canUseAiDebug ? <button className={`belief-toggle ${showBelief ? "active" : ""}`} onClick={onToggleBelief}>TOTAL INTEL {showBelief ? "ON" : "OFF"}</button> : undefined}
    />}
    rightPanel={<aside className="telemetry-panel">
      <section className={`panel-section threat-section threat-${mission.engagement.stage.toLowerCase()}`}>
        <div className="section-heading"><span>THREAT WARNING</span><span>{threatLabels[mission.engagement.stage]}</span></div>
        <div className="threat-progress"><i style={{ width: `${mission.engagement.trackProgress}%` }} /></div>
        {mission.engagement.stage === "MISSILE_INBOUND"
          ? <p className="threat-message">撞击倒计时 {mission.engagement.missileTimeRemainingSeconds?.toFixed(1)} s // 规避机动 · 脱离照射</p>
          : <p className="threat-message">辐射威胁 {mission.engagement.trackProgress.toFixed(0)}%</p>}
      </section>
      <section className={`panel-section fuel-section ${mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity <= 0.2 ? "fuel-critical" : ""}`}>
        <div className="section-heading"><span>FUEL RANGE</span><span>{(mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity * 100).toFixed(0)}%</span></div>
        <div className="fuel-meter"><i style={{ width: `${mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity * 100}%` }} /></div>
        <p className="threat-message">可用航程 {mission.aircraft.fuelRemaining.toFixed(0)} u</p>
      </section>
      <CollapsibleSection title="FLIGHT STATUS"><dl className="telemetry-grid">
        <div><dt>飞行时间</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} s</dd></div><div><dt>坐标</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
        <div><dt>航向</dt><dd>{mission.aircraft.headingDegrees.toFixed(0)}°</dd></div><div><dt>速度</dt><dd>{mission.aircraft.speed.toFixed(2)} u/s</dd></div>
        <div><dt>气象速度损失</dt><dd>{weatherSpeedFactor < 1 ? `${((1 - weatherSpeedFactor) * 100).toFixed(0)}%` : "无"}</dd></div><div><dt>当前航点</dt><dd>{activeWaypoint ? `WP-${mission.route.activeWaypointIndex}` : "—"}</dd></div>
      </dl></CollapsibleSection>
      <CollapsibleSection title="MISSION INTEL" defaultExpanded={false}><dl className="telemetry-grid">
        <div><dt>已知雷达情报</dt><dd>{visibleRadarIntel.length} 个</dd></div>
        <div><dt>未定位信号</dt><dd>{mission.radarIntel.length - visibleRadarIntel.length} 个</dd></div><div><dt>敌方适应状态</dt><dd>{adaptationStatus}</dd></div>
        <div><dt>雷达扫描速率</dt><dd>{(mission.radarScanRateModifier * 100).toFixed(0)}%</dd></div>
      </dl></CollapsibleSection>
      <MapElementPanel mission={mission} showBelief={showBelief} selection={mapSelection} onSelectionChange={onMapSelectionChange} />
      <DeploymentBriefingPanel title="COUNTER DEPLOYMENT" notes={mission.adaptationNotes} />
      <DeploymentBriefingPanel title="FINAL DEFENSE BRIEFING" notes={mission.finalStrikeNotes} meta={mission.radars.length} />
      {showBelief && <CollapsibleSection className="debug-group" title="ENEMY SYSTEM STATE" meta="INTERNAL" defaultExpanded={false}>
        <CollapsibleSection className="event-section" title="结构化事件" meta={mission.events.length}><ol className="event-list">
          {recentEvents.length === 0 && <li className="empty-event">等待操作事件…</li>}
          {recentEvents.map((event) => <li key={event.id}><time>{(event.timestamp / 1000).toFixed(1).padStart(5, "0")}</time><span>{eventLabels[event.type] ?? event.type}</span></li>)}
        </ol></CollapsibleSection>
        <CollapsibleSection className="commander-section" title="AIR DEFENSE COMMANDER" meta={`ALERT ${mission.awareness.value.toFixed(0)}%`}>
          <EnemyStateSummary mission={mission} density="detailed" />
          <div className="commander-intent">{intentLabels[mission.commander.intent]}</div>
          <div className="score-grid commander-scores"><span>M {mission.commander.utilityScores.MONITOR.toFixed(0)}</span><span>C {mission.commander.utilityScores.COORDINATED_SEARCH.toFixed(0)}</span><span>F {mission.commander.utilityScores.CONCENTRATE_SEARCH.toFixed(0)}</span></div>
          <div className="awareness-meter"><i style={{ width: `${mission.awareness.value}%` }} /></div>
        </CollapsibleSection>
        <CollapsibleSection className="operator-section" title="RADAR OPERATOR AI" meta="UTILITY"><RadarOperatorList mission={mission} /></CollapsibleSection>
      </CollapsibleSection>}
    </aside>}
  />;
}
