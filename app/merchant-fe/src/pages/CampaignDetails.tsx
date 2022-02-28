import React, { FC, useEffect, useMemo, useState } from "react";
import { useProgram, Campaign, CampaignState } from "../hooks/useProgram";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import { toDisplayString } from "../utils/format";
import { PublicKey } from "@solana/web3.js";

const CampaignDetails: FC = () => {
  const [campaign, setCampaign] = useState<Nullable<Campaign>>(null);
  const { id } = useParams<{ id: string }>();
  console.log("campaign id", id);
  if (!id) {
    return <div>Invalid campaign</div>;
  }
  const campaignId = new PublicKey(id);
  return (
    <div>
      <span>{toDisplayString(campaignId)}</span>
      <span> </span>
      <Button>Start</Button>
    </div>
  );
};

export default CampaignDetails;
