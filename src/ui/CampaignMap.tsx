import { useMemo, useState } from "react";
import type { MissionDebrief, MissionSession, RunState } from "../domain/types";
import type { GameAction } from "../game/gameReducer";
import { getAdaptationAssessment } from "../domain/enemyAdaptation";
import { getIntelAccessTier } from "../domain/intelAccess";
import { prepareCampaignMission } from "../game/gameReducer";
import { useI18n } from "../i18n/I18n";
import { getMissionEffectKey } from "../domain/campaignBalance";

interface CampaignMapProps {
  state: RunState;
  dispatch: (action: GameAction) => void;
  onLaunch: () => void;
  onPreview: (mission: MissionSession) => void;
  onDebrief: (debrief: MissionDebrief) => void;
}

export function CampaignMap({ state, dispatch, onLaunch, onPreview, onDebrief }: CampaignMapProps) {
  const { copy } = useI18n();
  const firstAvailable = state.campaign.nodes.find((node) => node.status === "AVAILABLE");
  const [selectedId, setSelectedId] = useState(
    state.campaign.currentNodeId ?? firstAvailable?.id ?? state.campaign.nodes[0]?.id ?? "",
  );
  const selected = useMemo(
    () => state.campaign.nodes.find((node) => node.id === selectedId) ?? firstAvailable,
    [firstAvailable, selectedId, state.campaign.nodes],
  );
  const adaptation = getAdaptationAssessment(state.enemyState.tacticalProfile);
  const intelAccessTier = getIntelAccessTier(state.campaign);
  const intelNodes = state.campaign.nodes
    .filter((node) => node.type === "INTEL")
    .sort((left, right) => left.layer - right.layer);
  const completedIntelNodes = intelNodes.filter((node) => node.status === "COMPLETED");
  const selectedIntelOrdinal = selected?.type === "INTEL"
    ? intelNodes.findIndex((node) => node.id === selected.id) + 1
    : 0;
  const selectedIntelRewardLevel = selected?.type === "INTEL"
    ? Math.min(2, selected.status === "COMPLETED"
      ? completedIntelNodes.filter((node) => node.layer <= selected.layer).length
      : completedIntelNodes.length + 1) as 1 | 2
    : undefined;
  const priorIntelNodes = selectedIntelOrdinal > 1
    ? intelNodes.slice(0, selectedIntelOrdinal - 1)
    : [];
  // 第二情报节点必须同时说明“前序仍可完成”和“前序已经错过”两种真实收益，避免把两次行动写成同一句。
  const selectedIntelContext = selected?.type === "INTEL"
    && selectedIntelOrdinal > 1
    && selectedIntelRewardLevel === 1
    ? priorIntelNodes.some((node) => node.status !== "EXPIRED" && node.status !== "COMPLETED")
      ? "CONDITIONAL" as const
      : "RECOVERY" as const
    : "STANDARD" as const;
  const previewMission = useMemo(() => selected ? prepareCampaignMission(state, selected) : undefined, [selected, state]);
  const selectedDebrief = selected ? state.missionDebriefs[selected.id] : undefined;
  const hasAvailableNode = state.campaign.nodes.some((node) => node.status === "AVAILABLE");
  const canRetryFailedNode = selected?.status === "FAILED" && state.status !== "VICTORY";
  // FAILED 表示上次执行结果，同时也是合法重试入口；AVAILABLE 节点仍可改选。
  const canContinueRun = state.status === "ACTIVE" || hasAvailableNode || canRetryFailedNode;
  const selectedEffect = selected
    ? copy.campaign.effect[getMissionEffectKey(selected.type, selectedIntelRewardLevel, selectedIntelContext)]
    : "";
  const selectedWeather = selected?.preview.weather.split(" + ").map((kind) =>
    copy.enums.weatherKind[kind as keyof typeof copy.enums.weatherKind] ?? kind).join(" + ");

  return (
    <section className="campaign-screen">
      <div className="campaign-header">
        <div><span className="section-kicker">{copy.campaign.kicker}</span><h2>{copy.campaign.title}</h2></div>
        <div className="campaign-resources">
          <span>{copy.campaign.enemyAlert} <strong>{state.resources.enemyAlert}</strong></span>
          <span>{copy.campaign.intelAccess} <strong>{intelAccessTier}/2</strong></span>
          <span>{copy.campaign.radarCoverage} <strong>{(state.enemyState.radarCoverageModifier * 100).toFixed(0)}%</strong></span>
          <span>{copy.campaign.radarScan} <strong>{(state.enemyState.radarScanRateModifier * 100).toFixed(0)}%</strong></span>
          <span>{copy.campaign.commandLink} <strong>{(state.enemyState.commanderCoordinationModifier * 100).toFixed(0)}%</strong></span>
          <span>{copy.campaign.enemyAdaptation} <strong>{copy.enums.adaptationStatus[adaptation.status]}</strong></span>
        </div>
      </div>
      <div className="campaign-content">
        <div className="campaign-graph" data-tutorial="mission-network">
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            aria-label={copy.campaign.graphLabel}
          >
            {state.campaign.edges.map((edge) => {
              const from = state.campaign.nodes.find((node) => node.id === edge.from)!;
              const to = state.campaign.nodes.find((node) => node.id === edge.to)!;
              return <line key={`${edge.from}-${edge.to}`} x1={from.position.x} y1={from.position.y} x2={to.position.x} y2={to.position.y} />;
            })}
          </svg>
          {state.campaign.nodes.map((node) => (
            <button
              key={node.id}
              className={`campaign-node node-${node.status.toLowerCase()} ${selected?.id === node.id ? "selected" : ""}`}
              style={{ left: `${node.position.x / 10}%`, top: `${node.position.y / 6}%` }}
              onClick={() => setSelectedId(node.id)}
            >
              <span>{node.id}</span>
              <strong>{copy.enums.missionType[node.type]}</strong>
              <small>{copy.enums.campaignStatus[node.status]}</small>
            </button>
          ))}
        </div>
        <aside className="campaign-preview" data-tutorial="mission-assessment">
          {selected && <>
            <span className="section-kicker">{copy.campaign.previewKicker}</span>
            <h3>{copy.enums.missionType[selected.type]}</h3>
            <dl>
              <div><dt>{copy.campaign.missionCode}</dt><dd>{selected.id}</dd></div>
              <div><dt>{copy.campaign.estimatedRadars}</dt><dd>{selected.preview.radarDensity}</dd></div>
              <div><dt>{copy.campaign.weather}</dt><dd>{selectedWeather}</dd></div>
            </dl>
            <p>{selectedEffect}{copy.common.sentencePeriod}</p>
            <p>{intelAccessTier === 0 ? copy.campaign.limitedIntelligence : intelAccessTier === 1 ? copy.campaign.radarIdentificationVerified : copy.campaign.totalIntelligenceAccess}</p>
            {selected.type === "FINAL_STRIKE" && <p>{copy.campaign.finalStrikeWarning}</p>}
            {state.enemyState.tacticalProfile.missionSamples > 0 && <div className="campaign-build">
              <span className="section-kicker">{copy.campaign.historicalAnalysis}</span>
              <div>{copy.campaign.terrainUse} {(state.enemyState.tacticalProfile.terrainMaskingPreference * 100).toFixed(0)}%</div>
              <div>{state.enemyState.tacticalProfile.southernRouteBias > 0.5 ? copy.campaign.southern : copy.campaign.northern} {copy.campaign.routePreference} {(Math.abs(state.enemyState.tacticalProfile.southernRouteBias - 0.5) * 200).toFixed(0)}%</div>
              <div>{copy.campaign.directRouting} {(state.enemyState.tacticalProfile.aggressiveRouting * 100).toFixed(0)}%</div>
            </div>}
            <button
              className="primary-button"
              data-tutorial="mission-entry"
              disabled={(selected.status === "COMPLETED" && !selectedDebrief)
                || (selected.status !== "LOCKED" && selected.status !== "COMPLETED"
                  && ((selected.status !== "AVAILABLE" && !canRetryFailedNode) || !canContinueRun))}
              onClick={() => {
                if (selected.status === "LOCKED") { if (previewMission) onPreview(previewMission); return; }
                if (selected.status === "COMPLETED") { if (selectedDebrief) onDebrief(selectedDebrief); return; }
                dispatch({ type: "SELECT_CAMPAIGN_NODE", nodeId: selected.id });
                onLaunch();
              }}
            >
              {selected.status === "COMPLETED"
                ? selectedDebrief ? copy.campaign.debriefMission : copy.campaign.missionCompleted
                : state.status === "VICTORY"
                ? copy.campaign.networkCompleted
                : state.status === "DEFEAT" && !canContinueRun
                  ? copy.campaign.networkTerminated
                  : selected.status === "LOCKED" ? copy.campaign.previewMission : copy.campaign.planMission}
            </button>
          </>}
        </aside>
      </div>
    </section>
  );
}
