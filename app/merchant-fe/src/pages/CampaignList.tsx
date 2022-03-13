import React, { FC, useEffect, useMemo, useState } from "react";
import CircleDecoration from "../components/CircleDecoration";
import Hr from "../components/Hr";
import NavLink from "../components/NavLink";
import SectionHeading from "../components/SectionHeading";
import { useConfig } from "../hooks/useConfig";
import { Campaign, CampaignState, useProgram } from "../hooks/useProgram";
import { getTotalPrizeAmount } from "../utils/campaign";
import { toCurrencyString, toDisplayString } from "../utils/format";

const Campaign: FC<{ campaign: Campaign }> = ({ campaign }) => {
  const { usdcMint } = useConfig();
  return (
    <div className="grid grid-cols-3">
      <NavLink pathname={`/campaigns/${campaign.id.toString()}/details`}>
        <div className="underline">{toDisplayString(campaign.id)}</div>
      </NavLink>
      <div className="text-right">
        {toCurrencyString(
          getTotalPrizeAmount(campaign.config.prizeData),
          usdcMint.decimals
        )}{" "}
        USDC
      </div>
      <div className="text-right">
        {campaign.stats.createdTime?.toDateString()}
      </div>
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
  const leftCreated = a.stats.createdTime?.getTime() ?? 0;
  const rightCreated = b.stats.createdTime?.getTime() ?? 0;
  return leftCreated - rightCreated;
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
      <NavLink pathname="/campaigns/create">New Campaign{" >"}</NavLink>
      <div className="pb-12">
        <SectionHeading>
          <div className="flex flex-row items-baseline">
            <span>Active Campaigns</span>
            <CircleDecoration className="bg-green-500" />
          </div>
        </SectionHeading>
        <Hr />
        {activeCampaigns.length === 0 && <div>No active campaigns.</div>}
        {activeCampaigns.map((c) => (
          <Campaign key={c.id.toString()} campaign={c} />
        ))}
      </div>
      <div className="pb-12">
        <SectionHeading>
          <div className="flex flex-row items-baseline">
            <span>Draft Campaigns</span>
            <CircleDecoration className="bg-yellow-500" />
          </div>
        </SectionHeading>
        <Hr />
        {draftCampaigns.length === 0 && <div>No draft campaigns.</div>}
        {draftCampaigns.map((c) => (
          <Campaign key={c.id.toString()} campaign={c} />
        ))}
      </div>
      <div className="pb-12">
        <SectionHeading>
          <div className="flex flex-row items-baseline">
            <span>Past Campaigns</span>
            <CircleDecoration className="bg-gray-500" />
          </div>
        </SectionHeading>
        <Hr />
        {inactiveCampaigns.length === 0 && <div>No past campaigns.</div>}
        {inactiveCampaigns.map((c) => (
          <Campaign key={c.id.toString()} campaign={c} />
        ))}
      </div>
    </div>
  );
};

export default CampaignList;
