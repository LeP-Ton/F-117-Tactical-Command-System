import { useMemo, useState } from "react";
import type { MissionDebrief, MissionSession, RunState } from "../domain/types";
import type { GameAction } from "../game/gameReducer";
import { getAdaptationAssessment } from "../domain/enemyAdaptation";
import { getIntelAccessTier } from "../domain/intelAccess";
import { prepareCampaignMission } from "../game/gameReducer";
import { getMissionEffectDescription } from "../domain/campaignBalance";

interface CampaignMapProps {
  state: RunState;
  dispatch: (action: GameAction) => void;
  onLaunch: () => void;
  onPreview: (mission: MissionSession) => void;
  onDebrief: (debrief: MissionDebrief) => void;
}

const typeLabels = {
  INTEL: "情报行动",
  STRIKE: "打击",
  SEAD: "防空压制",
  COMMAND_STRIKE: "指挥打击",
  FINAL_STRIKE: "最终打击",
} as const;

export function CampaignMap({ state, dispatch, onLaunch, onPreview, onDebrief }: CampaignMapProps) {
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
  const selectedIntelOrdinal = selected?.type === "INTEL"
    ? state.campaign.nodes
      .filter((node) => node.type === "INTEL")
      .sort((left, right) => left.layer - right.layer)
      .findIndex((node) => node.id === selected.id) + 1
    : 0;
  const previewMission = useMemo(() => selected ? prepareCampaignMission(state, selected) : undefined, [selected, state]);
  const selectedDebrief = selected ? state.missionDebriefs[selected.id] : undefined;
  const hasAvailableNode = state.campaign.nodes.some((node) => node.status === "AVAILABLE");
  const canRetryFailedNode = selected?.status === "FAILED" && state.status !== "VICTORY";
  // FAILED 表示上次执行结果，同时也是合法重试入口；AVAILABLE 节点仍可改选。
  const canContinueRun = state.status === "ACTIVE" || hasAvailableNode || canRetryFailedNode;

  return (
    <section className="campaign-screen">
      <div className="campaign-header">
        <div><span className="section-kicker">MISSION NETWORK</span><h2>任务网络</h2></div>
        <div className="campaign-resources">
          <span>ENEMY ALERT <strong>{state.resources.enemyAlert}</strong></span>
          <span>INTEL ACCESS <strong>{intelAccessTier}/2</strong></span>
          <span>RADAR COVERAGE <strong>{(state.enemyState.radarCoverageModifier * 100).toFixed(0)}%</strong></span>
          <span>RADAR SCAN <strong>{(state.enemyState.radarScanRateModifier * 100).toFixed(0)}%</strong></span>
          <span>CMD LINK <strong>{(state.enemyState.commanderCoordinationModifier * 100).toFixed(0)}%</strong></span>
          <span>ENEMY ADAPTATION <strong>{adaptation.status}</strong></span>
        </div>
      </div>
      <div className="campaign-content">
        <div className="campaign-graph">
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            aria-label="任务节点连线"
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
              <strong>{typeLabels[node.type]}</strong>
              <small>{node.status}</small>
            </button>
          ))}
        </div>
        <aside className="campaign-preview">
          {selected && <>
            <span className="section-kicker">MISSION PREVIEW</span>
            <h3>{typeLabels[selected.type]}</h3>
            <dl>
              <div><dt>任务代号</dt><dd>{selected.id}</dd></div>
              <div><dt>预估雷达数量</dt><dd>{selected.preview.radarDensity}</dd></div>
              <div><dt>天气</dt><dd>{selected.preview.weather}</dd></div>
            </dl>
            <p>{getMissionEffectDescription(selected.type, selectedIntelOrdinal)}。</p>
            <p>{intelAccessTier === 0 ? "LIMITED INTELLIGENCE" : intelAccessTier === 1 ? "RADAR IDENTIFICATION VERIFIED" : "TOTAL INTELLIGENCE ACCESS"}</p>
            {selected.type === "FINAL_STRIKE" && <p>最终目标防空序列持续重构，部署态势将在出击时确认。</p>}
            {state.enemyState.tacticalProfile.missionSamples > 0 && <div className="campaign-build">
              <span className="section-kicker">ENEMY HISTORICAL ANALYSIS</span>
              <div>地形利用 {(state.enemyState.tacticalProfile.terrainMaskingPreference * 100).toFixed(0)}%</div>
              <div>{state.enemyState.tacticalProfile.southernRouteBias > 0.5 ? "南部" : "北部"}航路偏好 {(Math.abs(state.enemyState.tacticalProfile.southernRouteBias - 0.5) * 200).toFixed(0)}%</div>
              <div>直达倾向 {(state.enemyState.tacticalProfile.aggressiveRouting * 100).toFixed(0)}%</div>
            </div>}
            <button
              className="primary-button"
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
                ? selectedDebrief ? "复盘任务" : "任务已完成"
                : state.status === "VICTORY"
                ? "任务网络完成"
                : state.status === "DEFEAT" && !canContinueRun
                  ? "任务网络终止 // 飞机损失"
                  : selected.status === "LOCKED" ? "预览任务" : "规划任务"}
            </button>
          </>}
        </aside>
      </div>
    </section>
  );
}
