import { describe, expect, it } from "vitest";
import { generateCampaign } from "./campaignGenerator";

describe("Campaign Generator", () => {
  it("相同 Seed 复现相同战役图", () => {
    expect(generateCampaign("RUN-117")).toEqual(generateCampaign("RUN-117"));
  });

  it("生成 6–9 个节点、至少三种类型和最终任务", () => {
    for (let index = 0; index < 10; index += 1) {
      const campaign = generateCampaign(`CAMPAIGN-${index}`);
      expect(campaign.nodes.length).toBeGreaterThanOrEqual(6);
      expect(campaign.nodes.length).toBeLessThanOrEqual(9);
      expect(new Set(campaign.nodes.map((node) => node.type)).size).toBeGreaterThanOrEqual(3);
      expect(campaign.nodes.filter((node) => node.type === "FINAL_STRIKE")).toHaveLength(1);
      expect(campaign.nodes.filter((node) => node.status === "AVAILABLE")).toHaveLength(2);
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
});
