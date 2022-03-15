use anchor_lang::prelude::*;
use anchor_spl::token::{self};

use account::*;
use context::*;

mod account;
mod context;

const CRANK_MAX_LAG_SLOTS: u64 = 1000; // ~10 minutes
const ALLOWED_CRANKERS: [&str; 2] = [
    "GUrFU76TxEeTpfkZ7KHJHFrtz7nkDq7NhuF9pB4GonEg",
    "GnidQdkfJogurrmw6w7ftiKjcSv5Lbze3uStEeDgb8Z7"
];

declare_id!("H6EMst55Nf5nLJ6tZSoNE2T3Mq9M1stXuYsY7XcqFfpR");

#[program]
pub mod riptide {
    use super::*;
    pub fn init_campaign(ctx: Context<InitCampaign>, config: CampaignConfig) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.init(ctx.accounts.owner.key(), config)
    }
    pub fn add_campaign_funds(
        ctx: Context<AddCampaignFunds>,
        _bump: u8,
        amount: u64,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let vault = Vault {
            token: ctx.accounts.vault_token.key(),
            mint: ctx.accounts.vault_token.mint,
        };
        campaign.add_vault(vault)?;
        token::transfer(ctx.accounts.into(), amount)
    }
    pub fn withdraw_campaign_funds(ctx: Context<WithdrawCampaignFunds>, bump: u8) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let vault = Vault {
            token: ctx.accounts.vault_token.key(),
            mint: ctx.accounts.vault_token.mint,
        };
        campaign.remove_vault(vault)?;
        let seeds = &[&CAMPAIGN_PDA_SEED[..], &[bump]];
        token::transfer(
            ctx.accounts.into_transfer_context().with_signer(&[seeds]),
            ctx.accounts.vault_token.amount,
        )
    }
    pub fn start_campaign(ctx: Context<StartCampaign>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.start()
    }
    pub fn stop_campaign(ctx: Context<StopCampaign>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.stop()
    }
    pub fn revoke_campaign(ctx: Context<RevokeCampaign>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.revoke()
    }
    pub fn crank_campaign(ctx: Context<CrankCampaign>, bump: u8, purchase: Purchase) -> Result<()> {
        let clock = Clock::get()?;
        require!(
            clock.slot - purchase.slot <= CRANK_MAX_LAG_SLOTS,
            RiptideError::PurchaseTooOld
        );
        let cranker_key = ctx.accounts.cranker.key.to_string();
        require!(
            ALLOWED_CRANKERS.iter().any(|&s| s == cranker_key),
            RiptideError::IllegalOwner
        );
        let slot_hashes = &ctx.accounts.slot_hashes;
        let random = Random::new(slot_hashes);
        let campaign = &mut ctx.accounts.campaign;
        let prize = match campaign.crank(purchase, random) {
            Ok(prize_opt) => match prize_opt {
                None => return Ok(()),
                Some(prize) => prize,
            },
            Err(e) => return Err(e),
        };

        let winner_amount = prize.amount * 9 / 10; // 90% goes to the winner
        let cranker_amount = prize.amount - winner_amount; // remaining goes to the cranker as payment
        let seeds = &[&CAMPAIGN_PDA_SEED[..], &[bump]];
        token::transfer(
            ctx.accounts
                .into_transfer_to_winner_context()
                .with_signer(&[seeds]),
            winner_amount,
        )?;
        token::transfer(
            ctx.accounts
                .into_transfer_to_cranker_context()
                .with_signer(&[seeds]),
            cranker_amount,
        )
    }
}
