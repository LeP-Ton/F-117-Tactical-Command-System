import type { CampaignEdge, CampaignNode, CampaignState, MissionNodeType } from "../domain/types";
import { generateMissionContent } from "./missionGenerator";

const stageTypes: readonly (readonly MissionNodeType[])[] = [
  ["INTEL", "STRIKE"],
  ["SEAD", "COMMAND_STRIKE"],
  ["INTEL", "STRIKE"],
  ["FINAL_STRIKE"],
];

const effects: Record<MissionNodeType, string> = {
  INTEL: "获取敌防空网电子情报，提升后续目标识别质量",
  STRIKE: "打击任务目标，不改变敌防空网当前战备状态",
  SEAD: "压制敌防空节点，削弱后续雷达覆盖",
  COMMAND_STRIKE: "打击敌指挥链，削弱后续协同搜索能力",
  FINAL_STRIKE: "对最终目标实施纵深精确打击",
};

export function generateCampaign(seed: string): CampaignState {
  const nodes: CampaignNode[] = [];
  stageTypes.forEach((types, layer) => {
    types.forEach((type, index) => {
      const count = types.length;
      const id = `C${layer}-${index}`;
      const missionSeed = `${seed}:${id}`;
      const generated = generateMissionContent(missionSeed);
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
          intelAccuracy: generated.intelAccuracy,
          effect: effects[type],
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
