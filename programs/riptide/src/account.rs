use anchor_lang::{prelude::*, AnchorDeserialize, AnchorSerialize};
// use solana_program::sysvar::recent_blockhashes::Entry;
use std::result::Result as ResultGeneric;

#[error]
pub enum RiptideError {
    InvalidState,
    VaultNotInitialized,
    VaultAlreadyInitialized,
    InternalErrorProbArray,
    InternalErrorRandom,
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
pub struct PrizeEntryStats {
    awarded_count: u64,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Stats {
    pub prize_stats: Vec<PrizeEntryStats>,
    pub target_purchase_volume: u64,
    pub running_purchase_volume: u64,
    pub running_purchase_count: u64,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Purchase {
    amount: u64,
}

impl Stats {
    pub fn init(&mut self, pirze_entry_size: usize, target_volume: u64) {
        self.prize_stats = vec![PrizeEntryStats { awarded_count: 0 }; pirze_entry_size];
        self.target_purchase_volume = target_volume;
        self.running_purchase_volume = 0;
        self.running_purchase_count = 0;
    }
    pub fn add_purchase(&mut self, purchase: Purchase) {
        self.running_purchase_count += 1;
        self.running_purchase_volume += purchase.amount;
    }
    pub fn estimate_remaining_purchases(&self) -> u64 {
        let remaining_volume = self.target_purchase_volume - self.running_purchase_volume;
        if remaining_volume <= 0 {
            return 0;
        } else {
            let avg_purchase_amount = self.running_purchase_volume / self.running_purchase_count;
            return remaining_volume / avg_purchase_amount;
        }
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
    pub fn init(&mut self, owner: Pubkey, prize: PrizeData, target_volume: u64) -> ProgramResult {
        require!(self.can_init(), RiptideError::InvalidState);
        self.owner = owner;
        self.prize = prize.clone();
        self.stats.init(prize.entries.len(), target_volume);
        self.state = CampaignState::Initialized;
        self.vaults = Vec::new();
        Ok(())
    }
    pub fn start(&mut self) -> ProgramResult {
        require!(self.can_start(), RiptideError::InvalidState);
        self.state = CampaignState::Started;
        Ok(())
    }
    pub fn stop(&mut self) -> ProgramResult {
        require!(self.can_stop(), RiptideError::InvalidState);
        self.state = CampaignState::Stopped;
        Ok(())
    }
    pub fn revoke(&mut self) -> ProgramResult {
        require!(self.can_revoke(), RiptideError::InvalidState);
        self.state = CampaignState::Revoked;
        Ok(())
    }
    pub fn add_vault(&mut self, vault: Vault) -> ProgramResult {
        require!(
            self.state == CampaignState::Initialized,
            RiptideError::InvalidState
        );
        require!(
            self.vaults.len() == 0,
            RiptideError::VaultAlreadyInitialized
        );
        self.vaults.push(vault);
        Ok(())
    }
    pub fn remove_vault(&mut self, vault: Vault) -> ProgramResult {
        require!(
            self.state == CampaignState::Revoked,
            RiptideError::InvalidState
        );
        require!(self.vaults.len() == 1, RiptideError::VaultNotInitialized);
        require!(self.vaults[0] == vault, ProgramError::InvalidAccountData);
        self.vaults.remove(0);
        Ok(())
    }
    pub fn crank(
        &mut self,
        purchase: Purchase,
        random: Random,
    ) -> ResultGeneric<Option<Prize>, ProgramError> {
        require!(self.can_crank(), RiptideError::InvalidState);
        self.stats.add_purchase(purchase);
        let winning_prob = self.get_winning_prob();
        require!(
            winning_prob.len() == self.prize.entries.len(),
            RiptideError::InternalErrorProbArray
        );
        let chance = random.float64();
        require!(
            chance >= 0.0 && chance <= 1.0,
            RiptideError::InternalErrorRandom
        );
        for (prize_idx, prize_entry) in self.prize.entries.iter().enumerate() {
            let prob = winning_prob[prize_idx];
            if chance <= prob {
                return Ok(Some(prize_entry.prize));
            }
        }
        Ok(None)
    }
    fn get_winning_prob(&self) -> Vec<f64> {
        let remaining_purchases = self.stats.estimate_remaining_purchases();
        let remaining_prize_count = self.get_remaining_prize_count();
        let mut winning_prob: Vec<f64> = vec![0.0; remaining_prize_count.len()];
        for (idx, &count) in remaining_prize_count.iter().enumerate() {
            winning_prob[idx] = (count as f64) / (remaining_purchases as f64);
        }
        return winning_prob;
    }
    fn get_remaining_prize_count(&self) -> Vec<u64> {
        let mut remaining_prize_count = vec![0; self.prize.entries.len()];
        for (idx, prize_entry) in self.prize.entries.iter().enumerate() {
            remaining_prize_count[idx] =
                prize_entry.count - self.stats.prize_stats[idx].awarded_count;
        }
        return remaining_prize_count;
    }
}

pub struct Random {
    pub hashes: RecentBlockhashes,
}

impl Random {
    pub fn new(hashes: RecentBlockhashes) -> Random {
        return Random { hashes: hashes };
    }
    pub fn float64(&self) -> f64 {
        let bytes = self.hashes[0].blockhash.to_bytes();
        let ival = i64::from_ne_bytes([
            bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7],
        ]);
        let fval = (ival.abs() as f64) / (i64::MAX as f64);
        return fval;
    }
}
