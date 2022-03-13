import * as anchor from "@project-serum/anchor";
import { Idl, Program } from "@project-serum/anchor";
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_SLOT_HASHES_PUBKEY,
} from "@solana/web3.js";
import React, { FC, ReactNode, useMemo } from "react";
import { useConfig } from "../hooks/useConfig";
import { useEndpoint } from "../hooks/useEndpoint";
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
  Winner,
} from "../hooks/useProgram";
import { useProvider } from "../hooks/useProvider";
import idl from "../riptide.json";

const BASE_ACCOUNT_OFFSET = 8;

export interface ProgramProviderProps {
  children: ReactNode;
}

export const ProgramProvider: FC<ProgramProviderProps> = ({ children }) => {
  const provider = useProvider();
  const { usdcMint, programId } = useConfig();
  const { url } = useEndpoint();

  const program = useMemo<Nullable<Program>>(() => {
    if (!provider) {
      return null;
    }
    return new Program(idl as Idl, programId, provider);
  }, [provider]);

  const queryConnection = useMemo(
    () => new Connection(url, "confirmed"),
    [url]
  );

  const client = useMemo<ProgramContextState>(() => {
    if (!program) {
      return new UnavailableClient();
    }
    return new Client(program, usdcMint.publicKey, queryConnection);
  }, [program, usdcMint, queryConnection]);

  return (
    <ProgramContext.Provider value={client}>{children}</ProgramContext.Provider>
  );
};

class UnavailableClient implements ProgramContextState {
  listCampaignWinners(id: CampaignId): Promise<Winner[]> {
    throw new Error("Method not implemented.");
  }
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
  program: Program;
  provider: anchor.Provider;
  wallet: PublicKey;
  usdcMint: PublicKey;
  // TODO: move this and all the API's to a QueryClient and QueryProvider
  queryConnection: Connection;

  static CAMPAIGN_PDA_SEED = "campaign";

  constructor(
    program: Program,
    usdcMint: PublicKey,
    queryConnection: Connection
  ) {
    this.program = program;
    this.provider = program.provider;
    this.wallet = program.provider.wallet.publicKey;
    this.usdcMint = usdcMint;
    this.queryConnection = queryConnection;
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

  async listCampaignWinners(campaignId: CampaignId): Promise<Winner[]> {
    const connection = this.queryConnection;
    // TODO: loop through all txs, this api currently paginates at 1,000 transactions.
    const infos = await connection.getSignaturesForAddress(
      campaignId,
      undefined,
      "confirmed"
    );
    const sigs = infos.map((info) => info.signature);
    if (sigs.length === 0) {
      return [];
    }
    const rawTxs = await connection.getParsedTransactions(sigs);
    const txs = rawTxs.filter(
      (e) => e
    ) as anchor.web3.ParsedTransactionWithMeta[];

    // TODO: find a better method to determine crank transactions.
    const crankTxs = txs.filter((tx) =>
      tx.transaction.message.accountKeys
        .map((a) => a.pubkey.toString())
        .includes(SYSVAR_SLOT_HASHES_PUBKEY.toString())
    );

    // TODO: find a better method to determine winners.
    const winnerTxs = crankTxs.filter(
      (tx) => tx.meta?.innerInstructions?.length
    );
    const winners = winnerTxs
      .map((tx) => {
        // const cranker = tx.transaction.message.accountKeys.find((k) => k.signer)?.pubkey;
        const allAccounts = new Set(
          tx.transaction.message.accountKeys.map((a) => a.pubkey.toString())
        );
        // buyer is the token balance account owner which is not included in the account list.
        const buyer = tx.meta?.preTokenBalances?.find(
          (b) => b.owner && !allAccounts.has(b.owner)
        )?.owner;
        const preTokenAccount = tx.meta?.preTokenBalances?.find(
          (e) => e.owner?.toString() === buyer
        );
        const postTokenAccount = tx.meta?.postTokenBalances?.find(
          (e) => e.owner?.toString() === buyer
        );
        let amount = 0;
        if (preTokenAccount && postTokenAccount) {
          const preBalance = preTokenAccount.uiTokenAmount.uiAmount;
          const postBalance = postTokenAccount.uiTokenAmount.uiAmount;
          if (preBalance !== null && postBalance !== null) {
            amount = postBalance - preBalance;
          }
        }
        return {
          wallet: new PublicKey(buyer!),
          amount,
          date: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(),
        };
      })
      .filter((w) => w.wallet) as Winner[];

    return winners;
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
        runningSalesAmount: a.stats.runningSalesAmount.toNumber(),
        runningSalesCount: a.stats.runningSalesCount.toNumber(),
        createdTime: a.stats.createdTs.toNumber()
          ? new Date(a.stats.createdTs.toNumber() * 1000)
          : undefined,
        startTime: !!a.stats.startTs
          ? new Date(a.stats.startTs.toNumber() * 1000)
          : undefined,
        stopTime: !!a.stats.stopTs
          ? new Date(a.stats.stopTs.toNumber() * 1000)
          : undefined,
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
