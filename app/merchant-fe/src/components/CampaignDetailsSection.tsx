import React, { FC } from "react";
import { getTotalAmount } from "../utils/campaign";
import { CampaignConfig } from "../hooks/useProgram";
import { toCurrencyString } from "../utils/format";
import Gift from "../components/svg/Gift";

const CampaignDetailsSection: FC<{ config: CampaignConfig }> = ({ config }) => {
  const totalAmount = getTotalAmount(config.prizeData);
  const percentOfSales = (totalAmount * 100) / config.endSalesAmount!;
  return (
    <div className="flex flex-row items-center justify-center">
      <div className="text-right flex flex-col items-center">
        <div className="flex flex-row items-start py-2">
          <div className="w-48 font-bold">Target Sales Volume:</div>
          <div className="w-40">
            {toCurrencyString(config.endSalesAmount!)} USDC
          </div>
        </div>
        <div className="flex flex-row items-start py-2">
          <div className="w-48 font-bold">Rewards Total:</div>
          <div className="w-40">{toCurrencyString(totalAmount)} USDC</div>
        </div>
        <div className="flex flex-row items-start py-2">
          <div className="w-48 font-bold">Percent of Sales Volume:</div>
          <div className="w-40">{percentOfSales.toFixed(2)} %</div>
        </div>
      </div>
      <div className="mx-8 w-36 h-36">
        <Gift />
      </div>
    </div>
  );
};

export default CampaignDetailsSection;
