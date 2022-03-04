import React, { FC, useEffect, useMemo, useState } from "react";
import {
  useProgram,
  CampaignState,
  CampaignWithFunds,
} from "../hooks/useProgram";
import { useParams } from "react-router-dom";
import Button from "../components/Button";
import { toCurrencyString, toDisplayString } from "../utils/format";
import { PublicKey } from "@solana/web3.js";
import BackLink from "../components/BackLink";
import Heading from "../components/Heading";
import Hr from "../components/Hr";
import CampaignDetailsSection from "../components/CampaignDetailsSection";
import { CheckCircleIcon } from "@heroicons/react/outline";

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
      <div className="py-4">
        You will need to deposit{" "}
        <span className="underline font-bold dark:text-secondary-dark">
          {toCurrencyString(missingFunds)} USDC
        </span>{" "}
        in order to start the campaign.
      </div>
      <Button small onClick={handleAddFunds}>
        Deposit Funds $
      </Button>
    </>
  );
};

const DraftCampaign: FC<{ campaign: CampaignWithFunds }> = ({ campaign }) => {
  const program = useProgram();
  const handleStart = () => program.startCampaign(campaign.id);
  return (
    <div>
      <CampaignDetailsSection config={campaign.config} />
      <Hr />
      <div className="flex flex-row">
        <span>
          <CheckCircleIcon className="h-6 w-6" />
        </span>
        <span className="px-1">
          Your campaign has been successfully initialized!
        </span>
      </div>
      <AddFunds campaign={campaign} />
      <Hr />
      <div className="md:flex items-center justify-end">
        <Button onClick={handleStart}>Start Campaign</Button>
      </div>
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
      <BackLink text="< All campaigns" pathname={"/campaigns"} />
      <Heading>
        Campaign Details -{" "}
        <span className="dark:text-secondary-dark underline">
          [{toDisplayString(campaignId)}]
        </span>
      </Heading>
      <Hr />
      {loading && <div>Loading</div>}
      {isDraft && <DraftCampaign campaign={campaign} />}
      {isActive && <ActiveCampaign campaign={campaign} />}
      {isStopped && <StoppedCampaign campaign={campaign} />}
      {isRevoked && <ReovkedCampaign campaign={campaign} />}
    </div>
  );
};

export default CampaignDetails;
