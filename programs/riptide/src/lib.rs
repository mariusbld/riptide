use anchor_lang::prelude::*;
use anchor_spl::token::{self};

use account::*;
use context::*;

mod account;
mod context;

declare_id!("371nGytFGTK1wymnzyk9JdJM52AqjCkeYwRFtB8LRHAL");

#[program]
pub mod riptide {
    use super::*;
    pub fn init_campaign(ctx: Context<InitCampaign>, config: CampaignConfig) -> ProgramResult {
        let campaign = &mut ctx.accounts.campaign;
        campaign.init(ctx.accounts.owner.key(), config)
    }
    pub fn add_campaign_funds(
        ctx: Context<AddCampaignFunds>,
        bump: u8,
        amount: u64,
    ) -> ProgramResult {
        let campaign = &mut ctx.accounts.campaign;
        let vault = Vault {
            token: ctx.accounts.vault_token.key(),
            mint: ctx.accounts.vault_token.mint,
        };
        campaign.add_vault(vault)?;
        token::transfer(ctx.accounts.into(), amount)
    }
    pub fn withdraw_campaign_funds(ctx: Context<WithdrawCampaignFunds>, bump: u8) -> ProgramResult {
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
    pub fn start_campaign(ctx: Context<StartCampaign>) -> ProgramResult {
        let campaign = &mut ctx.accounts.campaign;
        campaign.start()
    }
    pub fn stop_campaign(ctx: Context<StopCampaign>) -> ProgramResult {
        let campaign = &mut ctx.accounts.campaign;
        campaign.stop()
    }
    pub fn revoke_campaign(ctx: Context<RevokeCampaign>) -> ProgramResult {
        let campaign = &mut ctx.accounts.campaign;
        campaign.revoke()
    }
    pub fn crank_campaign(
        ctx: Context<CrankCampaign>,
        bump: u8,
        purchase: Purchase,
    ) -> ProgramResult {
        let campaign = &mut ctx.accounts.campaign;
        let recent_blockhashes =
            RecentBlockhashes::from_account_info(ctx.accounts.recent_blockhashes.as_ref())?;
        let random = Random::new(recent_blockhashes);
        //let random = Random::new(ctx.accounts.recent_blockhashes.account);
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
