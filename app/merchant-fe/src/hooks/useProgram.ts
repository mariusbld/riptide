import { PublicKey } from "@solana/web3.js";
import { createContext, useContext } from "react";

export type CampaignStartType = "now" | "scheduled" | "manual";
export type CampaignEndType = "salesVolume" | "scheduled";
export type CampaignId = PublicKey;

export interface Prize {
  count: number;
  amount: number;
}

export interface CampaignConfig {
  start: CampaignStartType;
  startDate?: Date;
  end: CampaignEndType;
  endDate?: Date;
  endSalesVolume?: number;
  prizes: Prize[];
}

export interface CampaignStats {
  prizesAwarded: number[];
}

export interface Campaign {
  config: CampaignConfig;
  stats: CampaignStats;
}

export interface ProgramContextState {
  createCampaign(conf: CampaignConfig): CampaignId;
  getCampaign(id: CampaignId): Campaign;
  listCampaigns(): Campaign[];
  startCampaign(id: CampaignId): void;
  stopCampaign(id: CampaignId): void;
  revokeCampaign(id: CampaignId): void;
}

export const ProgramContext = createContext<ProgramContextState>({} as ProgramContextState);

export function useProgram(): ProgramContextState {
  return useContext(ProgramContext);
}
