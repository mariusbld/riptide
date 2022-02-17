use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};
use crate::account::*;
use std::mem::size_of;

const ACCOUNT_HEADER_SIZE: usize = 8;
const MAX_PRIZE_ENTRIES: usize = 16;

pub const CAMPAIGN_PDA_SEED: &[u8] = b"campaign";

#[derive(Accounts)]
pub struct InitCampaign<'info> {
  // TODO (marius): convert to dynamic size
  #[account(init, 
    payer = owner, 
    space = ACCOUNT_HEADER_SIZE + size_of::<Campaign>() + MAX_PRIZE_ENTRIES * size_of::<PrizeEntry>()
  )]
  pub campaign: Account<'info, Campaign>,
  #[account(mut)]
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct AddCampaignFunds<'info> {
  #[account(mut)]
  pub campaign: Account<'info, Campaign>,
  #[account(seeds = [CAMPAIGN_PDA_SEED], bump = bump)]
  pub pda: AccountInfo<'info>,
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

impl<'info> From<&mut AddCampaignFunds<'info>>
  for CpiContext<'_, '_, '_, 'info, Transfer<'info>>
{
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
pub struct WithdrawCampaignFunds<'info> {
  #[account(mut)]
  pub campaign: Account<'info, Campaign>,
  pub owner: Signer<'info>,
  pub pda: AccountInfo<'info>,
  #[account(mut)]
  pub dst_token: Account<'info, TokenAccount>,
  #[account(mut)]
  pub vault_token: Account<'info, TokenAccount>,
  pub token_program: Program<'info, Token>
}

impl<'info> WithdrawCampaignFunds<'info> {
  pub fn into_transfer_context(&self) 
    -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
      let cpi_accounts = Transfer {
        from: self.vault_token.to_account_info().clone(),
        to: self.dst_token.to_account_info().clone(),
        authority: self.pda.clone(),
      };
      let cpi_program = self.token_program.to_account_info();
      CpiContext::new(cpi_program, cpi_accounts)
  }
}

#[derive(Accounts)]
pub struct StartCampaign<'info> {
  pub owner: Signer<'info>,
  #[account(mut)]
  pub campaign: Account<'info, Campaign>
}

#[derive(Accounts)]
pub struct StopCampaign<'info> {
  pub owner: Signer<'info>,
  #[account(mut)]
  pub campaign: Account<'info, Campaign>
}

#[derive(Accounts)]
pub struct RevokeCampaign<'info> {
  pub owner: Signer<'info>,
  #[account(mut)]
  pub campaign: Account<'info, Campaign>
}

#[derive(Accounts)]
pub struct CrankCampaign<'info> {
  #[account(mut)]
  pub campaign: Account<'info, Campaign>,
  pub pda: AccountInfo<'info>,
  #[account(mut)]
  pub vault_token: Account<'info, TokenAccount>,
  #[account(mut)]
  pub winner_token: Account<'info, TokenAccount>,
  #[account(mut)]
  pub cranker_token: Account<'info, TokenAccount>,
  pub token_program: Program<'info, Token>
}

impl<'info> CrankCampaign<'info> {
  pub fn into_transfer_to_winner_context(&self) 
    -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
    let cpi_accounts = Transfer {
      from: self.vault_token.to_account_info().clone(),
      to: self.winner_token.to_account_info().clone(),
      authority: self.pda.clone(),
    };
    let cpi_program = self.token_program.to_account_info();
    CpiContext::new(cpi_program, cpi_accounts)
  }
}

impl<'info> CrankCampaign<'info> {
  pub fn into_transfer_to_cranker_context(&self) 
    -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
    let cpi_accounts = Transfer {
      from: self.vault_token.to_account_info().clone(),
      to: self.cranker_token.to_account_info().clone(),
      authority: self.pda.clone(),
    };
    let cpi_program = self.token_program.to_account_info();
    CpiContext::new(cpi_program, cpi_accounts)
  }
}
