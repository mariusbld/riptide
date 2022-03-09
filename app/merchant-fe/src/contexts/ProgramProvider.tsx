import * as anchor from "@project-serum/anchor";
import { Idl, Program } from "@project-serum/anchor";
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import React, { FC, ReactNode, useMemo } from "react";
import { EndpointName, useEndpoint } from "../hooks/useEndpoint";
import {
  Campaign,
  CampaignConfig,
  CampaignId,
  CampaignState,
  CampaignWithFunds,
  ProgramContext,
  ProgramContextState,
  Vault,
  VaultWithFunds,
} from "../hooks/useProgram";
import { useProvider } from "../hooks/useProvider";
import idl from "../riptide.json";

// const PROGRAM_ID = "371nGytFGTK1wymnzyk9JdJM52AqjCkeYwRFtB8LRHAL";
const PROGRAM_ID = "2u551QiRFv6YjTFVCN3sjMBnaPKXqxKLmJKyiV69SKau";
const BASE_ACCOUNT_OFFSET = 8;

const USDC_MINT = new Map<EndpointName, PublicKey>([
  ["local", new PublicKey("CwP87NfhNJuwHpbGt8yBZLS1T8uTSGkf9tDJjqQjTwrj")],
  ["devnet", new PublicKey("BQMJtns23gcmAX1vxPrsSJML2keeVrgk57eCvb1s5vhs")],
]);

export interface ProgramProviderProps {
  children: ReactNode;
}

export const ProgramProvider: FC<ProgramProviderProps> = ({ children }) => {
  const provider = useProvider();
  const { endpoint } = useEndpoint();

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
    return new Client(program, endpoint);
  }, [program, endpoint]);

  return (
    <ProgramContext.Provider value={client}>{children}</ProgramContext.Provider>
  );
};

class UnavailableClient implements ProgramContextState {
  addCampaignFunds(id: PublicKey, amount: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  withdrawCampaignFunds(id: PublicKey, vault: Vault): Promise<void> {
    throw new Error("Method not implemented.");
  }
  createCampaign(conf: CampaignConfig): Promise<CampaignId> {
    throw new Error("Program unavailable");
  }
  getCampaign(id: CampaignId): Promise<CampaignWithFunds> {
    throw new Error("Program unavailable");
  }
  listCampaigns(): Promise<Campaign[]> {
    throw new Error("Program unavailable");
  }
  listActiveCampaigns(): Promise<Campaign[]> {
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
  endpoint: EndpointName;
  program: Program;
  provider: anchor.Provider;
  wallet: PublicKey;
  usdcMint: PublicKey;

  static CAMPAIGN_PDA_SEED = "campaign";

  constructor(program: Program, endpoint: EndpointName) {
    this.endpoint = endpoint;
    this.program = program;
    this.provider = program.provider;
    this.wallet = program.provider.wallet.publicKey;
    this.usdcMint = USDC_MINT.get(endpoint)!;
  }

  async getPda(): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
      [Buffer.from(Client.CAMPAIGN_PDA_SEED)],
      this.program.programId
    );
  }

  async addCampaignFunds(
    campaignId: CampaignId,
    amount: number
  ): Promise<void> {
    const srcToken = await getAssociatedTokenAddress(
      this.usdcMint,
      this.provider.wallet.publicKey
    );
    const vaultTokenAccount = Keypair.generate();
    const [pda, bump] = await this.getPda();
    await this.program.rpc.addCampaignFunds(bump, new anchor.BN(amount), {
      accounts: {
        campaign: campaignId,
        pda,
        owner: this.provider.wallet.publicKey,
        srcToken,
        vaultToken: vaultTokenAccount.publicKey,
        mint: this.usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      signers: [vaultTokenAccount],
    });
  }

  async withdrawCampaignFunds(
    campaign: PublicKey,
    vault: Vault
  ): Promise<void> {
    const [pda, bump] = await this.getPda();
    const dstToken = await getAssociatedTokenAddress(vault.mint, this.wallet);
    await this.program.rpc.withdrawCampaignFunds(bump, {
      accounts: {
        campaign,
        owner: this.wallet,
        pda,
        dstToken,
        vaultToken: vault.token,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
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

  async getCampaign(id: CampaignId): Promise<CampaignWithFunds> {
    const campaignAccount = await this.program.account.campaign.fetch(id);
    const campaign = Client.campaignFromAccount(id, campaignAccount);
    const vaultFunds: VaultWithFunds[] = [];
    for (const { mint, token } of campaign.vaults) {
      const vaultToken = await getAccount(this.provider.connection, token);
      const amount = Number(vaultToken.amount);
      vaultFunds.push({ mint, token, amount });
    }
    return { ...campaign, vaultFunds };
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
    return campaignAccounts.map((e) =>
      Client.campaignFromAccount(e.publicKey, e.account)
    );
  }

  async listActiveCampaigns(): Promise<Campaign[]> {
    const campaigns = await this.listCampaigns();
    return campaigns.filter(
      (c) =>
        c.state === CampaignState.Started || c.state === CampaignState.Stopped
    );
  }

  async startCampaign(id: CampaignId): Promise<void> {
    await this.program.rpc.startCampaign({
      accounts: {
        owner: this.wallet,
        campaign: id,
      },
    });
  }

  async stopCampaign(id: CampaignId): Promise<void> {
    await this.program.rpc.stopCampaign({
      accounts: {
        owner: this.wallet,
        campaign: id,
      },
    });
  }

  async revokeCampaign(id: CampaignId): Promise<void> {
    await this.program.rpc.revokeCampaign({
      accounts: {
        owner: this.wallet,
        campaign: id,
      },
    });
  }

  static campaignFromAccount(id: PublicKey, a: any): Campaign {
    return {
      id,
      owner: a.owner,
      vaults: a.vaults,
      state: Client.toCampaignState(a.state),
      config: {
        prizeData: {
          entries: a.config.prizeData.entries.map((e: any) => ({
            count: e.count.toNumber(),
            amount: e.amount.toNumber(),
          })),
        },
        end: "targetSalesReached",
        endSalesAmount: a.config.targetSalesAmount.toNumber(),
      },
      stats: {
        prizeStats: a.stats.prizeStats.map((e: any) => ({
          awardedCount: e.awardedCount.toNumber(),
        })),
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
