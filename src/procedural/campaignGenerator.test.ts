import { describe, expect, it } from "vitest";
import { campaignBalance } from "../domain/campaignBalance";
import { generateCampaign } from "./campaignGenerator";

describe("Campaign Generator", () => {
  it("相同 Seed 复现相同战役图", () => {
    expect(generateCampaign("RUN-117")).toEqual(generateCampaign("RUN-117"));
  });

  it("生成三个二选一阶段与一个最终任务", () => {
    for (let index = 0; index < 10; index += 1) {
      const campaign = generateCampaign(`CAMPAIGN-${index}`);
      expect(campaign.nodes).toHaveLength(7);
      expect(new Set(campaign.nodes.map((node) => node.type)).size).toBeGreaterThanOrEqual(3);
      expect(campaign.nodes.filter((node) => node.type === "FINAL_STRIKE")).toHaveLength(1);
      expect(campaign.nodes.filter((node) => node.type === "INTEL").length)
        .toBeLessThanOrEqual(campaignBalance.maxIntelMissions);
      expect(campaign.nodes.filter((node) => node.status === "AVAILABLE")).toHaveLength(2);
      expect(campaign.nodes.filter((node) => node.layer < 3).every((node) =>
        campaign.nodes.filter((candidate) => candidate.layer === node.layer).length === 2)).toBe(true);
    }
  });

  it("每条边均从前一层指向后一层", () => {
    const campaign = generateCampaign("EDGES");
    campaign.edges.forEach((edge) => {
      const from = campaign.nodes.find((node) => node.id === edge.from)!;
      const to = campaign.nodes.find((node) => node.id === edge.to)!;
      expect(to.layer).toBe(from.layer + 1);
    });
  });

  it("两个 INTEL 静态节点分别说明一级收益与二级授权条件", () => {
    const intelNodes = generateCampaign("INTEL-REWARD-COPY").nodes
      .filter((node) => node.type === "INTEL")
      .sort((left, right) => left.layer - right.layer);

    expect(intelNodes.map((node) => node.preview.effect)).toEqual([
      "补齐后续任务全部雷达，并精确核实坐标与型号",
      "完成前序情报行动后授权全域情报；若前序缺失则降为一级情报核实",
    ]);
  });
});
