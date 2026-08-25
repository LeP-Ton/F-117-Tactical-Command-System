import { useEffect, useState } from "react";
import { useGameController } from "../game/useGameController";
import { ControlPanel } from "./ControlPanel";
import { TacticalMap } from "./TacticalMap";
import { getBeliefPeak } from "../domain/beliefMap";
import { CampaignMap } from "./CampaignMap";
import { useGameAudio } from "../audio/useGameAudio";
import f117SideSilhouette from "../assets/f117-side-silhouette.png";
import { CollapsibleSection } from "./CollapsibleSection";
import { getAdaptationLevel } from "../domain/enemyAdaptation";
import { getWeatherSpeedFactor } from "../domain/weatherSystem";
import { radarTypeProfiles } from "../domain/radarTypes";
import { MapElementPanel } from "./MapElementPanel";
import type { MapElementSelection } from "./mapSelection";

const workspaceViewStorageKey = "f117-tactical-command-system:view:v1";

function loadCampaignView(missionStatus: string | undefined): boolean {
  try {
    const savedView = localStorage.getItem(workspaceViewStorageKey);
    if (savedView === "TACTICAL") return false;
    if (savedView === "CAMPAIGN") return true;
  } catch {
    // 浏览器禁用存储时仍允许游戏正常启动。
  }
  return missionStatus === "PLANNING";
}

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
  AWARENESS_STAGE_CHANGED: "警戒阶段变化",
  COMMANDER_ORDER: "Commander 命令",
  ATTACK: "武器投放",
  EXTRACTION: "进入撤离区",
  MISSION_SUCCESS: "任务成功",
  MISSION_FAILED: "任务失败",
  THREAT_STAGE_CHANGED: "威胁阶段变化",
  MISSILE_LAUNCHED: "导弹发射",
  MISSILE_DEFEATED: "导弹脱锁",
  AIRCRAFT_DESTROYED: "飞机损毁",
  FUEL_EXHAUSTED: "燃油耗尽",
};

const modeLabels = {
  WIDE_SEARCH: "广域搜索",
  SECTOR_SEARCH: "扇区搜索",
  FOCUSED_TRACK: "聚焦跟踪",
} as const;

const awarenessLabels = { CALM: "平静", SUSPICIOUS: "怀疑", SEARCHING: "搜索", HUNTING: "猎杀" } as const;

const intentLabels = {
  MONITOR: "持续监视",
  COORDINATED_SEARCH: "协同搜索",
  CONCENTRATE_SEARCH: "集中搜索",
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
  const [campaignView, setCampaignView] = useState(() => loadCampaignView(state.currentMission?.status));
  const [mapSelection, setMapSelection] = useState<MapElementSelection | null>(null);
  const mission = state.currentMission;
  const { muted, volume, setMuted, setVolume } = useGameAudio(mission);

  useEffect(() => {
    try {
      localStorage.setItem(workspaceViewStorageKey, campaignView ? "CAMPAIGN" : "TACTICAL");
    } catch {
      // 视图偏好保存失败不影响任务进度自动保存。
    }
  }, [campaignView]);

  if (!mission) return <main className="fatal-state">任务会话初始化失败</main>;

  const activeWaypoint = mission.route.waypoints[mission.route.activeWaypointIndex];
  const recentEvents = mission.events.slice(-5).reverse();
  const beliefPeak = getBeliefPeak(mission.beliefMap, mission.elapsedMs);
  const visibleRadarIntel = mission.radarIntel.filter((report) => report.level !== "UNKNOWN");
  const adaptationLevel = getAdaptationLevel(state.enemyState.tacticalProfile);
  const weatherSpeedFactor = getWeatherSpeedFactor(mission.aircraft.position, mission.weather);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-label="F-117 侧面剪影">
            <img className="brand-aircraft-silhouette" src={f117SideSilhouette} alt="" />
          </div>
          <div>
            <h1>F-117 TACTICAL COMMAND SYSTEM</h1>
            <p>FROM USA AIR FORCE // VERSION 1.0</p>
          </div>
        </div>
        <div className="topbar-controls">
          <div className="audio-control">
            <button type="button" onClick={() => setMuted(!muted)}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
            <label htmlFor="master-volume">VOL</label>
            <input
              id="master-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label="游戏音效音量"
            />
          </div>
          <form className="seed-control" onSubmit={(event) => {
            event.preventDefault();
            dispatch({ type: "NEW_RUN", seed: seedInput });
            setSelectedIndex(null);
            setCampaignView(true);
          }}>
            <label htmlFor="run-seed">OPERATION CODE</label>
            <input id="run-seed" value={seedInput} onChange={(event) => setSeedInput(event.target.value)} />
            <button type="submit">初始化战役</button>
          </form>
        </div>
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
            mapSelection={mapSelection}
          />
          <div className="map-legend">
            <span><i className="legend-aircraft" />F-117</span>
            <span><i className="legend-waypoint" />航点</span>
            <span><i className="legend-extraction" />撤离区</span>
            <span><i className="legend-radar" />{showBelief ? "真实雷达 / 敌方 Contact" : "雷达情报 / 误差区"}</span>
          </div>
        </section>
        <aside className="telemetry-panel">
          <section className={`panel-section threat-section threat-${mission.engagement.stage.toLowerCase()}`}>
            <div className="section-heading"><span>THREAT WARNING</span><span>{threatLabels[mission.engagement.stage]}</span></div>
            <div className="threat-progress"><i style={{ width: `${mission.engagement.trackProgress}%` }} /></div>
            {mission.engagement.stage === "MISSILE_INBOUND" ? (
              <p className="threat-message">撞击倒计时 {mission.engagement.missileTimeRemainingSeconds?.toFixed(1)} s // 规避机动 · 脱离照射</p>
            ) : (
              <p className="threat-message">辐射威胁 {mission.engagement.trackProgress.toFixed(0)}%</p>
            )}
          </section>
          <section className={`panel-section fuel-section ${mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity <= 0.2 ? "fuel-critical" : ""}`}>
            <div className="section-heading">
              <span>FUEL RANGE</span>
              <span>{(mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity * 100).toFixed(0)}%</span>
            </div>
            <div className="fuel-meter"><i style={{ width: `${mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity * 100}%` }} /></div>
            <p className="threat-message">可用航程 {mission.aircraft.fuelRemaining.toFixed(0)} u</p>
          </section>
          <CollapsibleSection title="FLIGHT STATUS">
            <dl className="telemetry-grid">
              <div><dt>飞行时间</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} s</dd></div>
              <div><dt>坐标</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
              <div><dt>航向</dt><dd>{mission.aircraft.headingDegrees.toFixed(0)}°</dd></div>
              <div><dt>速度</dt><dd>{mission.aircraft.speed.toFixed(2)} u/s</dd></div>
              <div><dt>气象速度损失</dt><dd>{weatherSpeedFactor < 1 ? `${((1 - weatherSpeedFactor) * 100).toFixed(0)}%` : "无"}</dd></div>
              <div><dt>当前航点</dt><dd>{activeWaypoint ? `WP-${mission.route.activeWaypointIndex}` : "—"}</dd></div>
            </dl>
          </CollapsibleSection>
          <CollapsibleSection title="MISSION INTEL" defaultExpanded={false}>
            <dl className="telemetry-grid">
              <div><dt>情报精度</dt><dd>{(mission.intelAccuracy * 100).toFixed(0)}%</dd></div>
              <div><dt>已知雷达情报</dt><dd>{visibleRadarIntel.length} 个</dd></div>
              <div><dt>未定位信号</dt><dd>{mission.radarIntel.length - visibleRadarIntel.length} 个</dd></div>
              <div><dt>敌方反制指数</dt><dd>{adaptationLevel}</dd></div>
            </dl>
          </CollapsibleSection>
          <MapElementPanel
            mission={mission}
            showBelief={showBelief}
            selection={mapSelection}
            onSelectionChange={setMapSelection}
          />
          {mission.adaptationNotes.length > 0 && <CollapsibleSection title="COUNTER DEPLOYMENT" meta={mission.adaptationNotes.length} defaultExpanded={false}>
            <ol className="event-list briefing-list">
              {mission.adaptationNotes.map((note) => <li key={note}><span>{note}</span></li>)}
            </ol>
          </CollapsibleSection>}
          {mission.finalStrikeNotes.length > 0 && <CollapsibleSection title="FINAL DEFENSE BRIEFING" meta={mission.radars.length} defaultExpanded={false}>
            <ol className="event-list briefing-list">
              {mission.finalStrikeNotes.map((note) => <li key={note}><span>{note}</span></li>)}
            </ol>
          </CollapsibleSection>}
          {showBelief && <CollapsibleSection className="debug-group" title="AI DEBUG" meta="INTERNAL" defaultExpanded={false}>
            <CollapsibleSection className="event-section" title="结构化事件" meta={mission.events.length}>
              <ol className="event-list">
                {recentEvents.length === 0 && <li className="empty-event">等待操作事件…</li>}
                {recentEvents.map((event) => (
                  <li key={event.id}>
                    <time>{(event.timestamp / 1000).toFixed(1).padStart(5, "0")}</time>
                    <span>{eventLabels[event.type] ?? event.type}</span>
                  </li>
                ))}
              </ol>
            </CollapsibleSection>
            <CollapsibleSection className="commander-section" title="AIR DEFENSE COMMANDER" meta={`ALERT ${mission.awareness.value.toFixed(0)}%`}>
              <dl className="telemetry-grid debug-telemetry-grid">
                <div><dt>指挥链效率</dt><dd>{(mission.commanderCoordinationModifier * 100).toFixed(0)}%</dd></div>
                <div><dt>雷达数量</dt><dd>{mission.radars.length}</dd></div>
                <div><dt>有效 Contact</dt><dd>{mission.radarContacts.length}</dd></div>
                <div><dt>Belief 峰值</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}% / {beliefPeak.isValid ? "有效" : "失联"}</dd></div>
                <div><dt>推测位置</dt><dd>{beliefPeak.position ? `${beliefPeak.position.x.toFixed(0)}, ${beliefPeak.position.y.toFixed(0)}` : "未知"}</dd></div>
                <div><dt>敌方警戒</dt><dd>{mission.awareness.value.toFixed(1)} / {awarenessLabels[mission.awareness.stage]}</dd></div>
              </dl>
              <div className="commander-intent">{intentLabels[mission.commander.intent]}</div>
              <div className="score-grid commander-scores">
                <span>M {mission.commander.utilityScores.MONITOR.toFixed(0)}</span>
                <span>C {mission.commander.utilityScores.COORDINATED_SEARCH.toFixed(0)}</span>
                <span>F {mission.commander.utilityScores.CONCENTRATE_SEARCH.toFixed(0)}</span>
              </div>
              <div className="awareness-meter"><i style={{ width: `${mission.awareness.value}%` }} /></div>
            </CollapsibleSection>
            <CollapsibleSection className="operator-section" title="RADAR OPERATOR AI" meta="UTILITY">
              {mission.radars.map((radar) => (
                <div className="operator-card" key={radar.id}>
                  <div className="operator-title">
                    <strong>{radar.id}</strong>
                    <span className={`mode-${radar.operator.mode.toLowerCase()}`}>
                      {radarTypeProfiles[radar.type].label} / {modeLabels[radar.operator.mode]}
                    </span>
                  </div>
                  <div className="score-grid">
                    <span>W {radar.operator.utilityScores.WIDE_SEARCH.toFixed(0)}</span>
                    <span>S {radar.operator.utilityScores.SECTOR_SEARCH.toFixed(0)}</span>
                    <span>F {radar.operator.utilityScores.FOCUSED_TRACK.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </CollapsibleSection>
          </CollapsibleSection>}
        </aside>
      </div>}
    </main>
  );
}
