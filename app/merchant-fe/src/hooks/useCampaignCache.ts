import { createContext, useContext } from "react";
import { Campaign } from "./useProgram";

export interface CampaignCacheState {
  activeCampaigns: Campaign[];
}

export const CampaignCacheContext = createContext<CampaignCacheState>(
  {} as CampaignCacheState
);

export function useCampaignCache(): CampaignCacheState {
  return useContext(CampaignCacheContext);
}
