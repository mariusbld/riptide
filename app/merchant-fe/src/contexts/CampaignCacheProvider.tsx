import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import { CampaignCacheContext } from "../hooks/useCampaignCache";
import {
  useProgram,
  Campaign,
  CampaignEvent,
  CampaignEventType,
  CampaignState,
} from "../hooks/useProgram";

interface props {
  children: ReactNode;
}

export const CampaignCacheProvider: FC<props> = ({ children }) => {
  const program = useProgram();
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const startedCampaigns = useMemo(
    () => activeCampaigns.filter((c) => c.state === CampaignState.Started),
    [activeCampaigns]
  );

  const reloadActiveCampaigns = useCallback(() => {
    (async () => {
      try {
        const campaigns = await program.listActiveCampaigns();
        setActiveCampaigns(campaigns);
      } catch (err) {
        console.error(`error fetching active campaigns: ${err}`);
      }
    })();
  }, [program]);

  const onCampaignEvent = useCallback(
    (e: CampaignEvent) => {
      if (
        e.eventType === CampaignEventType.CampaignStarted ||
        e.eventType === CampaignEventType.CampaignStopped
      ) {
        reloadActiveCampaigns();
      }
    },
    [reloadActiveCampaigns]
  );

  useEffect(() => {
    try {
      reloadActiveCampaigns(); // TODO: await for finish before registering callback
      program.addEventCallback(onCampaignEvent);
      return () => program.removeEventCallback(onCampaignEvent);
    } catch (err) {
      console.error(`error trying to register campaign event callback: ${err}`);
    }
  }, [program]);

  return (
    <CampaignCacheContext.Provider
      value={{ activeCampaigns, startedCampaigns }}
    >
      {children}
    </CampaignCacheContext.Provider>
  );
};
