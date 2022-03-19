import * as anchor from "@project-serum/anchor";
import { Idl, Program } from "@project-serum/anchor";
import {
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import idl from "../token_airdrop.json";

const VAULT_PDA_SEED = "vault";
const TOKEN_AIRDROP_PROGRAM_ID = "7iqc1JNucA2BBPpC6M1Y2fY3qKjbAcKzs4Kz6WZW6hvz";

export function getProgram(provider: anchor.Provider) {
  return new Program(idl as Idl, TOKEN_AIRDROP_PROGRAM_ID, provider);
}

async function getPda(): Promise<[PublicKey, number]> {
  return await PublicKey.findProgramAddress(
    [Buffer.from(VAULT_PDA_SEED)],
    new PublicKey(TOKEN_AIRDROP_PROGRAM_ID)
  );
}

export async function initialize(
  provider: anchor.Provider,
  mint: PublicKey,
  dropAmount: number
): Promise<PublicKey> {
  const program = getProgram(provider);
  const [pda, bump] = await getPda();
  const airdropAccount = Keypair.generate();
  const vault = anchor.web3.Keypair.generate();

  await program.rpc.initialize(bump, new anchor.BN(dropAmount), {
    accounts: {
      airdrop: airdropAccount.publicKey,
      pda,
      vaultToken: vault.publicKey,
      mint,
      owner: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    },
    signers: [airdropAccount, vault],
  });
  return airdropAccount.publicKey;
}

export async function deposit(
  provider: anchor.Provider,
  airdropId: PublicKey,
  amount: number
) {
  const program = getProgram(provider);
  const owner = provider.wallet.publicKey;
  const { mint, token } = await program.account.airdropAccount.fetch(airdropId);
  const srcToken = await getAssociatedTokenAddress(mint, owner);

  await program.rpc.deposit(new anchor.BN(amount), {
    accounts: {
      owner: provider.wallet.publicKey,
      srcToken: srcToken,
      vaultToken: token,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    },
  });
}

export async function airdrop(
  provider: anchor.Provider,
  wallet: WalletContextState,
  airdropId: PublicKey
) {
  const program = getProgram(provider);
  const owner = provider.wallet.publicKey;
  const { mint, token } = await program.account.airdropAccount.fetch(airdropId);
  const [pda, bump] = await getPda();
  const dstToken = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    mint,
    owner,
    wallet
  );
  await program.rpc.airdrop(bump, {
    accounts: {
      airdrop: airdropId,
      pda,
      dstToken: dstToken.address,
      vaultToken: token,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
  });
}

// https://github.com/solana-labs/solana-program-library/blob/2292dc2c8c7d5fa762f5a0a1ea686e770d2da39b/token/js/src/actions/getOrCreateAssociatedTokenAccount.ts#L35
async function getOrCreateAssociatedTokenAccount(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  wallet: WalletContextState
): Promise<Account> {
  const associatedToken = await getAssociatedTokenAddress(mint, owner);

  // This is the optimal logic, considering TX fee, client-side computation, RPC roundtrips and guaranteed idempotent.
  // Sadly we can't do this atomically.
  let account: Account;
  try {
    account = await getAccount(
      connection,
      associatedToken,
      undefined,
      TOKEN_PROGRAM_ID
    );
  } catch (error: unknown) {
    console.error(error);
    // TokenAccountNotFoundError can be possible if the associated address has already received some lamports,
    // becoming a system account. Assuming program derived addressing is safe, this is the only case for the
    // TokenInvalidAccountOwnerError in this code path.
    if (
      error instanceof TokenAccountNotFoundError ||
      error instanceof TokenInvalidAccountOwnerError
    ) {
      // As this isn't atomic, it's possible others can create associated accounts meanwhile.
      try {
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            owner,
            associatedToken,
            owner,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
        await wallet.sendTransaction(transaction, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error: unknown) {
        console.error(`error creating account :${error}`);
        // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
        // instruction error if the associated account exists already.
      }
      // Now this should always succeed
      account = await getAccount(
        connection,
        associatedToken,
        undefined,
        TOKEN_PROGRAM_ID
      );
    } else {
      throw error;
    }
  }
  return account;
}
