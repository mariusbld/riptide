import express from 'express';
import * as web3 from '@solana/web3.js';
import { Idl, Program, Provider, Wallet, BN } from "@project-serum/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { clearIntervalAsync, setIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async/dynamic';
import idl from "./riptide.json";
import base58 from 'bs58';
import 'dotenv/config'

type rpcEndpointName = "local" | "devnet" | "testnet" | "mainnet-beta" | "genesys";
const rpcEndpointUrls: Map<rpcEndpointName, string> = new Map([
  ["local", "http://127.0.0.1:8899"],
  ["devnet", web3.clusterApiUrl("devnet")],
  ["testnet", web3.clusterApiUrl("testnet")],
  ["mainnet-beta", web3.clusterApiUrl("mainnet-beta")],
  ["genesys", "https://ssc-dao.genesysgo.net/"]
]);

const WALLET = process.env.WALLET;
const PORT = process.env.PORT || 8080;
const RUN_INTERVAL_MS = 5000;
const PHORIA_KEY = process.env.PHORIA_KEY;
const RPC_ENDPOINT = process.env.RPC_ENDPOINT as rpcEndpointName;
const RPC_ENDPOINT_URL = process.env.RPC_ENDPOINT_URL ?? rpcEndpointUrls.get(RPC_ENDPOINT);
const FETCH_LIMIT = 1000;
const PROGRAM_ID = process.env.PROGRAM_ID;
const CAMPAIGN_PDA_SEED = "campaign";

let phoriaPublicKey = new web3.PublicKey(PHORIA_KEY);
let wallet: Wallet;
let timer: SetIntervalAsyncTimer;
let connection: web3.Connection;
let lastTxSignatureFetched: web3.TransactionSignature;
let program: Program;
let pda: web3.PublicKey;
let bump: number;
// TODO: move to Redis
const campaignCache = new Map<web3.PublicKey, Campaign>();

interface crankCampaignInput {
  txId: web3.TransactionSignature;
  buyer: web3.PublicKey;
  campaign: Campaign;
}

const app = express();
start();

app.listen(PORT, () => {
  return console.log(`Listening at http://localhost:${PORT}`);
});

// TODO: limit max reach to 1 hour
async function fetchLatestTxSignatures(): Promise<web3.TransactionSignature[]> {
  let txSignatures: string[] = [];
  let hasMore = true;
  let lastFetched: string;
  
  while (hasMore) {
    const opt: web3.SignaturesForAddressOptions = { 
      before: lastFetched, 
      until: lastTxSignatureFetched,
      limit: FETCH_LIMIT
    };
    const sigInfoObjs = await connection
      .getSignaturesForAddress(phoriaPublicKey, opt, 'confirmed');
    console.log(`sigInfoObjs: ${sigInfoObjs}`);
    hasMore = sigInfoObjs.length === FETCH_LIMIT;
    const txSignatureBatch = sigInfoObjs.map(o => o.signature);
    console.log(`txSignatureBatch: ${txSignatureBatch}`);
    // txSignatures = txSignatures.concat(txSignatureBatch || []);
    // TODO: switch to the above.
    if (txSignatureBatch.length > 0) {
      txSignatures.push(txSignatureBatch[0]);
    }
  }
  txSignatures.reverse();
  return txSignatures;
}

async function run() {
  try {
    const txSignatures = await fetchLatestTxSignatures();
    console.log(`tx signatures: ${txSignatures}`);
    console.log(`tx len(signatures): ${txSignatures.length}`);
    if (!txSignatures.length) {
      console.log(`No more transactions to process!`);
      return;
    }
    if (txSignatures.length) { 
      lastTxSignatureFetched = txSignatures[0];
    } else {
      console.log(`No more transactions to process!`);
      return;
    }
    // TODO: batch fetch
    const txs = await connection.getParsedTransactions(txSignatures);
    const inputs = await parseTransactions(txs);
    await crankCampaigns(inputs);
  } catch (err) {
    console.error(err);
  }
}

async function start() {
  console.log(`Starting to poll endpoint: ${RPC_ENDPOINT_URL}`);
  connection = new web3.Connection(RPC_ENDPOINT_URL, 'confirmed');
  const opts: web3.ConfirmOptions = {
    preflightCommitment: "processed",
  };
  wallet = getWallet();
  const provider = new Provider(connection, wallet, opts);
  // TODO missing program id error:
  program = new Program(idl as Idl, PROGRAM_ID, provider);
  [pda, bump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(CAMPAIGN_PDA_SEED)], program.programId);
  timer = setIntervalAsync(run, RUN_INTERVAL_MS);
}

async function stop() {
  await clearIntervalAsync(timer);
}

async function crankCampaigns(inputs: crankCampaignInput[]) {
  for (const input of inputs) {
    await crankCampaign(input);
  }
}

async function parseTransactions(txs: web3.ParsedTransactionWithMeta[]): Promise<crankCampaignInput[]> {
  const inputs: crankCampaignInput[] = [];
  for (const tx of txs) {
    const input = await parseTransaction(tx);
    if (!input) {
      continue;
    }
    inputs.push(input);
  }
  return inputs;
}

async function parseTransaction(tx: web3.ParsedTransactionWithMeta): Promise<crankCampaignInput | null> {
  let txId: web3.TransactionSignature;
  let buyer: web3.PublicKey;
  let campaignKey: web3.PublicKey;

  try {
    txId = tx.transaction.signatures[0];
    buyer = tx.transaction.message.accountKeys.find(k => k.signer).pubkey;
    const accountKeys = tx.transaction.message.accountKeys;
    campaignKey = accountKeys[accountKeys.length - 1].pubkey;
  } catch (err) {
    console.log(`invalid tx object: ${JSON.stringify(tx)}`);
    return null;
  }

  try {
    const campaign = await getCampaign(campaignKey);
    return { txId, buyer, campaign };
  } catch (err) {
    console.warn(`Cannot parse account ${campaignKey} into Campaign Object. txId=${txId}`);
  }
  return null;
}

async function crankCampaign(input: crankCampaignInput) {
  const amount = new BN(100);
  const purchase = { amount };
  const { mint, token } = input.campaign.vaults[0];
  const vaultToken = token;
  const winnerToken = await getAssociatedTokenAddress(mint, input.buyer);
  const crankerToken = await getAssociatedTokenAddress(mint, wallet.publicKey);
  await program.rpc.crankCampaign(bump, purchase, {
    accounts: {
      cranker: wallet.publicKey,
      campaign: input.campaign.id,
      pda,
      vaultToken,
      winnerToken,
      crankerToken,
      tokenProgram: TOKEN_PROGRAM_ID,
      slotHashes: web3.SYSVAR_SLOT_HASHES_PUBKEY,
    }
  });
}

// TODO: move these to a common lib, share with merchant-fe
interface Vault {
  mint: web3.PublicKey;
  token: web3.PublicKey;
}

export enum CampaignState {
  None,
  Initialized,
  Started,
  Stopped,
  Revoked,
}

interface Campaign {
  id: web3.PublicKey;
  owner: web3.PublicKey;
  vaults: Vault[];
  state: CampaignState;
  // config: CampaignConfig;
  // stats: CampaignStats;
}

async function getCampaign(id: web3.PublicKey): Promise<Campaign> {
  const found = campaignCache.get(id);
  if (found) {
    return found;
  }
  const account = await program.account.campaign.fetch(id);
  const campaign = campaignFromAccount(id, account);
  campaignCache.set(id, campaign);
  return campaign;
}

function campaignFromAccount(id: web3.PublicKey, a: any): Campaign {
  return {
    id,
    owner: a.owner,
    vaults: a.vaults,
    state: toCampaignState(a.state),
  };
}

function toCampaignState(a: any): CampaignState {
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

function getWallet(): Wallet {
  const payer = web3.Keypair.fromSecretKey(base58.decode(WALLET));
  return new Wallet(payer);
}
