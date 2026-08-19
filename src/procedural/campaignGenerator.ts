import { SeededRandom } from "../core/SeededRandom";
import type { CampaignEdge, CampaignNode, CampaignState, MissionNodeType } from "../domain/types";
import { generateMissionContent } from "./missionGenerator";

const middleTypes: readonly MissionNodeType[] = ["STRIKE", "ELINT", "SEAD", "DEEP_STRIKE"];

const effects: Record<MissionNodeType, string> = {
  STRIKE: "敌方警戒变化，获得少量情报",
  RECON: "获得 2 Intel，揭示后续态势",
  ELINT: "获得 3 Intel，提高电子情报能力",
  SEAD: "压低 Enemy Alert，削弱未来防空",
  COMMAND_STRIKE: "破坏指挥链，降低后续雷达协调能力",
  DEEP_STRIKE: "高风险推进至纵深目标",
  FINAL_STRIKE: "完成本次 Run 的最终打击",
};

export function generateCampaign(seed: string): CampaignState {
  const random = new SeededRandom(`${seed}:CAMPAIGN-GRAPH`);
  const layerCounts = [2, 2, random.integer(1, 2), 1];
  const nodes: CampaignNode[] = [];
  layerCounts.forEach((count, layer) => {
    for (let index = 0; index < count; index += 1) {
      const id = `C${layer}-${index}`;
      const type = layer === layerCounts.length - 1
        ? "FINAL_STRIKE"
        : layer === 0
          ? index === 0 ? "RECON" : "STRIKE"
          : layer === 1
            ? index === 0 ? "ELINT" : "SEAD"
            : layer === 2
              ? index === 0 ? "COMMAND_STRIKE" : "DEEP_STRIKE"
              : random.pick(middleTypes);
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
          weather: generated.weather.map((weather) => weather.kind).join(" + "),
          intelAccuracy: generated.intelAccuracy,
          effect: effects[type],
        },
      });
    }
  });
  const edges: CampaignEdge[] = [];
  for (let layer = 0; layer < layerCounts.length - 1; layer += 1) {
    const current = nodes.filter((node) => node.layer === layer);
    const next = nodes.filter((node) => node.layer === layer + 1);
    current.forEach((from) => next.forEach((to) => edges.push({ from: from.id, to: to.id })));
  }
  return { seed: `${seed}-CAMPAIGN`, completedNodeIds: [], nodes, edges };
}
