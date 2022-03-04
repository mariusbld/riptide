import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import ConfirmModal from "../components/ConfirmModal";
import { getMissingPrizeFunds } from "../utils/campaign";

const AddFunds: FC<{
  campaign: CampaignWithFunds;
  refresh: () => Promise<void>;
}> = ({ campaign, refresh }) => {
  const program = useProgram();
  const missingFunds = getMissingPrizeFunds(campaign);

  const handleAddFunds = async () => {
    try {
      await program.addCampaignFunds(campaign.id, missingFunds);
      await refresh();
    } catch (err) {
      console.error(`Error while adding funds: ${err}`);
    }
  };

  if (missingFunds === 0) {
    return (
      <div className="py-4">
        <SuccessMessage>Prize funds have been deposited.</SuccessMessage>
      </div>
    );
  }

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
        Deposit Funds
      </Button>
    </>
  );
};

const SuccessMessage: FC<{ children?: ReactNode }> = ({ children }) => (
  <div className="flex flex-row">
    <span>
      <CheckCircleIcon className="h-6 w-6" />
    </span>
    <span className="px-1">{children}</span>
  </div>
);

const DraftCampaign: FC<{
  campaign: CampaignWithFunds;
  refresh: () => Promise<void>;
}> = ({ campaign, refresh }) => {
  const program = useProgram();
  const [isStarting, setIsStarting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const canStart = useMemo(() => {
    return getMissingPrizeFunds(campaign) === 0;
  }, [campaign]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await program.startCampaign(campaign.id);
      setModalOpen(true);
    } catch (err) {
      console.error(`Failed to start the campaign: ${err}`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleModalConfirm = async () => {
    setModalOpen(false);
    await refresh();
  };

  return (
    <div>
      <ConfirmModal
        open={modalOpen}
        setOpen={setModalOpen}
        onConfirm={handleModalConfirm}
        title={"Campaign Started!"}
      >
        <p className="text-sm dark:text-secondary-dark">
          Your campaign was successfully started! You can now monitor progress
          on the campaign details page.
        </p>
      </ConfirmModal>
      <CampaignDetailsSection config={campaign.config} />
      <Hr />
      <SuccessMessage>
        Your campaign has been successfully initialized!
      </SuccessMessage>
      <AddFunds refresh={refresh} campaign={campaign} />
      <Hr />
      <div className="md:flex items-center justify-end">
        <Button disabled={!canStart} onClick={handleStart} loading={isStarting}>
          Start Campaign
        </Button>
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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const campaign = await program.getCampaign(campaignId);
      setCampaign(campaign);
    } catch (err) {
      console.error(`Error while refreshing campaign ${campaignId}: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [program, campaignId]);

  useEffect(() => {
    refresh();
  }, [program, campaignId]);

  const isDraft = campaign && campaign.state == CampaignState.Initialized;
  const isActive = campaign && campaign.state == CampaignState.Started;
  const isStopped = campaign && campaign.state == CampaignState.Stopped;
  const isRevoked = campaign && campaign.state == CampaignState.Revoked;

  return (
    <div>
      <BackLink pathname={"/campaigns"}>{"< All campaigns"}</BackLink>
      <Heading>
        Campaign Details -{" "}
        <span className="dark:text-secondary-dark underline">
          [{toDisplayString(campaignId)}]
        </span>
      </Heading>
      <Hr />
      {loading && <div>Loading</div>}
      {isDraft && <DraftCampaign refresh={refresh} campaign={campaign} />}
      {isActive && <ActiveCampaign campaign={campaign} />}
      {isStopped && <StoppedCampaign campaign={campaign} />}
      {isRevoked && <ReovkedCampaign campaign={campaign} />}
    </div>
  );
};

export default CampaignDetails;
