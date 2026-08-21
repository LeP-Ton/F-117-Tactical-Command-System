import { useMemo, useState } from "react";
import type { RunState } from "../domain/types";
import type { GameAction } from "../game/gameReducer";
import { getAdaptationLevel } from "../domain/enemyAdaptation";

interface CampaignMapProps {
  state: RunState;
  dispatch: (action: GameAction) => void;
  onLaunch: () => void;
}

const typeLabels = {
  INTEL: "情报行动",
  STRIKE: "打击",
  SEAD: "防空压制",
  COMMAND_STRIKE: "指挥打击",
  FINAL_STRIKE: "最终打击",
} as const;

export function CampaignMap({ state, dispatch, onLaunch }: CampaignMapProps) {
  const firstAvailable = state.campaign.nodes.find((node) => node.status === "AVAILABLE");
  const [selectedId, setSelectedId] = useState(firstAvailable?.id ?? state.campaign.nodes[0]?.id ?? "");
  const selected = useMemo(
    () => state.campaign.nodes.find((node) => node.id === selectedId) ?? firstAvailable,
    [firstAvailable, selectedId, state.campaign.nodes],
  );
  const adaptationLevel = getAdaptationLevel(state.enemyState.tacticalProfile);
  const hasAvailableNode = state.campaign.nodes.some((node) => node.status === "AVAILABLE");
  // 热更新可能保留旧版产生的矛盾状态；成功 Mission + 可用后续节点应视为可继续的 Run。
  const canContinueRun = state.status === "ACTIVE"
    || (state.status === "DEFEAT" && state.currentMission?.status === "SUCCESS" && hasAvailableNode);

  return (
    <section className="campaign-screen">
      <div className="campaign-header">
        <div><span className="section-kicker">PROCEDURAL CAMPAIGN</span><h2>防空战役网络</h2></div>
        <div className="campaign-resources">
          <span>ENEMY ALERT <strong>{state.resources.enemyAlert}</strong></span>
          <span>INTEL QUALITY <strong>+{(state.resources.intelAccuracyBonus * 100).toFixed(0)}%</strong></span>
          <span>RADAR NET <strong>{(state.enemyState.radarCoverageModifier * 100).toFixed(0)}%</strong></span>
          <span>CMD LINK <strong>{(state.enemyState.commanderCoordinationModifier * 100).toFixed(0)}%</strong></span>
          <span>ADAPT <strong>LV.{adaptationLevel}</strong></span>
        </div>
      </div>
      <div className="campaign-content">
        <div className="campaign-graph">
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            aria-label="战役节点连线"
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
              <div><dt>节点</dt><dd>{selected.id}</dd></div>
              <div><dt>雷达密度</dt><dd>{selected.preview.radarDensity}</dd></div>
              <div><dt>天气</dt><dd>{selected.preview.weather}</dd></div>
              <div><dt>情报可信度</dt><dd>{(selected.preview.intelAccuracy * 100).toFixed(0)}%</dd></div>
            </dl>
            <p>{selected.preview.effect}</p>
            {selected.type === "FINAL_STRIKE" && <p>最终防空体系将在出击时根据本次 Run 的任务成果、Enemy Alert 与玩家历史动态组装。</p>}
            {state.enemyState.tacticalProfile.missionSamples > 0 && <div className="campaign-build">
              <span className="section-kicker">ENEMY HISTORICAL ANALYSIS</span>
              <div>地形利用 {(state.enemyState.tacticalProfile.terrainMaskingPreference * 100).toFixed(0)}%</div>
              <div>{state.enemyState.tacticalProfile.southernRouteBias > 0.5 ? "南部" : "北部"}航路偏好 {(Math.abs(state.enemyState.tacticalProfile.southernRouteBias - 0.5) * 200).toFixed(0)}%</div>
              <div>直达倾向 {(state.enemyState.tacticalProfile.aggressiveRouting * 100).toFixed(0)}%</div>
            </div>}
            <button
              className="primary-button"
              disabled={selected.status !== "AVAILABLE" || !canContinueRun}
              onClick={() => {
                dispatch({ type: "SELECT_CAMPAIGN_NODE", nodeId: selected.id });
                onLaunch();
              }}
            >
              {state.status === "VICTORY"
                ? "RUN 已完成"
                : state.status === "DEFEAT" && !canContinueRun
                  ? "飞机损失 // RUN 结束"
                  : "执行任务"}
            </button>
          </>}
        </aside>
      </div>
    </section>
  );
}
