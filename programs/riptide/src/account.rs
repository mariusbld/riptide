use anchor_lang::{prelude::*, AnchorDeserialize, AnchorSerialize};
use std::result::Result as ResultGeneric;

#[error]
pub enum CampaignError {
    InvalidState,
    VaultNotInitialized,
    VaultAlreadyInitialized,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, Copy)]
pub struct Prize {
    pub amount: u64,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, Copy)]
pub struct PrizeEntry {
    prize: Prize,
    count: u64,
    odds: u64,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PrizeData {
    pub entries: Vec<PrizeEntry>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Stats {
    pub prize_awarded_count: Vec<u64>,
    pub total_volume: u64,
}

impl Stats {
    pub fn init(&mut self, pirze_entry_size: usize) {
        self.total_volume = 0;
        self.prize_awarded_count = vec![0; pirze_entry_size];
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, PartialEq, Eq)]
pub struct Vault {
    pub mint: Pubkey,
    pub token: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CampaignState {
    None,
    Initialized,
    Started,
    Stopped,
    Revoked,
}

#[account]
pub struct Campaign {
    pub owner: Pubkey,
    pub vaults: Vec<Vault>,
    pub prize: PrizeData,
    pub stats: Stats,
    pub state: CampaignState,
}

impl Campaign {
    fn can_init(&self) -> bool {
        self.state == CampaignState::None
    }
    fn can_start(&self) -> bool {
        self.state == CampaignState::Initialized || self.state == CampaignState::Stopped
    }
    fn can_stop(&self) -> bool {
        self.state == CampaignState::Started
    }
    fn can_revoke(&self) -> bool {
        self.state == CampaignState::Stopped
    }
    fn can_crank(&self) -> bool {
        self.state == CampaignState::Started
    }
    pub fn init(&mut self, owner: Pubkey, prize: PrizeData) -> ProgramResult {
        require!(self.can_init(), CampaignError::InvalidState);
        self.owner = owner;
        self.prize = prize.clone();
        self.stats.init(prize.entries.len());
        self.state = CampaignState::Initialized;
        self.vaults = Vec::new();
        Ok(())
    }
    pub fn start(&mut self) -> ProgramResult {
        require!(self.can_start(), CampaignError::InvalidState);
        self.state = CampaignState::Started;
        Ok(())
    }
    pub fn stop(&mut self) -> ProgramResult {
        require!(self.can_stop(), CampaignError::InvalidState);
        self.state = CampaignState::Stopped;
        Ok(())
    }
    pub fn revoke(&mut self) -> ProgramResult {
        require!(self.can_revoke(), CampaignError::InvalidState);
        self.state = CampaignState::Revoked;
        Ok(())
    }
    pub fn add_vault(&mut self, vault: Vault) -> ProgramResult {
        require!(
            self.state == CampaignState::Initialized,
            CampaignError::InvalidState
        );
        require!(
            self.vaults.len() == 0,
            CampaignError::VaultAlreadyInitialized
        );
        self.vaults.push(vault);
        Ok(())
    }
    pub fn remove_vault(&mut self, vault: Vault) -> ProgramResult {
        require!(
            self.state == CampaignState::Revoked,
            CampaignError::InvalidState
        );
        require!(self.vaults.len() == 1, CampaignError::VaultNotInitialized);
        require!(self.vaults[0] == vault, ProgramError::InvalidAccountData);
        self.vaults.remove(0);
        Ok(())
    }
    pub fn crank(&mut self) -> ResultGeneric<Option<Prize>, ProgramError> {
        require!(self.can_crank(), CampaignError::InvalidState);
        Ok(None)
    }
}
