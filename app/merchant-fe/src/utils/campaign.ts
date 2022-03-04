import { CampaignWithFunds, PrizeData } from "../hooks/useProgram";

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
