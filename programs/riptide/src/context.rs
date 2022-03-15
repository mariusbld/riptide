use crate::account::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};
use std::mem::size_of;

const ACCOUNT_HEADER_SIZE: usize = 8;
const MAX_PRIZE_ENTRIES: usize = 16;

pub const CAMPAIGN_PDA_SEED: &[u8] = b"campaign";
pub const WHITELIST_PDA_SEED: &[u8] = b"whitelist";
pub const MAX_WHITELIST_ENTRIES: usize = 4;

const SLOT_HASHES: &str = "SysvarS1otHashes111111111111111111111111111";

#[derive(Accounts)]
pub struct InitCampaign<'info> {
    // TODO (marius): convert to dynamic size
    #[account(init,
      payer = owner,
      space = ACCOUNT_HEADER_SIZE + size_of::<Campaign>() + MAX_PRIZE_ENTRIES * size_of::<Prize>()
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_bump: u8)]
pub struct AddCampaignFunds<'info> {
    #[account(mut, has_one = owner)]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: only used as a signing PDA
    #[account(seeds = [CAMPAIGN_PDA_SEED], bump = _bump)]
    pub pda: UncheckedAccount<'info>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub src_token: Account<'info, TokenAccount>,
    #[account(init, payer = owner, token::mint = mint, token::authority = pda)]
    pub vault_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> From<&mut AddCampaignFunds<'info>> for CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
    fn from(accounts: &mut AddCampaignFunds<'info>) -> Self {
        let cpi_accounts = Transfer {
            from: accounts.src_token.to_account_info().clone(),
            to: accounts.vault_token.to_account_info().clone(),
            authority: accounts.owner.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct WithdrawCampaignFunds<'info> {
    #[account(mut, has_one = owner)]
    pub campaign: Account<'info, Campaign>,
    pub owner: Signer<'info>,
    /// CHECK: only used as a signing PDA
    #[account(seeds = [CAMPAIGN_PDA_SEED], bump = bump)]
    pub pda: UncheckedAccount<'info>,
    #[account(mut)]
    pub dst_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

impl<'info> WithdrawCampaignFunds<'info> {
    pub fn into_transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.vault_token.to_account_info().clone(),
            to: self.dst_token.to_account_info().clone(),
            authority: self.pda.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct StartCampaign<'info> {
    pub owner: Signer<'info>,
    #[account(mut, has_one = owner)]
    pub campaign: Account<'info, Campaign>,
}

#[derive(Accounts)]
pub struct StopCampaign<'info> {
    pub owner: Signer<'info>,
    #[account(mut, has_one = owner)]
    pub campaign: Account<'info, Campaign>,
}

#[derive(Accounts)]
pub struct RevokeCampaign<'info> {
    pub owner: Signer<'info>,
    #[account(mut,
        constraint = campaign.owner == *owner.key
    )]
    pub campaign: Account<'info, Campaign>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CrankCampaign<'info> {
    pub cranker: Signer<'info>,
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: only used as a signing PDA
    #[account(seeds = [CAMPAIGN_PDA_SEED], bump = bump)]
    pub pda: UncheckedAccount<'info>,
    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub winner_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub cranker_token: Account<'info, TokenAccount>,
    // #[account(seeds = [WHITELIST_PDA_SEED], bump = whitelist.bump)]
    // pub whitelist: Account<'info, Whitelist>,
    pub token_program: Program<'info, Token>,
    /// CHECK: cannot read entire account, too large
    /// https://github.com/project-serum/anchor/issues/741
    #[account(constraint = slot_hashes.key.to_string() == SLOT_HASHES)]
    pub slot_hashes: UncheckedAccount<'info>,
}

impl<'info> CrankCampaign<'info> {
    pub fn into_transfer_to_winner_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.vault_token.to_account_info().clone(),
            to: self.winner_token.to_account_info().clone(),
            authority: self.pda.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

impl<'info> CrankCampaign<'info> {
    pub fn into_transfer_to_cranker_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.vault_token.to_account_info().clone(),
            to: self.cranker_token.to_account_info().clone(),
            authority: self.pda.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct InitWhitelist<'info> {
    #[account(init,
      payer = admin,
      space = ACCOUNT_HEADER_SIZE + size_of::<Whitelist>() + MAX_WHITELIST_ENTRIES * size_of::<Pubkey>(),
      seeds = [WHITELIST_PDA_SEED], bump
    )]
    pub whitelist: Account<'info, Whitelist>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateWhitelist<'info> {
    #[account(mut,
        seeds = [WHITELIST_PDA_SEED], bump = whitelist.bump,
        constraint = whitelist.owner == *owner.key
    )]
    pub whitelist: Account<'info, Whitelist>,
    #[account(mut)]
    pub owner: Signer<'info>,
}
