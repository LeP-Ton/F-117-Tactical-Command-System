import type { CampaignEdge, CampaignNode, CampaignState, MissionNodeType } from "../domain/types";
import { campaignBalance, getMissionEffectDescription } from "../domain/campaignBalance";
import { generateMissionContent } from "./missionGenerator";

const stageTypes: readonly (readonly MissionNodeType[])[] = [
  ["INTEL", "STRIKE"],
  ["SEAD", "COMMAND_STRIKE"],
  ["INTEL", "STRIKE"],
  ["FINAL_STRIKE"],
];

export function generateCampaign(seed: string): CampaignState {
  const nodes: CampaignNode[] = [];
  let intelOrdinal = 0;
  stageTypes.forEach((types, layer) => {
    types.forEach((type, index) => {
      const count = types.length;
      const id = `C${layer}-${index}`;
      const missionSeed = `${seed}:${id}`;
      const generated = generateMissionContent(missionSeed);
      if (type === "INTEL") {
        intelOrdinal += 1;
        if (intelOrdinal > campaignBalance.maxIntelMissions) {
          throw new Error(`任务网络最多允许 ${campaignBalance.maxIntelMissions} 个 INTEL 节点`);
        }
      }
      nodes.push({
        id,
        type,
        status: layer === 0 ? "AVAILABLE" : "LOCKED",
        layer,
        position: { x: 120 + layer * 250, y: count === 1 ? 300 : 190 + index * 220 },
        missionSeed,
        preview: {
          radarDensity: generated.radars.length,
          weather: generated.weather
            .map((cell) => cell.kind)
            .join(" + "),
          effect: getMissionEffectDescription(type, intelOrdinal),
        },
      });
    });
  });
  const edges: CampaignEdge[] = [];
  for (let layer = 0; layer < stageTypes.length - 1; layer += 1) {
    const current = nodes.filter((node) => node.layer === layer);
    const next = nodes.filter((node) => node.layer === layer + 1);
    current.forEach((from) => next.forEach((to) => edges.push({ from: from.id, to: to.id })));
  }
  return { seed: `${seed}-CAMPAIGN`, nodes, edges };
}
