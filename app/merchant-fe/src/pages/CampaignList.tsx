import React, { FC, useEffect, useMemo, useState } from "react";
import { useProgram, Campaign, CampaignState } from "../hooks/useProgram";
import Button from "../components/Button";
import { toCurrencyString, toDisplayString } from "../utils/format";
import Heading from "../components/Heading";
import BackLink from "../components/BackLink";
import {
  ChevronRightIcon,
  PlusCircleIcon,
  PlusIcon,
} from "@heroicons/react/outline";
import Hr from "../components/Hr";
import { getTotalPrizeAmount } from "../utils/campaign";

const Campaign: FC<{ campaign: Campaign }> = ({ campaign }) => {
  console.log(campaign.id.toString());
  return (
    <div className="grid grid-cols-3">
      <BackLink pathname={`/campaigns/${campaign.id.toString()}`}>
        <div className="underline">{toDisplayString(campaign.id)}</div>
      </BackLink>
      <div className="text-right">
        {toCurrencyString(getTotalPrizeAmount(campaign.config.prizeData))} USDC
      </div>
      <div className="text-right">{new Date().toDateString()}</div>
    </div>
  );
};

const isActive = (c: Campaign): boolean => {
  return c.state === CampaignState.Started;
};

const isDraft = (c: Campaign): boolean => {
  return c.state === CampaignState.Initialized;
};

const isInactive = (c: Campaign): boolean => {
  return (
    c.state !== CampaignState.Initialized && c.state !== CampaignState.Started
  );
};

const sortCampaignsCmp = (a: Campaign, b: Campaign) => {
  if (a.state !== b.state) {
    return a.state - b.state;
  }
  return a.stats.createdTime.getTime() - b.stats.createdTime.getTime();
};

const CampaignList: FC = () => {
  const program = useProgram();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const activeCampaigns = useMemo(
    () => campaigns.filter(isActive).sort(sortCampaignsCmp),
    [campaigns]
  );
  const draftCampaigns = useMemo(
    () => campaigns.filter(isDraft).sort(sortCampaignsCmp),
    [campaigns]
  );
  const inactiveCampaigns = useMemo(
    () => campaigns.filter(isInactive).sort(sortCampaignsCmp),
    [campaigns]
  );

  useEffect(() => {
    (async () => {
      setCampaigns(await program.listCampaigns());
    })();
  }, [program]);

  return (
    <div>
      <BackLink pathname="/campaigns/create">
        <div className="flex flex-row items-center">
          New Campaign <ChevronRightIcon className="ml-1 h-4 w-4" />
        </div>
      </BackLink>
      <div className="pb-12">
        <Heading>
          <div className="flex flex-row items-baseline">
            <span>Active Campaigns</span>
            <Circle className="bg-green-500" />
          </div>
        </Heading>
        <Hr />
        {activeCampaigns.length === 0 && <div>No active campaigns.</div>}
        {activeCampaigns.map((c) => (
          <Campaign key={c.id.toString()} campaign={c} />
        ))}
      </div>
      <div className="pb-12">
        <Heading>
          <div className="flex flex-row items-baseline">
            <span>Draft Campaigns</span>
            <Circle className="bg-yellow-500" />
          </div>
        </Heading>
        <Hr />
        {draftCampaigns.map((c) => (
          <Campaign key={c.id.toString()} campaign={c} />
        ))}
      </div>
      <div className="pb-12">
        <Heading>
          <div className="flex flex-row items-baseline">
            <span>Past Campaigns</span>
            <Circle className="bg-gray-500" />
          </div>
        </Heading>
        <Hr />
        {inactiveCampaigns.map((c) => (
          <Campaign key={c.id.toString()} campaign={c} />
        ))}
      </div>
    </div>
  );
};

const Circle: FC<{ className: string }> = ({ className }) => (
  <span
    className={`ml-4 flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full ${className}`}
  ></span>
);

export default CampaignList;
