import { PublicKey } from "@solana/web3.js";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/Button";
import CampaignDetailsSection from "../components/CampaignDetailsSection";
import CampaignStatsSection from "../components/CampaignStatsSection";
import ConfirmModal from "../components/ConfirmModal";
import Hr from "../components/Hr";
import InfoMessage from "../components/InfoMessage";
import NavLink from "../components/NavLink";
import SectionHeading from "../components/SectionHeading";
import { useConfig } from "../hooks/useConfig";
import {
  CampaignState,
  CampaignWithFunds,
  useProgram,
} from "../hooks/useProgram";
import { getMissingPrizeFunds, getVaultFunds } from "../utils/campaign";
import { toCurrencyString, toDisplayString } from "../utils/format";

const AddFunds: FC<{
  campaign: CampaignWithFunds;
  refresh: () => Promise<void>;
}> = ({ campaign, refresh }) => {
  const { usdcMint } = useConfig();
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
        <InfoMessage>Prize funds have been deposited.</InfoMessage>
      </div>
    );
  }

  return (
    <>
      <div className="py-4">
        You will need to deposit{" "}
        <span className="underline font-bold dark:text-secondary-dark">
          {toCurrencyString(missingFunds, usdcMint.decimals)} USDC
        </span>{" "}
        in order to start the campaign.
      </div>
      <Button small onClick={handleAddFunds}>
        Deposit Funds
      </Button>
    </>
  );
};

const WithdrawFunds: FC<{
  campaign: CampaignWithFunds;
  refresh: () => Promise<void>;
}> = ({ campaign, refresh }) => {
  const { usdcMint } = useConfig();
  const program = useProgram();
  const vaultFunds = getVaultFunds(campaign);
  const vault = useMemo(() => campaign.vaults.at(0), [campaign]);

  const handleWithdrawFunds = async () => {
    if (!vault) {
      return;
    }
    try {
      await program.withdrawCampaignFunds(campaign.id, vault);
      await refresh();
    } catch (err) {
      console.error(`Error while adding funds: ${err}`);
    }
  };

  if (vaultFunds === 0) {
    return (
      <div className="py-4">
        <InfoMessage>No funds to withdraw.</InfoMessage>
      </div>
    );
  }

  return (
    <>
      <div className="py-4">
        You can withdraw{" "}
        <span className="underline font-bold dark:text-secondary-dark">
          {toCurrencyString(vaultFunds, usdcMint.decimals)} USDC
        </span>{" "}
        worth of funds not awarded.
      </div>
      <Button small onClick={handleWithdrawFunds}>
        Withdraw Funds
      </Button>
    </>
  );
};

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
      <InfoMessage>
        Your campaign has been successfully initialized!
      </InfoMessage>
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

const ActiveCampaign: FC<{
  campaign: CampaignWithFunds;
  refresh: () => Promise<void>;
}> = ({ campaign, refresh }) => {
  type actionName = "stop" | "start" | "revoke";
  interface actionType {
    name: actionName;
    modalTitle: string;
    modalContent: string;
    handle: () => Promise<void>;
  }

  const program = useProgram();
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currAction, setCurrAction] = useState<actionName>();

  const isStarting = isLoading && currAction === "start";
  const isStopping = isLoading && currAction === "stop";
  const isRevoking = isLoading && currAction === "revoke";

  const campaignIsStarted = campaign.state == CampaignState.Started;
  const campaignIsStopped = campaign.state == CampaignState.Stopped;

  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");

  const stopAction: actionType = useMemo(
    () => ({
      name: "stop",
      modalTitle: "Campaign Stopped!",
      modalContent:
        "Your campaign was successfully stopped! Any new purchases won't qualify for any of the campaign prizes.",
      handle: () => program.stopCampaign(campaign.id),
    }),
    [campaign.id]
  );

  const startAction: actionType = useMemo(
    () => ({
      name: "start",
      modalTitle: "Campaign Started!",
      modalContent:
        "Your campaign was successfully started! New purchases are eligible for campaign prizes.",
      handle: () => program.startCampaign(campaign.id),
    }),
    [campaign.id]
  );

  const revokeAction: actionType = useMemo(
    () => ({
      name: "revoke",
      modalTitle: "Campaign Revoked!",
      modalContent:
        "Your campaign was successfully revoked! You can now withdraw any remaining funds.",
      handle: () => program.revokeCampaign(campaign.id),
    }),
    [campaign.id]
  );

  const handleAction = async (action: actionType) => {
    setIsLoading(true);
    try {
      await action.handle();
      setModalOpen(true);
    } catch (err) {
      console.error(
        `Error while executing ${action.name} for campaign ${campaign.id}: ${err}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = useCallback(async () => {
    setCurrAction(stopAction.name);
    setModalTitle(stopAction.modalTitle);
    setModalContent(stopAction.modalContent);
    await handleAction(stopAction);
  }, [stopAction]);

  const handleStart = useCallback(async () => {
    setCurrAction(startAction.name);
    setModalTitle(startAction.modalTitle);
    setModalContent(startAction.modalContent);
    await handleAction(startAction);
  }, [startAction]);

  const handleRevoke = useCallback(async () => {
    setCurrAction(revokeAction.name);
    setModalTitle(revokeAction.modalTitle);
    setModalContent(revokeAction.modalContent);
    await handleAction(revokeAction);
  }, [revokeAction]);

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
        title={modalTitle}
      >
        <p className="text-sm dark:text-secondary-dark">{modalContent}</p>
      </ConfirmModal>
      <CampaignDetailsSection config={campaign.config} />
      <Hr />
      <CampaignStatsSection campaign={campaign} />
      <Hr />
      <div className="md:flex items-center justify-end">
        {campaignIsStopped && (
          <>
            <Button onClick={handleStart} loading={isStarting}>
              Start Campaign
            </Button>
            <div className="pl-2">
              <Button destructive onClick={handleRevoke} loading={isRevoking}>
                Revoke Campaign
              </Button>
            </div>
          </>
        )}
        {campaignIsStarted && (
          <Button destructive onClick={handleStop} loading={isStopping}>
            Stop Campaign
          </Button>
        )}
      </div>
    </div>
  );
};

const PastCampaign: FC<{
  campaign: CampaignWithFunds;
  refresh: () => Promise<void>;
}> = ({ campaign, refresh }) => {
  return (
    <div>
      <CampaignDetailsSection config={campaign.config} />
      <Hr />
      <CampaignStatsSection campaign={campaign} />
      <Hr />
      <WithdrawFunds campaign={campaign} refresh={refresh} />
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
  const isStarted = campaign && campaign.state == CampaignState.Started;
  const isStopped = campaign && campaign.state == CampaignState.Stopped;
  const isRevoked = campaign && campaign.state == CampaignState.Revoked;

  return (
    <div>
      <NavLink pathname={"/campaigns"}>{"< All campaigns"}</NavLink>
      <SectionHeading>
        Campaign Details -{" "}
        <span className="dark:text-secondary-dark underline">
          [{toDisplayString(campaignId)}]
        </span>
      </SectionHeading>
      <Hr />
      {loading && <div>Loading</div>}
      {isDraft && <DraftCampaign refresh={refresh} campaign={campaign} />}
      {(isStarted || isStopped) && (
        <ActiveCampaign refresh={refresh} campaign={campaign} />
      )}
      {isRevoked && <PastCampaign refresh={refresh} campaign={campaign} />}
    </div>
  );
};

export default CampaignDetails;
