import React, { FC, useEffect, useMemo, useState } from "react";
import {
  useProgram,
  Campaign,
  CampaignState,
  CampaignWithFunds,
} from "../hooks/useProgram";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import { toDisplayString } from "../utils/format";
import { PublicKey } from "@solana/web3.js";

const AddFunds: FC<{ campaign: CampaignWithFunds }> = ({ campaign }) => {
  const totalFunds = campaign.vaultFunds.reduce(
    (sum, vault) => sum + vault.amount,
    0
  );
  const requiredFunds = campaign.config.prizeData.entries.reduce(
    (sum, prize) => sum + prize.amount * prize.count,
    0
  );
  const missingFunds = requiredFunds - totalFunds;
  const program = useProgram();

  const handleAddFunds = async () => {
    await program.addCampaignFunds(campaign.id, missingFunds);
    alert("funds added!");
  };

  return (
    <>
      <div>Required Funds: {requiredFunds}</div>
      <div>Total Funds: {totalFunds}</div>
      <div>Missing Funds: {missingFunds}</div>
      <Button onClick={handleAddFunds}>Add Funds</Button>
    </>
  );
};

const DraftCampaign: FC<{ campaign: CampaignWithFunds }> = ({ campaign }) => {
  const program = useProgram();
  const handleStart = () => program.startCampaign(campaign.id);
  return (
    <div>
      <p>Your campaign has been successfully initialized!</p>
      <AddFunds campaign={campaign} />
      <Button onClick={handleStart}>Start Campaign</Button>
    </div>
  );
};

const ActiveCampaign: FC<{ campaign: CampaignWithFunds }> = ({ campaign }) => {
  const program = useProgram();
  const handleStop = () => program.stopCampaign(campaign.id);
  return (
    <div>
      <div>Running</div>
      <Button onClick={handleStop}>Stop Campaign</Button>
    </div>
  );
};

const StoppedCampaign: FC<{ campaign: CampaignWithFunds }> = ({ campaign }) => {
  const program = useProgram();
  const handleRevoke = () => program.revokeCampaign(campaign.id);
  return (
    <div>
      <div>Stopped</div>
      <Button onClick={handleRevoke}>Revoke Campaign</Button>
    </div>
  );
};

const ReovkedCampaign: FC<{ campaign: CampaignWithFunds }> = ({ campaign }) => {
  const program = useProgram();
  const vault = useMemo(() => campaign.vaults.at(0), [campaign]);
  const handleWithdraw = () => {
    vault && program.withdrawCampaignFunds(campaign.id, vault);
  };
  return (
    <div>
      <div>Revoked</div>
      <Button onClick={handleWithdraw}>Withdraw Funds</Button>
    </div>
  );
};

const CampaignDetails: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Nullable<CampaignWithFunds>>(null);
  const [loading, setLoading] = useState(true);
  const program = useProgram();
  if (!id) {
    return <div>Invalid campaign</div>;
  }
  const campaignId = useMemo(() => new PublicKey(id), [id]);

  useEffect(() => {
    (async () => {
      const campaign = await program.getCampaign(campaignId);
      setCampaign(campaign);
      setLoading(false);
    })();
  }, [program, campaignId]);

  const isDraft = campaign && campaign.state == CampaignState.Initialized;
  const isActive = campaign && campaign.state == CampaignState.Started;
  const isStopped = campaign && campaign.state == CampaignState.Stopped;
  const isRevoked = campaign && campaign.state == CampaignState.Revoked;

  return (
    <div>
      <span>{toDisplayString(campaignId)}</span>
      {loading && <div>Loading</div>}
      {isDraft && <DraftCampaign campaign={campaign} />}
      {isActive && <ActiveCampaign campaign={campaign} />}
      {isStopped && <StoppedCampaign campaign={campaign} />}
      {isRevoked && <ReovkedCampaign campaign={campaign} />}
    </div>
  );
};

export default CampaignDetails;
