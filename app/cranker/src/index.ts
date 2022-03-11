import express from 'express';
import * as web3 from '@solana/web3.js';
import { Idl, Program, Provider, Wallet, BN } from "@project-serum/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { clearIntervalAsync, setIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async/dynamic';
import idl from "./riptide.json";
import base58 from 'bs58';
import 'dotenv/config';
import { createClient, RedisClientType } from 'redis';

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
const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6739"

let phoriaPublicKey = new web3.PublicKey(PHORIA_KEY);
let wallet: Wallet;
let timer: SetIntervalAsyncTimer;
let connection: web3.Connection;
let program: Program;
let pda: web3.PublicKey;
let bump: number;

const LAST_SIG_PROCESSED = "last_sig_processed";
const CRANK_ERR_LOG = "crank_err_log";
let redisClient: RedisClientType;
// TODO: move to Redis
const campaignCache = new Map<web3.PublicKey, Campaign>();

interface crankCampaignInput {
  txId: web3.TransactionSignature;
  amount: number;
  slot: number;
  buyer: web3.PublicKey;
  campaign: Campaign;
}

interface crankCampaignErr extends crankCampaignInput {
  err: string;
}

const app = express();
start();

app.listen(PORT, () => {
  return console.log(`Listening at http://localhost:${PORT}`);
});

// TODO: limit max reach to 1 hour
async function fetchLatestTxSignatures(lastTxSignatureProcessed: string): Promise<web3.TransactionSignature[]> {
  let txSignatures: string[] = [];
  let hasMore = true;
  let lastFetched: string;
  
  while (hasMore) {
    const opt: web3.SignaturesForAddressOptions = { 
      before: lastFetched, 
      until: lastTxSignatureProcessed,
      limit: FETCH_LIMIT
    };
    const sigInfoObjs = await connection
      .getSignaturesForAddress(phoriaPublicKey, opt, 'confirmed');
    hasMore = sigInfoObjs.length === FETCH_LIMIT;
    const txSignatureBatch = sigInfoObjs.map(o => o.signature) ?? [];
    txSignatures = txSignatures.concat(txSignatureBatch);
  }
  txSignatures.reverse();
  return txSignatures;
}

async function run() {
  try {
    const lastTxSignatureProcessed = await redisClient.get(LAST_SIG_PROCESSED);
    console.log(`Last signature processed: ${lastTxSignatureProcessed}`);
    const txSignatures = await fetchLatestTxSignatures(lastTxSignatureProcessed);
    if (txSignatures.length === 0) {
      console.log(`No more transactions to process!`);
      return;
    }
    // TODO: fetch in smaller batches
    const txs = await connection.getParsedTransactions(txSignatures);
    const inputs = await parseTransactions(txs);
    await crankCampaigns(inputs);
    await redisClient.set(LAST_SIG_PROCESSED, txSignatures[txSignatures.length - 1]);
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
  console.log(`Connecting to Redis ${REDIS_URL}`);
  redisClient = createClient({ url: REDIS_URL });
  await redisClient.connect();
  timer = setIntervalAsync(run, RUN_INTERVAL_MS);
}

async function stop() {
  await clearIntervalAsync(timer);
}

async function crankCampaigns(inputs: crankCampaignInput[]) {
  for (const input of inputs) {
    try {
      await crankCampaign(input);
    } 
    catch (err) {
      console.error(`Failed to crank ${input}: ${err}`);
      reportCrankError(input, err.toString());
    }
  }
}

async function reportCrankError(input: crankCampaignInput, crankErr: string) {
  try {
    const reportErr: crankCampaignErr = {
      ...input,
      err: crankErr,
    }
    await redisClient.lPush(CRANK_ERR_LOG, JSON.stringify(reportErr));
  } catch (err) {
    console.log(`Error reporting crank error: ${err}`);
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
  try {
    const slot = tx.slot;
    const txId = tx.transaction.signatures[0];
    const buyer = tx.transaction.message.accountKeys.find(k => k.signer).pubkey;

    const transferIx = tx.transaction.message.instructions.find(ix => {
      const parsedIx = ix as web3.ParsedInstruction;
      return parsedIx.programId.toString() === TOKEN_PROGRAM_ID.toString();
    });
    const parsedIx = transferIx as web3.ParsedInstruction;
    const amount = parseFloat(parsedIx.parsed.info.tokenAmount.amount);

    const accountKeys = tx.transaction.message.accountKeys;
    const campaign = await findCampaign(accountKeys);
    if (!campaign) {
      console.log(`cannot find campaign account. tx=${txId}`);
      return null;
    }
    return { txId, buyer, campaign, amount, slot };
  } catch (err) {
    console.log(`error parsing transaction: ${err}. tx=${JSON.stringify(tx)}`);
    return null;
  }
}

async function findCampaign(accountKeys: web3.ParsedMessageAccount[]): Promise<Campaign | null> {
  accountKeys.reverse();
  for (const account of accountKeys) {
    if (!validCampaignAccount(account)) {
      continue;
    }
    try {
      const campaign = await getCampaign(account.pubkey);
      return campaign;
    } catch {
    }
  }
  return null;
}

function validCampaignAccount(account: web3.ParsedMessageAccount): boolean {
  if (account.signer || account.writable) {
    return false;
  }
  const otherAccounts = new Set([TOKEN_PROGRAM_ID.toString(), PHORIA_KEY]);
  if (otherAccounts.has(account.pubkey.toString())) {
    return false;
  }
  return true;
}

async function crankCampaign(input: crankCampaignInput) {
  console.log(`Cranking ${JSON.stringify(input)}`);
  const amount = new BN(input.amount);
  const slot = new BN(input.slot);
  const hash = getTxHashUint32(input.txId);
  const purchase = { amount, slot, hash };
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

function getTxHashUint32(txId: web3.TransactionSignature): number {
  return getTxHash(txId, 4);
}

function getTxHash(txId: web3.TransactionSignature, bytes: number = 4): number {
  const arr = base58.decode(txId);
  const buffer = Buffer.from(arr.slice(arr.length - bytes, arr.length));
  var result = buffer.readUIntBE(0, bytes);
  return result;
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
