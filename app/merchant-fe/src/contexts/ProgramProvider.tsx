import React, { FC, ReactNode, useEffect, useMemo, useState } from "react";
import { Keypair, SystemProgram } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { Idl, Program } from "@project-serum/anchor";
import {
  CampaignId,
  CampaignConfig,
  ProgramContext,
  Campaign,
  ProgramContextState,
  CampaignState,
} from "../hooks/useProgram";
import { useProvider } from "../hooks/useProvider";
import idl from "../riptide.json";

const PROGRAM_ID = "3fUXULHVF4EwjRG6hzuehMF2P15k6QQmXKCAcfAqn9iJ";
const BASE_ACCOUNT_OFFSET = 8;

export interface ProgramProviderProps {
  children: ReactNode;
}

export const ProgramProvider: FC<ProgramProviderProps> = ({ children }) => {
  const provider = useProvider();

  const program = useMemo<Nullable<Program>>(() => {
    if (!provider) {
      return null;
    }
    return new Program(idl as Idl, PROGRAM_ID, provider);
  }, [provider]);

  const client = useMemo<ProgramContextState>(() => {
    if (!program) {
      return new UnavailableClient();
    }
    return new Client(program);
  }, [program]);

  return (
    <ProgramContext.Provider value={client}>{children}</ProgramContext.Provider>
  );
};

class UnavailableClient implements ProgramContextState {
  createCampaign(conf: CampaignConfig): Promise<CampaignId> {
    throw new Error("Program unavailable");
  }
  getCampaign(id: CampaignId): Promise<Campaign> {
    throw new Error("Program unavailable");
  }
  listCampaigns(): Promise<Campaign[]> {
    throw new Error("Program unavailable");
  }
  startCampaign(id: CampaignId): Promise<void> {
    throw new Error("Program unavailable");
  }
  stopCampaign(id: CampaignId): Promise<void> {
    throw new Error("Program unavailable");
  }
  revokeCampaign(id: CampaignId): Promise<void> {
    throw new Error("Program unavailable");
  }
}

class Client implements ProgramContextState {
  program: Program;
  provider: anchor.Provider;

  constructor(program: Program) {
    this.program = program;
    this.provider = program.provider;
  }

  async createCampaign(config: CampaignConfig): Promise<CampaignId> {
    const campaignAccount = Keypair.generate();
    await this.program.rpc.initCampaign(
      {
        prizeData: {
          entries: config.prizeData.entries.map((p) => ({
            amount: new anchor.BN(p.amount),
            count: new anchor.BN(p.count),
          })),
        },
        end: { targetSalesReached: {} },
        targetSalesAmount: new anchor.BN(config.endSalesAmount!),
        targetEndTs: null,
      },
      {
        accounts: {
          campaign: campaignAccount.publicKey,
          owner: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [campaignAccount],
      }
    );
    return campaignAccount.publicKey;
  }
  async getCampaign(id: CampaignId): Promise<Campaign> {
    throw new Error("Method not implemented.");
  }
  async listCampaigns(): Promise<Campaign[]> {
    const campaignAccounts = await this.program.account.campaign.all([
      {
        memcmp: {
          offset: BASE_ACCOUNT_OFFSET,
          bytes: this.provider.wallet.publicKey.toBase58(),
        },
      },
    ]);
    return campaignAccounts.map(Client.toCampaign);
  }
  async startCampaign(id: CampaignId): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async stopCampaign(id: CampaignId): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async revokeCampaign(id: CampaignId): Promise<void> {
    throw new Error("Method not implemented.");
  }

  static toCampaign(a: any): Campaign {
    return {
      id: a.publicKey,
      owner: a.account.owner,
      vaults: [],
      state: Client.toCampaignState(a.account.state),
      config: {
        prizeData: {
          entries: a.account.config.prizeData.entries.map((e: any) => ({
            count: e.count.toNumber(),
            amount: e.amount.toNumber(),
          })),
        },
        start: "manual",
        end: "targetSalesReached",
        endSalesAmount: a.account.config.targetSalesAmount,
      },
      stats: {
        prizeStats: [],
        runningSalesAmount: 0,
        runningSalesCount: 0,
        createdTime: new Date(),
        startTime: new Date(),
        endTime: new Date(),
      },
    };
  }

  static toCampaignState(a: any): CampaignState {
    if (a.initialized) {
      return CampaignState.Initialized;
    }
    if (a.started) {
      return CampaignState.Started;
    }
    if (a.stopped) {
      return CampaignState.Stopped;
    }
    if (a.revoked) {
      return CampaignState.Revoked;
    }
    return CampaignState.None;
  }
}
