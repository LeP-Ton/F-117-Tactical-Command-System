import { campaignBalance } from "./campaignBalance";
import type { CampaignState } from "./types";

export type IntelAccessTier = 0 | 1 | 2;

export function getIntelAccessTier(campaign: CampaignState): IntelAccessTier {
  return Math.min(
    campaignBalance.maxIntelMissions,
    campaign.nodes.filter((node) => node.type === "INTEL" && node.status === "COMPLETED").length,
  ) as IntelAccessTier;
}
