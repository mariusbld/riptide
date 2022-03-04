import React, { FC, useEffect, useMemo, useState } from "react";
import { useProgram, Campaign, CampaignState } from "../hooks/useProgram";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import { toDisplayString } from "../utils/format";

const Campaign: FC<{ campaign: Campaign }> = ({ campaign }) => {
  console.log(campaign.id.toString());
  return (
    <div>
      <span>{toDisplayString(campaign.id)}</span>
      <span> </span>
      <Button>Start</Button>
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
      <Link to={"/campaigns/create"}>Create Campaign</Link>
      <h3>Active Campaigns</h3>
      {activeCampaigns.map((c) => (
        <Campaign key={c.id.toString()} campaign={c} />
      ))}
      <h3>Draft Campaigns</h3>
      {draftCampaigns.map((c) => (
        <Campaign key={c.id.toString()} campaign={c} />
      ))}
      <h3>Past Campaigns</h3>
      {inactiveCampaigns.map((c) => (
        <Campaign key={c.id.toString()} campaign={c} />
      ))}
    </div>
  );
};

export default CampaignList;
