import { describe, expect, it } from "vitest";
import { createRun } from "./factories";
import { getIntelAccessTier } from "./intelAccess";
describe("分级情报权限", () => {
  it("按已完成 INTEL 节点派生 0/1/2 级", () => {
    const run = createRun("INTEL-TIERS");
    expect(getIntelAccessTier(run.campaign)).toBe(0);
    const one = { ...run.campaign, nodes: run.campaign.nodes.map((n) => n.id === "C0-0" ? { ...n, status: "COMPLETED" as const } : n) };
    expect(getIntelAccessTier(one)).toBe(1);
    const two = { ...one, nodes: one.nodes.map((n) => n.id === "C2-0" ? { ...n, status: "COMPLETED" as const } : n) };
    expect(getIntelAccessTier(two)).toBe(2);
  });
});
