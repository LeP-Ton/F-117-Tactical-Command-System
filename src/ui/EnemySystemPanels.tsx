import { getBeliefPeak } from "../domain/beliefMap";
import { radarTypeProfiles } from "../domain/radarTypes";
import type { MissionSession } from "../domain/types";

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

interface EnemyStateSummaryProps {
  mission: MissionSession;
  density: "compact" | "detailed";
}

export function EnemyStateSummary({ mission, density }: EnemyStateSummaryProps) {
  const beliefPeak = getBeliefPeak(mission.beliefMap, mission.elapsedMs);
  if (density === "compact") return <dl className="telemetry-grid debug-telemetry-grid">
    <div><dt>敌方警戒</dt><dd>{mission.awareness.value.toFixed(1)}%</dd></div>
    <div><dt>有效 Contact</dt><dd>{mission.radarContacts.length}</dd></div>
    <div><dt>Belief 峰值</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}%</dd></div>
    <div><dt>Commander</dt><dd>{intentLabels[mission.commander.intent]}</dd></div>
  </dl>;
  return <dl className="telemetry-grid debug-telemetry-grid">
    <div><dt>指挥链效率</dt><dd>{(mission.commanderCoordinationModifier * 100).toFixed(0)}%</dd></div>
    <div><dt>雷达数量</dt><dd>{mission.radars.length}</dd></div>
    <div><dt>有效 Contact</dt><dd>{mission.radarContacts.length}</dd></div>
    <div><dt>Belief 峰值</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}% / {beliefPeak.isValid ? "有效" : "失联"}</dd></div>
    <div><dt>推测位置</dt><dd>{beliefPeak.position ? `${beliefPeak.position.x.toFixed(0)}, ${beliefPeak.position.y.toFixed(0)}` : "未知"}</dd></div>
    <div><dt>敌方警戒</dt><dd>{mission.awareness.value.toFixed(1)} / {awarenessLabels[mission.awareness.stage]}</dd></div>
  </dl>;
}

interface RadarOperatorListProps {
  mission: MissionSession;
}

export function RadarOperatorList({ mission }: RadarOperatorListProps) {
  return <>{mission.radars.map((radar) => <div className="operator-card" key={radar.id}>
    <div className="operator-title">
      <strong>{radar.id}</strong>
      <span className={`mode-${radar.operator.mode.toLowerCase()}`}>{radarTypeProfiles[radar.type].label} / {modeLabels[radar.operator.mode]}</span>
    </div>
    <div className="score-grid">
      <span>W {radar.operator.utilityScores.WIDE_SEARCH.toFixed(0)}</span>
      <span>S {radar.operator.utilityScores.SECTOR_SEARCH.toFixed(0)}</span>
      <span>F {radar.operator.utilityScores.FOCUSED_TRACK.toFixed(0)}</span>
    </div>
  </div>)}</>;
}

export { intentLabels };
