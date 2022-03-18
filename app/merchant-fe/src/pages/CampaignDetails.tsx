import { PublicKey } from "@solana/web3.js";
import { capitalize } from "../utils/format";
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
  Campaign,
  CampaignState,
  CampaignWithFunds,
  useProgram,
  Winner,
} from "../hooks/useProgram";
import { getMissingPrizeFunds, getVaultFunds } from "../utils/campaign";
import { toCurrencyString, toDisplayString } from "../utils/format";
import { useCampaignCache } from "../hooks/useCampaignCache";
import { useErrorReporting } from "../hooks/useErrorReporting";

const AddFunds: FC<{
  campaign: CampaignWithFunds;
  refresh: () => Promise<void>;
}> = ({ campaign, refresh }) => {
  const { usdcMint } = useConfig();
  const program = useProgram();
  const { showError } = useErrorReporting();
  const missingFunds = getMissingPrizeFunds(campaign);
  const [loading, setLoading] = useState(false);

  const handleAddFunds = async () => {
    try {
      setLoading(true);
      await program.addCampaignFunds(campaign.id, missingFunds);
      await refresh();
    } catch (err) {
      showError("There was an error while adding funds. Please try again.");
      console.error(`Error while adding funds: ${err}`);
    } finally {
      setLoading(false);
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
      <Button loading={loading} small onClick={handleAddFunds}>
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
  const { showError } = useErrorReporting();
  const vaultFunds = getVaultFunds(campaign);
  const vault = useMemo(() => campaign.vaults.at(0), [campaign]);
  const [loading, setLoading] = useState(false);

  const handleWithdrawFunds = async () => {
    if (!vault) {
      return;
    }
    try {
      setLoading(true);
      await program.withdrawCampaignFunds(campaign.id, vault);
      await refresh();
    } catch (err) {
      showError(
        "There was an error while withdrawing funds. Please try again."
      );
      console.error(`Error while adding funds: ${err}`);
    } finally {
      setLoading(false);
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
      <Button loading={loading} small onClick={handleWithdrawFunds}>
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
  const { startedCampaigns } = useCampaignCache();
  const { showError } = useErrorReporting();

  const canStart = useMemo(() => {
    return getMissingPrizeFunds(campaign) === 0;
  }, [campaign]);

  const handleStart = async () => {
    if (startedCampaigns.length > 0) {
      showError(
        "You can only have 1 started campaign! Please stop other campaigns and try again."
      );
      return;
    }
    setIsStarting(true);
    try {
      await program.startCampaign(campaign.id);
      setModalOpen(true);
    } catch (err) {
      showError("There was an error starting the campaign. Please try again.");
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
    handle: () => Promise<boolean>;
  }

  const program = useProgram();
  const { showError } = useErrorReporting();
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

  const { startedCampaigns } = useCampaignCache();

  const stopAction: actionType = useMemo(
    () => ({
      name: "stop",
      modalTitle: "Campaign Stopped!",
      modalContent:
        "Your campaign was successfully stopped! Any new purchases won't qualify for this campaign prizes.",
      handle: async () => {
        await program.stopCampaign(campaign.id);
        return true;
      },
    }),
    [campaign.id]
  );

  const startAction: actionType = useMemo(
    () => ({
      name: "start",
      modalTitle: "Campaign Started!",
      modalContent:
        "Your campaign was successfully started! Open a new Point of Sale terminal to start accepting payments.",
      handle: async () => {
        if (startedCampaigns.length > 0) {
          showError(
            "You can only have 1 started campaign! Please stop other campaigns and try again."
          );
          return false;
        }
        await program.startCampaign(campaign.id);
        return true;
      },
    }),
    [campaign.id, startedCampaigns, showError]
  );

  const revokeAction: actionType = useMemo(
    () => ({
      name: "revoke",
      modalTitle: "Campaign Revoked!",
      modalContent:
        "Your campaign was successfully revoked! You can now withdraw any remaining funds.",
      handle: async () => {
        await program.revokeCampaign(campaign.id);
        return true;
      },
    }),
    [campaign.id]
  );

  const handleAction = async (action: actionType) => {
    setIsLoading(true);
    try {
      const success = await action.handle();
      success && setModalOpen(true);
    } catch (err) {
      showError("There was an error while performing this action.");
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

const CampaignWinnersPage: FC<{ campaign: Campaign }> = ({ campaign }) => {
  const program = useProgram();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const localWinners = await program.listCampaignWinners(campaign.id);
        setWinners(localWinners);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [campaign, program]);

  if (loading) {
    return <div>Loading..</div>;
  }

  return (
    <table>
      <tbody>
        {loading && <div>Loading..</div>}
        {!loading && !winners.length && <div>No winners yet.</div>}
        {!loading &&
          winners.map((w, idx) => (
            <tr key={idx}>
              <td>{w.date.toDateString()}</td>
              <td className="px-4">
                {w.amount.toFixed(2)}
                {" USDC"}
              </td>
              <td>{w.wallet.toString()}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};

type Subpage = "details" | "winners";

const SubpageMenu: FC<{
  subpages: Subpage[];
  selectedSubpage: Subpage;
  basePath: string;
}> = ({ subpages, selectedSubpage, basePath }) => {
  return (
    <div className="pt-4">
      {subpages.map((p: Subpage, idx: number) => (
        <span key={p}>
          {idx !== 0 && <span>{" | "}</span>}
          <NavLink pathname={`${basePath}/${p}`}>
            <span className={p === selectedSubpage ? "font-bold" : ""}>
              {capitalize(p)}
            </span>
          </NavLink>
        </span>
      ))}
    </div>
  );
};

const CampaignDetails: FC = () => {
  const { id, page } = useParams<{ id: string; page: string }>();
  const subpage = (page as Subpage) ?? "details";
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

  const subpages: Subpage[] = ["details", "winners"];

  return (
    <div>
      <NavLink pathname={"/campaigns"}>{"< All campaigns"}</NavLink>
      <SectionHeading>
        Campaign -{" "}
        <span className="dark:text-secondary-dark underline">
          [{toDisplayString(campaignId)}]
        </span>
      </SectionHeading>
      {!isDraft && (
        <SubpageMenu
          selectedSubpage={subpage}
          subpages={subpages}
          basePath={`/campaigns/${campaignId.toString()}`}
        />
      )}
      <Hr />
      {loading && <div>Loading..</div>}
      {!loading && campaign && subpage === "winners" && (
        <CampaignWinnersPage campaign={campaign} />
      )}
      {!loading && subpage === "details" && isDraft && (
        <DraftCampaign refresh={refresh} campaign={campaign} />
      )}
      {!loading && subpage === "details" && (isStarted || isStopped) && (
        <ActiveCampaign refresh={refresh} campaign={campaign} />
      )}
      {!loading && subpage === "details" && isRevoked && (
        <PastCampaign refresh={refresh} campaign={campaign} />
      )}
    </div>
  );
};

export default CampaignDetails;
