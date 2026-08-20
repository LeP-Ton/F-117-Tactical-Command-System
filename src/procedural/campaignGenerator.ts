import type { CampaignEdge, CampaignNode, CampaignState, MissionNodeType } from "../domain/types";
import { generateMissionContent } from "./missionGenerator";

const stageTypes: readonly (readonly MissionNodeType[])[] = [
  ["INTEL", "STRIKE"],
  ["SEAD", "COMMAND_STRIKE"],
  ["INTEL", "STRIKE"],
  ["FINAL_STRIKE"],
];

const effects: Record<MissionNodeType, string> = {
  INTEL: "提高后续任务的雷达情报质量",
  STRIKE: "直接推进战役，但不会削弱后续防空",
  SEAD: "压低 Enemy Alert，削弱未来防空",
  COMMAND_STRIKE: "破坏指挥链，降低后续雷达协调能力",
  FINAL_STRIKE: "完成本次 Run 的最终打击",
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
