import * as anchor from '@project-serum/anchor';
import { createAssociatedTokenAccount, createMint, getAccount, getAssociatedTokenAddress, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Riptide } from '../target/types/riptide';
import { expect } from 'chai';

const CAMPAIGN_PDA_SEED = "campaign";

function newPrize(count: number, amount: number) {
  return {
    count: new anchor.BN(count),
    amount: new anchor.BN(amount)
  };
}

describe('riptide', () => {
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.Riptide as anchor.Program<Riptide>;
  const conn = program.provider.connection;
  const owner = anchor.web3.Keypair.generate();
  //const owner = program.provider.wallet;
  const winner = anchor.web3.Keypair.generate();
  let winnerToken: anchor.web3.PublicKey;
  const cranker = anchor.web3.Keypair.generate();
  let crankerToken: anchor.web3.PublicKey;
  const campaignKeypair = anchor.web3.Keypair.generate();
  let mint: anchor.web3.PublicKey;
  let pda: anchor.web3.PublicKey;
  let bump: number;
  
  const prize1 = newPrize(1, 100);
  const prize2 = newPrize(5, 50);
  const prizeData = { entries: [prize1, prize2] };

  const totalPrizeAmount = prizeData.entries.reduce(
    (sum, curr) => sum + curr.count.toNumber() * curr.amount.toNumber(), 0);

  const TARGET_SALES_AMOUNT = 500;
  const PURCHASE_AMOUNT = 50;
  const NUM_PURCHASES = TARGET_SALES_AMOUNT / PURCHASE_AMOUNT;

  before(async () => {
    const airDrop = await program.provider.connection.requestAirdrop(owner.publicKey, 1e10);
    await program.provider.connection.confirmTransaction(airDrop);
    [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(CAMPAIGN_PDA_SEED)], program.programId);
    mint = await createMint(conn, owner, owner.publicKey, null, 0);
    winnerToken = await createAssociatedTokenAccount(conn, owner, mint, winner.publicKey);
    crankerToken = await createAssociatedTokenAccount(conn, owner, mint, cranker.publicKey);
  });
  
  it('init campaign', async() => {
    const end = { targetSalesReached: {} }
    const targetSalesAmount = new anchor.BN(TARGET_SALES_AMOUNT);
    const targetEndTs = null;
    const config = { prizeData, end, targetSalesAmount, targetEndTs };
    await program.rpc.initCampaign(config, {
      accounts: {
        campaign: campaignKeypair.publicKey,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      },
      signers: [campaignKeypair, owner]
    });

    const campaign = await program.account.campaign.fetch(campaignKeypair.publicKey);
    expect(campaign.owner).to.eql(owner.publicKey);
    expect(campaign.config.prizeData.entries.length).to.eql(prizeData.entries.length);
    expect(campaign.config.end).to.eql(end);
    expect(campaign.config.targetSalesAmount.toNumber()).to.eql(targetSalesAmount.toNumber())
    expect(campaign.state).to.eql({ initialized: {} });
    expect(campaign.stats.prizeStats.length).to.eql(prizeData.entries.length);
  });

  it('add funds', async() => {
    const vaultToken = anchor.web3.Keypair.generate();
    const amount = new anchor.BN(totalPrizeAmount);
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

  xit ('stop campaign', async () => {
    await program.rpc.stopCampaign({
      accounts: {
        owner: owner.publicKey,
        campaign: campaignKeypair.publicKey
      },
      signers: [owner]
    });
  });

  xit ('revoke campaign', async () => {
    await program.rpc.revokeCampaign({
      accounts: {
        owner: owner.publicKey,
        campaign: campaignKeypair.publicKey
      },
      signers: [owner]
    });
  });

  xit('withdraw funds', async() => {
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

  it('crank campaign', async() => {
    let campaign = await program.account.campaign.fetch(campaignKeypair.publicKey);
    const vaultToken = campaign.vaults[0].token;
    const amount = new anchor.BN(PURCHASE_AMOUNT);
    
    const epochInfo = await program.provider.connection.getEpochInfo();
    const slot = new anchor.BN(epochInfo.absoluteSlot);
    const purchase = { amount, slot };

    for (let i = 0; i < NUM_PURCHASES; i++) {
      await program.rpc.crankCampaign(bump, purchase, {
        accounts: {
          cranker: cranker.publicKey,
          campaign: campaignKeypair.publicKey,
          pda,
          vaultToken,
          winnerToken,
          crankerToken,
          tokenProgram: TOKEN_PROGRAM_ID,
          slotHashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
        },
        signers: [cranker]
      });
    }

    let refreshCampaign = await program.account.campaign.fetch(campaignKeypair.publicKey);
    expect(refreshCampaign.stats.prizeStats.length).to.eql(prizeData.entries.length);
    const prizesCount = prizeData.entries.map(e => e.count.toNumber());
    const awardedCount = refreshCampaign.stats.prizeStats.map(e => e.awardedCount.toNumber());
    expect(prizesCount, "All prizes were awarded").to.eql(awardedCount);
    const vault = await getAccount(conn, vaultToken);
    expect(Number(vault.amount), "All funds were awarded").to.equal(0);
    const winnerAccount = await getAccount(conn, winnerToken);
    const winnerPrizeAmount = totalPrizeAmount * 0.9;
    const crankerPrizeAmount = totalPrizeAmount - winnerPrizeAmount;
    expect(Number(winnerAccount.amount), "Winner got their prize").to.equal(winnerPrizeAmount);
    const crankerAccount = await getAccount(conn, crankerToken);
    expect(Number(crankerAccount.amount), "Cranker got paid").to.equal(crankerPrizeAmount);
  });
});
