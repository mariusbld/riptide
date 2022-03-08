import { PublicKey } from "@solana/web3.js";
import { createContext, useContext } from "react";

export type CampaignEndType = "targetSalesReached" | "scheduledDate";
export type CampaignId = PublicKey;

export interface Prize {
  count: number;
  amount: number;
}

export interface PrizeData {
  entries: Prize[];
}

export interface CampaignConfig {
  prizeData: PrizeData;
  end: CampaignEndType;
  endDate?: Date;
  endSalesAmount?: number;
}

export interface PrizeStats {
  awardedCount: number;
}

export interface CampaignStats {
  prizeStats: PrizeStats[];
  runningSalesAmount: number;
  runningSalesCount: number;
  createdTime: Date;
  startTime: Date;
  endTime: Date;
}

export interface Vault {
  mint: PublicKey;
  token: PublicKey;
}

export interface VaultFunds {
  amount: number;
}

export type VaultWithFunds = Vault & VaultFunds;

export enum CampaignState {
  None,
  Initialized,
  Started,
  Stopped,
  Revoked,
}

export interface Campaign {
  id: CampaignId;
  owner: PublicKey;
  vaults: Vault[];
  state: CampaignState;
  config: CampaignConfig;
  stats: CampaignStats;
}

export interface CampaignFunds {
  vaultFunds: VaultWithFunds[];
}

export type CampaignWithFunds = Campaign & CampaignFunds;

export interface ProgramContextState {
  createCampaign(conf: CampaignConfig): Promise<CampaignId>;
  getCampaign(id: CampaignId): Promise<CampaignWithFunds>;
  addCampaignFunds(id: CampaignId, amount: number): Promise<void>;
  withdrawCampaignFunds(id: CampaignId, vault: Vault): Promise<void>;
  listCampaigns(): Promise<Campaign[]>;
  listActiveCampaigns(): Promise<Campaign[]>;
  startCampaign(id: CampaignId): Promise<void>;
  stopCampaign(id: CampaignId): Promise<void>;
  revokeCampaign(id: CampaignId): Promise<void>;
}

export const ProgramContext = createContext<ProgramContextState>(
  {} as ProgramContextState
);

export function useProgram(): ProgramContextState {
  return useContext(ProgramContext);
}
