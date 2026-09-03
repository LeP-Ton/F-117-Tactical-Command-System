import { getBeliefPeak } from "../domain/beliefMap";
import type { MissionSession } from "../domain/types";
import { useI18n } from "../i18n/I18n";

interface EnemyStateSummaryProps {
  mission: MissionSession;
  density: "compact" | "detailed";
}

export function EnemyStateSummary({ mission, density }: EnemyStateSummaryProps) {
  const { copy } = useI18n();
  const beliefPeak = getBeliefPeak(mission.beliefMap, mission.elapsedMs);
  if (density === "compact") return <dl className="telemetry-grid debug-telemetry-grid">
    <div><dt>{copy.enemy.enemyAlert}</dt><dd>{mission.awareness.value.toFixed(1)}%</dd></div>
    <div><dt>{copy.enemy.activeContact}</dt><dd>{mission.radarContacts.length}</dd></div>
    <div><dt>{copy.enemy.beliefPeak}</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}%</dd></div>
    <div><dt>{copy.enemy.commander}</dt><dd>{copy.enums.commanderIntent[mission.commander.intent]}</dd></div>
  </dl>;
  return <dl className="telemetry-grid debug-telemetry-grid">
    <div><dt>{copy.enemy.commandEfficiency}</dt><dd>{(mission.commanderCoordinationModifier * 100).toFixed(0)}%</dd></div>
    <div><dt>{copy.enemy.radarCount}</dt><dd>{mission.radars.length}</dd></div>
    <div><dt>{copy.enemy.activeContact}</dt><dd>{mission.radarContacts.length}</dd></div>
    <div><dt>{copy.enemy.beliefPeak}</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}% / {beliefPeak.isValid ? copy.common.valid : copy.common.lost}</dd></div>
    <div><dt>{copy.enemy.estimatedPosition}</dt><dd>{beliefPeak.position ? `${beliefPeak.position.x.toFixed(0)}, ${beliefPeak.position.y.toFixed(0)}` : copy.common.unknown}</dd></div>
    <div><dt>{copy.enemy.enemyAlert}</dt><dd>{mission.awareness.value.toFixed(1)} / {copy.enums.awarenessStage[mission.awareness.stage]}</dd></div>
  </dl>;
}

interface RadarOperatorListProps {
  mission: MissionSession;
}

export function RadarOperatorList({ mission }: RadarOperatorListProps) {
  const { copy } = useI18n();
  return <>{mission.radars.map((radar) => <div className="operator-card" key={radar.id}>
    <div className="operator-title">
      <strong>{radar.id}</strong>
      <span className={`mode-${radar.operator.mode.toLowerCase()}`}>{copy.enums.radarType[radar.type]} / {copy.enums.operatorMode[radar.operator.mode]}</span>
    </div>
    <div className="score-grid">
      <span>{copy.enemy.operatorUtilityShort.wide} {radar.operator.utilityScores.WIDE_SEARCH.toFixed(0)}</span>
      <span>{copy.enemy.operatorUtilityShort.sector} {radar.operator.utilityScores.SECTOR_SEARCH.toFixed(0)}</span>
      <span>{copy.enemy.operatorUtilityShort.focus} {radar.operator.utilityScores.FOCUSED_TRACK.toFixed(0)}</span>
    </div>
  </div>)}</>;
}
