import { ChartSquareBarIcon } from "@heroicons/react/outline";
import React, { FC } from "react";
import { useConfig } from "../hooks/useConfig";
import { CampaignWithFunds } from "../hooks/useProgram";
import {
  getAwardedPrizeAmount,
  getAwardedPrizeCount,
  getTotalPrizeAmount
} from "../utils/campaign";
import { toCurrencyString } from "../utils/format";

const CampaignStatsSection: FC<{ campaign: CampaignWithFunds }> = ({
  campaign,
}) => {
  const { usdcMint } = useConfig();
  const { config } = campaign;
  const currSalesAmount = campaign.stats.runningSalesAmount;
  const totalSalesAmount = campaign.config.endSalesAmount!;
  const percentSales = (currSalesAmount * 100) / totalSalesAmount;
  const awardedPrizeAmount = getAwardedPrizeAmount(campaign);
  const totalPrizeAmount = getTotalPrizeAmount(config.prizeData);
  const percentAwarded = (awardedPrizeAmount * 100) / totalPrizeAmount;
  const awardedPrizeCount = getAwardedPrizeCount(campaign);
  return (
    <div className="flex flex-row items-center justify-center">
      <div className="text-right flex flex-col items-center">
        <div className="flex flex-row items-start py-2">
          <div className="w-48 font-bold">Sales (USDC):</div>
          <div className="w-40">
            {toCurrencyString(currSalesAmount, usdcMint.decimals)}
            {` (${percentSales}%)`}
          </div>
        </div>
        <div className="flex flex-row items-start py-2">
          <div className="w-48 font-bold">Prizes Awarded (USDC):</div>
          <div className="w-40">
            {toCurrencyString(awardedPrizeAmount, usdcMint.decimals)}
            {` (${percentAwarded}%)`}
          </div>
        </div>
        <div className="flex flex-row items-start py-2">
          <div className="w-48 font-bold">Number of Prizes Awarded:</div>
          <div className="w-40">{awardedPrizeCount}</div>
        </div>
      </div>
      <div className="mx-8 w-36 h-36">
        <ChartSquareBarIcon />
      </div>
    </div>
  );
};

export default CampaignStatsSection;
