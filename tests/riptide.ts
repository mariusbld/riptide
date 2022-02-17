import * as anchor from '@project-serum/anchor';
import { createAssociatedTokenAccount, createMint, getAccount, getAssociatedTokenAddress, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Riptide } from '../target/types/riptide';
import { expect } from 'chai';

const CAMPAIGN_PDA_SEED = "campaign";

function newPrize(amount: number) {
  return { amount: new anchor.BN(amount) };
}

function newPrizeEntry(amount: number, count: number, odds: number) {
  return {
    count: new anchor.BN(count),
    odds: new anchor.BN(odds),
    prize: newPrize(amount)    
  };
}

describe('riptide', () => {
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.Riptide as anchor.Program<Riptide>;
  const conn = program.provider.connection;
  const owner = anchor.web3.Keypair.generate();
  //const owner = program.provider.wallet;
  const campaignKeypair = anchor.web3.Keypair.generate();
  let mint: anchor.web3.PublicKey;
  let pda: anchor.web3.PublicKey;
  let bump: number;

  before(async () => {
    const airDrop = await program.provider.connection.requestAirdrop(owner.publicKey, 1e10);
    await program.provider.connection.confirmTransaction(airDrop);
    [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(CAMPAIGN_PDA_SEED)], program.programId);
    mint = await createMint(
      program.provider.connection, owner, owner.publicKey, null, 0);
  });
  
  it('init campaign', async() => {
    const prizeEntry1 = newPrizeEntry(100, 1, 1);
    const prizeEntry2 = newPrizeEntry(50, 5, 10);
    const prizeData = { entries: [prizeEntry1, prizeEntry2] };
    await program.rpc.initCampaign(prizeData, {
      accounts: {
        campaign: campaignKeypair.publicKey,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      },
      signers: [campaignKeypair, owner]
    });

    const campaign = await program.account.campaign.fetch(campaignKeypair.publicKey);
    expect(campaign.owner).to.eql(owner.publicKey);
    expect(campaign.prize.entries.length).to.eql(prizeData.entries.length);
    expect(campaign.state).to.eql({ initialized: {} });
  });

  it('add funds', async() => {
    const vaultToken = anchor.web3.Keypair.generate();
    const amount = new anchor.BN(1000);
    const srcToken = await createAssociatedTokenAccount(conn, owner, mint, owner.publicKey);
    await mintTo(conn, owner, mint, srcToken, owner, amount.toNumber());

    await program.rpc.addCampaignFunds(bump, amount, {
      accounts: {
        campaign: campaignKeypair.publicKey,
        pda,
        owner: owner.publicKey,
        srcToken,
        vaultToken: vaultToken.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [vaultToken, owner]
    });

    const vault = await getAccount(conn, vaultToken.publicKey);
    expect(Number(vault.amount)).to.equal(amount.toNumber());
    const src = await getAccount(conn, srcToken);
    expect(Number(src.amount)).to.equal(0);
  });

  it ('start campaign', async () => {
    await program.rpc.startCampaign({
      accounts: {
        owner: owner.publicKey,
        campaign: campaignKeypair.publicKey
      },
      signers: [owner]
    });
    const campaign = await program.account.campaign.fetch(campaignKeypair.publicKey);
    expect(campaign.state).to.eql({ started: {} });
  });

  it ('stop campaign', async () => {
    await program.rpc.stopCampaign({
      accounts: {
        owner: owner.publicKey,
        campaign: campaignKeypair.publicKey
      },
      signers: [owner]
    });
  });

  it ('revoke campaign', async () => {
    await program.rpc.revokeCampaign({
      accounts: {
        owner: owner.publicKey,
        campaign: campaignKeypair.publicKey
      },
      signers: [owner]
    });
  });

  it('withdraw funds', async() => {
    let campaign = await program.account.campaign.fetch(campaignKeypair.publicKey);
    const vaultToken = campaign.vaults[0].token;
    const initialVault = await getAccount(conn, vaultToken);
    const dstToken = await getAssociatedTokenAddress(mint, owner.publicKey);

    await program.rpc.withdrawCampaignFunds(bump, {
      accounts: {
        campaign: campaignKeypair.publicKey,
        owner: owner.publicKey,
        pda,
        dstToken,
        vaultToken: vaultToken,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [owner]
    });

    const vault = await getAccount(conn, vaultToken);
    expect(Number(vault.amount)).to.equal(0);
    const dst = await getAccount(conn, dstToken);
    expect(Number(dst.amount)).to.equal(Number(initialVault.amount));
  });
});
