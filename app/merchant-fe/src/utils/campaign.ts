import { Campaign, CampaignWithFunds, PrizeData } from "../hooks/useProgram";

export const getTotalPrizeAmount = (prizeData: PrizeData): number => {
  return prizeData.entries.reduce(
    (prev, curr) => prev + curr.amount * curr.count,
    0
  );
};

export const getVaultFunds = (campaign: CampaignWithFunds): number => {
  return campaign.vaultFunds.reduce((sum, vault) => sum + vault.amount, 0);
};

export const getMissingPrizeFunds = (campaign: CampaignWithFunds): number => {
  return (
    getTotalPrizeAmount(campaign.config.prizeData) - getVaultFunds(campaign)
  );
};

export const getAwardedPrizeAmount = (campaign: Campaign): number => {
  let amount = 0;
  campaign.config.prizeData.entries.forEach((prize, idx) => {
    const awardedCount = campaign.stats.prizeStats[idx].awardedCount ?? 0;
    amount += prize.amount * awardedCount;
  });
  return amount;
};

export const getAwardedPrizeCount = (campaign: Campaign): number => {
  return campaign.stats.prizeStats.reduce(
    (sum, stats) => sum + stats.awardedCount,
    0
  );
};
