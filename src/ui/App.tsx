import { useState } from "react";
import { useGameController } from "../game/useGameController";
import { ControlPanel } from "./ControlPanel";
import { TacticalMap } from "./TacticalMap";
import { getBeliefPeak } from "../domain/beliefMap";
import { CampaignMap } from "./CampaignMap";

const eventLabels: Record<string, string> = {
  WAYPOINT_ADDED: "新增航点",
  WAYPOINT_MOVED: "调整航点",
  WAYPOINT_REMOVED: "删除航点",
  WAYPOINT_REORDERED: "航点排序",
  MISSION_STARTED: "开始执行",
  MISSION_PAUSED: "任务暂停",
  MISSION_RESUMED: "继续执行",
  MISSION_RESET: "任务重置",
  WAYPOINT_REACHED: "抵达航点",
  ROUTE_COMPLETED: "航线完成",
  RADAR_CONTACT: "雷达接触",
  RADAR_MODE_CHANGED: "雷达模式切换",
  BELIEF_UPDATED: "Belief 概率更新",
  AWARENESS_STAGE_CHANGED: "警戒阶段变化",
  COMMANDER_ORDER: "Commander 命令",
  ATTACK: "武器投放",
  EXTRACTION: "进入撤离区",
  MISSION_SUCCESS: "任务成功",
  MISSION_FAILED: "任务失败",
  BUILD_CHOICE: "选择战术模块",
  FALSE_CONTACT: "制造虚假 Contact",
  THREAT_STAGE_CHANGED: "威胁阶段变化",
  MISSILE_LAUNCHED: "导弹发射",
  MISSILE_DEFEATED: "导弹脱锁",
  AIRCRAFT_HIT: "飞机受损",
};

const modeLabels = {
  WIDE_SEARCH: "广域搜索",
  SECTOR_SEARCH: "扇区搜索",
  FOCUSED_TRACK: "聚焦跟踪",
  SHUTDOWN: "静默关机",
} as const;

const awarenessLabels = { CALM: "平静", SUSPICIOUS: "怀疑", SEARCHING: "搜索", HUNTING: "猎杀" } as const;
const intentLabels = {
  MONITOR: "持续监视",
  COORDINATED_SEARCH: "协同搜索",
  CONCENTRATE_SEARCH: "集中搜索",
  NETWORK_SILENCE: "网络静默",
} as const;
const threatLabels = {
  UNDETECTED: "未发现异常",
  SUSPECTED: "疑似搜索活动",
  TRACKED: "持续照射 / 正在跟踪",
  LOCKED: "火控锁定",
  MISSILE_INBOUND: "导弹来袭",
} as const;

export function App() {
  const { state, dispatch } = useGameController();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showBelief, setShowBelief] = useState(false);
  const [seedInput, setSeedInput] = useState(state.seed);
  const [campaignView, setCampaignView] = useState(true);
  const mission = state.currentMission;

  if (!mission) return <main className="fatal-state">任务会话初始化失败</main>;

  const activeWaypoint = mission.route.waypoints[mission.route.activeWaypointIndex];
  const recentEvents = mission.events.slice(-5).reverse();
  const beliefPeak = getBeliefPeak(mission.beliefMap, mission.elapsedMs);
  const visibleRadarIntel = mission.radarIntel.filter((report) => report.level !== "UNKNOWN");

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">ZR</div>
          <div>
            <h1>ZERO RETURN</h1>
            <p>F-117 战术航线规划系统 // PHASE 12</p>
          </div>
        </div>
        <form className="seed-control" onSubmit={(event) => {
          event.preventDefault();
          dispatch({ type: "NEW_RUN", seed: seedInput });
          setSelectedIndex(null);
          setCampaignView(true);
        }}>
          <label htmlFor="run-seed">RUN SEED</label>
          <input id="run-seed" value={seedInput} onChange={(event) => setSeedInput(event.target.value)} />
          <button type="submit">生成任务</button>
        </form>
      </header>

      {campaignView ? (
        <CampaignMap state={state} dispatch={dispatch} onLaunch={() => setCampaignView(false)} />
      ) : <div className="workspace">
        <ControlPanel
          mission={mission}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          dispatch={dispatch}
          onOpenCampaign={() => setCampaignView(true)}
          onReturnCampaign={() => setCampaignView(true)}
          pendingRewardIds={state.pendingRewardIds}
          moduleIds={state.playerBuild.moduleIds}
        />
        <section className="map-stage">
          <div className="map-label">
            <span>TACTICAL AREA // 1000 × 1000</span>
            <span>{showBelief ? "敌方内部状态" : "有限情报航线规划"}</span>
          </div>
          <button className={`belief-toggle ${showBelief ? "active" : ""}`} onClick={() => setShowBelief((value) => !value)}>
            AI DEBUG {showBelief ? "ON" : "OFF"}
          </button>
          <TacticalMap
            mission={mission}
            showBelief={showBelief}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            dispatch={dispatch}
          />
          <div className="map-legend">
            <span><i className="legend-aircraft" />F-117</span>
            <span><i className="legend-waypoint" />航点</span>
            <span><i className="legend-extraction" />撤离区</span>
            <span><i className="legend-radar" />{showBelief ? "真实雷达 / 敌方 Contact" : "雷达情报 / 误差区"}</span>
          </div>
        </section>
        <aside className="telemetry-panel">
          <section className="panel-section">
            <div className="section-kicker">FLIGHT TELEMETRY</div>
            <dl className="telemetry-grid">
              <div><dt>任务 Seed</dt><dd>{mission.seed}</dd></div>
              <div><dt>情报精度</dt><dd>{(mission.intelAccuracy * 100).toFixed(0)}%</dd></div>
              <div><dt>生成规模</dt><dd>T{mission.generationInfo.terrainCount} / R{mission.generationInfo.radarCount} / W{mission.generationInfo.weatherCount}</dd></div>
              {showBelief && <div><dt>指挥链效率</dt><dd>{(mission.commanderCoordinationModifier * 100).toFixed(0)}%</dd></div>}
              <div><dt>飞行时间</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} s</dd></div>
              <div><dt>坐标 X</dt><dd>{mission.aircraft.position.x.toFixed(1)}</dd></div>
              <div><dt>坐标 Y</dt><dd>{mission.aircraft.position.y.toFixed(1)}</dd></div>
              <div><dt>航向</dt><dd>{mission.aircraft.headingDegrees.toFixed(0)}°</dd></div>
              <div><dt>速度</dt><dd>{mission.aircraft.speed} u/s</dd></div>
              <div><dt>当前目标</dt><dd>{activeWaypoint ? `WP-${mission.route.activeWaypointIndex}` : "—"}</dd></div>
              <div><dt>机体状态</dt><dd>{state.resources.airframeCondition}%</dd></div>
              <div><dt>已知雷达情报</dt><dd>{visibleRadarIntel.length} 个</dd></div>
              <div><dt>未定位信号</dt><dd>{mission.radarIntel.length - visibleRadarIntel.length} 个</dd></div>
              <div><dt>敌方适应</dt><dd>LV.{state.enemyState.adaptationLevel}</dd></div>
              {showBelief && <div><dt>活动雷达</dt><dd>{mission.radars.filter((radar) => radar.active).length}</dd></div>}
              {showBelief && <div><dt>有效 Contact</dt><dd>{mission.radarContacts.length}</dd></div>}
              {showBelief && <div><dt>Belief 峰值</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}% / {beliefPeak.isValid ? "有效" : "失联"}</dd></div>}
              {showBelief && <div><dt>推测位置</dt><dd>{beliefPeak.position ? `${beliefPeak.position.x.toFixed(0)}, ${beliefPeak.position.y.toFixed(0)}` : "未知"}</dd></div>}
              {showBelief && <div><dt>敌方警戒</dt><dd>{mission.awareness.value.toFixed(1)} / {awarenessLabels[mission.awareness.stage]}</dd></div>}
              <div><dt>目标状态</dt><dd>{mission.target.destroyed ? "已摧毁" : "有效"}</dd></div>
              <div><dt>任务结果</dt><dd>{mission.status === "SUCCESS" ? "成功" : mission.status === "FAILED" ? "失败" : "进行中"}</dd></div>
            </dl>
          </section>
          <section className={`panel-section threat-section threat-${mission.engagement.stage.toLowerCase()}`}>
            <div className="section-heading"><span>THREAT WARNING</span><span>{threatLabels[mission.engagement.stage]}</span></div>
            <div className="threat-progress"><i style={{ width: `${mission.engagement.trackProgress}%` }} /></div>
            {mission.engagement.stage === "MISSILE_INBOUND" ? (
              <p className="threat-message">撞击倒计时 {mission.engagement.missileTimeRemainingSeconds?.toFixed(1)} s // 立即改变航向并切断照射</p>
            ) : (
              <p className="threat-message">辐射威胁 {mission.engagement.trackProgress.toFixed(0)}% // 失去新 Contact 后会逐步下降</p>
            )}
          </section>
          {mission.adaptationNotes.length > 0 && <section className="panel-section">
            <div className="section-heading"><span>COUNTER DEPLOYMENT</span><span>{mission.adaptationNotes.length}</span></div>
            <ol className="event-list">
              {mission.adaptationNotes.map((note) => <li key={note}><span>{note}</span></li>)}
            </ol>
          </section>}
          {mission.finalStrikeNotes.length > 0 && <section className="panel-section">
            <div className="section-heading"><span>FINAL DEFENSE BRIEFING</span><span>{mission.radars.length}</span></div>
            <ol className="event-list">
              {mission.finalStrikeNotes.map((note) => <li key={note}><span>{note}</span></li>)}
            </ol>
          </section>}
          <section className="panel-section event-section">
            <div className="section-heading"><span>结构化事件</span><span>{mission.events.length}</span></div>
            <ol className="event-list">
              {recentEvents.length === 0 && <li className="empty-event">等待操作事件…</li>}
              {recentEvents.map((event) => (
                <li key={event.id}>
                  <time>{(event.timestamp / 1000).toFixed(1).padStart(5, "0")}</time>
                  <span>{eventLabels[event.type] ?? event.type}</span>
                </li>
              ))}
            </ol>
          </section>
          {showBelief && <section className="panel-section commander-section">
            <div className="section-heading"><span>AIR DEFENSE COMMANDER</span><span>{mission.commander.doctrine}</span></div>
            <div className="commander-intent">{intentLabels[mission.commander.intent]}</div>
            <div className="score-grid commander-scores">
              <span>M {mission.commander.utilityScores.MONITOR.toFixed(0)}</span>
              <span>C {mission.commander.utilityScores.COORDINATED_SEARCH.toFixed(0)}</span>
              <span>F {mission.commander.utilityScores.CONCENTRATE_SEARCH.toFixed(0)}</span>
              <span>N {mission.commander.utilityScores.NETWORK_SILENCE.toFixed(0)}</span>
            </div>
            <div className="awareness-meter"><i style={{ width: `${mission.awareness.value}%` }} /></div>
          </section>}
          {showBelief && <section className="panel-section operator-section">
            <div className="section-heading"><span>RADAR OPERATOR AI</span><span>UTILITY</span></div>
            {mission.radars.map((radar) => (
              <div className="operator-card" key={radar.id}>
                <div className="operator-title">
                  <strong>{radar.id}</strong>
                  <span className={`mode-${radar.operator.mode.toLowerCase()}`}>{modeLabels[radar.operator.mode]}</span>
                </div>
                <div className="score-grid">
                  <span>W {radar.operator.utilityScores.WIDE_SEARCH.toFixed(0)}</span>
                  <span>S {radar.operator.utilityScores.SECTOR_SEARCH.toFixed(0)}</span>
                  <span>F {radar.operator.utilityScores.FOCUSED_TRACK.toFixed(0)}</span>
                  <span>X {radar.operator.utilityScores.SHUTDOWN.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </section>}
          <section className="architecture-note">
            <span>ARCHITECTURE STATUS</span>
            <strong>RUN ≠ MISSION</strong>
            <p>单任务闭环：规划 → 渗透 → 打击 → 高警戒撤离。</p>
          </section>
        </aside>
      </div>}
    </main>
  );
}
