use anchor_lang::{prelude::*, AnchorDeserialize, AnchorSerialize};
use arrayref::array_ref;

//
// slot_hash account is an Vec of SlotHash entries
// https://github.com/solana-labs/solana/blob/master/sdk/program/src/slot_hashes.rs
// pub type SlotHash = (Slot, Hash);
//
// https://github.com/solana-labs/solana/blob/master/sdk/program/src/hash.rs
// pub const HASH_BYTES: usize = 32;
// pub struct Hash([u8; HASH_BYTES]);

const SLOT_HASH_VEC_PREFIX_BYTES: usize = 8;
const SLOT_HASH_ENTRY_SLOT_BYTES: usize = 8;
const SLOT_HASH_SKIP_BYTES: usize = SLOT_HASH_VEC_PREFIX_BYTES + SLOT_HASH_ENTRY_SLOT_BYTES;
const U64_SIZE_BYTES: usize = 8;
const VISITED_ARR_SIZE: usize = 30; // 30 purchases / 10 minutes => 1 purchase every 20sec.

#[error_code]
pub enum RiptideError {
    InvalidState,
    InvalidArgument,
    InvalidAccountData,
    IllegalOwner,
    AccountAlreadyInitialized,
    VaultNotInitialized,
    VaultAlreadyInitialized,
    InternalErrorProbArray,
    InternalErrorRandom,
    NotImplemented,
    PurchaseTooOld,
    PurchaseAlreadySeen,
}

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Default, Clone, Debug)]
pub struct Prize {
    pub amount: u64,
    pub count: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Default, Clone)]
pub struct PrizeData {
    pub entries: Vec<Prize>,
}

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Clone)]
pub enum CampaignEndType {
    ScheduledDate,
    TargetSalesReached,
}

impl Default for CampaignEndType {
    fn default() -> Self {
        CampaignEndType::TargetSalesReached
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Default, Clone)]
pub struct CampaignConfig {
    pub prize_data: PrizeData,
    pub end: CampaignEndType,
    pub target_end_ts: Option<i64>,
    pub target_sales_amount: Option<u64>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PrizeStats {
    pub awarded_count: u64,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CampaignStats {
    prize_stats: Vec<PrizeStats>,
    running_sales_amount: u64,
    running_sales_count: u64,
    created_ts: i64,
    start_ts: i64,
    stop_ts: i64,
}

impl CampaignStats {
    pub fn init(&mut self, pirze_entry_size: usize, ts_now: i64) {
        self.prize_stats = vec![PrizeStats { awarded_count: 0 }; pirze_entry_size];
        self.running_sales_amount = 0;
        self.running_sales_count = 0;
        self.created_ts = ts_now;
    }
    pub fn add_purchase(&mut self, purchase: Purchase) {
        self.running_sales_count += 1;
        self.running_sales_amount += purchase.amount;
    }
    pub fn estimate_remaining_purchases(&self, target_sales_amount: u64) -> u64 {
        let remaining_amount = target_sales_amount - self.running_sales_amount;
        if remaining_amount <= 0 {
            return 0;
        } else {
            let avg_purchase_amount = self.running_sales_amount / self.running_sales_count;
            return remaining_amount / avg_purchase_amount;
        }
    }
    pub fn award_prize(&mut self, prize_idx: usize) {
        self.prize_stats[prize_idx].awarded_count += 1;
    }
    pub fn get_awarded_prize_count(&self, prize_idx: usize) -> u64 {
        return self.prize_stats[prize_idx].awarded_count;
    }
    pub fn set_started(&mut self, ts_now: i64) {
        self.start_ts = ts_now;
    }
    pub fn set_stopped(&mut self, ts_now: i64) {
        self.stop_ts = ts_now;
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Purchase {
    pub amount: u64,
    pub slot: u64,
    pub hash: u32,
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

#[derive(Clone, AnchorSerialize, AnchorDeserialize, PartialEq, Eq)]
pub struct VisitedQueue {
    pub next: u8,
    pub count: u8,
    pub queue: [u32; VISITED_ARR_SIZE],
}

impl VisitedQueue {
    fn push(&mut self, val: u32) {
        self.queue[self.next as usize] = val;
        self.next = (self.next + 1) % (VISITED_ARR_SIZE as u8);
        self.count = self.count + 1;
        if self.count > VISITED_ARR_SIZE as u8 {
            self.count = VISITED_ARR_SIZE as u8;
        }
    }
    fn has(&self, val: u32) -> bool {
        for idx in 0..self.next {
            if self.queue[idx as usize] == val {
                return true;
            }
        }
        if self.count < VISITED_ARR_SIZE as u8 {
            return false;
        }
        for idx in self.next..VISITED_ARR_SIZE as u8 {
            if self.queue[idx as usize] == val {
                return true;
            }
        }
        return false;
    }
}

#[account]
pub struct Campaign {
    pub owner: Pubkey,
    pub state: CampaignState,
    pub config: CampaignConfig,
    pub stats: CampaignStats,
    pub visited: VisitedQueue,
    pub vaults: Vec<Vault>,
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
    fn validate_config(config: &CampaignConfig) -> bool {
        return match config.end {
            CampaignEndType::ScheduledDate => config.target_end_ts.is_some(),
            CampaignEndType::TargetSalesReached => config.target_sales_amount.is_some(),
        };
    }
    pub fn init(&mut self, owner: Pubkey, config: CampaignConfig) -> Result<()> {
        require!(self.can_init(), RiptideError::InvalidState);
        require!(
            config.end == CampaignEndType::TargetSalesReached,
            RiptideError::NotImplemented
        );
        require!(
            Campaign::validate_config(&config),
            RiptideError::InvalidArgument
        );
        let clock = Clock::get()?;
        self.owner = owner;
        self.config = config.clone();
        self.stats
            .init(config.prize_data.entries.len(), clock.unix_timestamp);
        self.state = CampaignState::Initialized;
        self.visited = VisitedQueue {
            next: 0,
            count: 0,
            queue: [0; VISITED_ARR_SIZE],
        };
        self.vaults = Vec::new();
        Ok(())
    }
    pub fn start(&mut self) -> Result<()> {
        let clock = Clock::get()?;
        require!(self.can_start(), RiptideError::InvalidState);
        self.state = CampaignState::Started;
        self.stats.set_started(clock.unix_timestamp);
        Ok(())
    }
    pub fn stop(&mut self) -> Result<()> {
        let clock = Clock::get()?;
        require!(self.can_stop(), RiptideError::InvalidState);
        self.state = CampaignState::Stopped;
        self.stats.set_stopped(clock.unix_timestamp);
        Ok(())
    }
    pub fn revoke(&mut self) -> Result<()> {
        require!(self.can_revoke(), RiptideError::InvalidState);
        self.state = CampaignState::Revoked;
        Ok(())
    }
    pub fn add_vault(&mut self, vault: Vault) -> Result<()> {
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
    pub fn remove_vault(&mut self, vault: Vault) -> Result<()> {
        require!(
            self.state == CampaignState::Revoked,
            RiptideError::InvalidState
        );
        require!(self.vaults.len() == 1, RiptideError::VaultNotInitialized);
        require!(self.vaults[0] == vault, RiptideError::InvalidAccountData);
        self.vaults.remove(0);
        Ok(())
    }
    pub fn crank(&mut self, purchase: Purchase, random: Random) -> Result<Option<Prize>> {
        require!(self.can_crank(), RiptideError::InvalidState);
        require!(
            !self.visited.has(purchase.hash),
            RiptideError::PurchaseAlreadySeen
        );
        self.visited.push(purchase.hash);
        self.stats.add_purchase(purchase);
        let winning_prob = self.get_winning_prob();
        require!(
            winning_prob.len() == self.config.prize_data.entries.len(),
            RiptideError::InternalErrorProbArray
        );
        let chance = random.float64();
        require!(
            chance >= 0.0 && chance <= 1.0,
            RiptideError::InternalErrorRandom
        );
        for (prize_idx, prize) in self.config.prize_data.entries.iter().enumerate() {
            let prob = winning_prob[prize_idx];
            if chance <= prob {
                self.stats.award_prize(prize_idx);
                return Ok(Some(prize.clone()));
            }
        }
        Ok(None)
    }
    fn get_winning_prob(&self) -> Vec<f64> {
        let target_sales_amount = self
            .config
            .target_sales_amount
            .expect("invalid config: target_sales_amount required");
        let remaining_purchases = self.stats.estimate_remaining_purchases(target_sales_amount);
        let remaining_prize_count = self.get_remaining_prize_count();
        let mut winning_prob: Vec<f64> = vec![0.0; remaining_prize_count.len()];
        for (idx, &count) in remaining_prize_count.iter().enumerate() {
            if count == 0 {
                winning_prob[idx] = 0.0;
            } else if remaining_purchases == 0 {
                winning_prob[idx] = 1.0;
            } else {
                winning_prob[idx] = (count as f64) / (remaining_purchases as f64);
            }
        }
        return winning_prob;
    }
    fn get_remaining_prize_count(&self) -> Vec<u64> {
        let mut remaining_prize_count = vec![0; self.config.prize_data.entries.len()];
        for (idx, prize) in self.config.prize_data.entries.iter().enumerate() {
            remaining_prize_count[idx] = prize.count - self.stats.get_awarded_prize_count(idx);
        }
        return remaining_prize_count;
    }
}

pub struct Random {
    f64val: f64,
}

impl Random {
    pub fn new(slot_hashes: &UncheckedAccount) -> Random {
        let data = slot_hashes.data.borrow();
        let most_recent = array_ref![data, SLOT_HASH_SKIP_BYTES, U64_SIZE_BYTES];
        let u64val = u64::from_le_bytes(*most_recent);
        let f64val = (u64val as f64) / (u64::MAX as f64);
        return Random { f64val: f64val };
    }
    pub fn float64(&self) -> f64 {
        return self.f64val;
    }
}

#[account]
pub struct Whitelist {
    pub initialized: bool,
    pub owner: Pubkey,
    pub bump: u8,
    pub allowed_crankers: Vec<Pubkey>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum UpdateWhitelistOp {
    SetOwner(Pubkey),
    AddAllowedCranker(Pubkey),
    RemoveAllowedCranker(Pubkey),
}

impl Whitelist {
    pub fn init(&mut self, owner: Pubkey, bump: u8) {
        self.initialized = true;
        self.owner = owner;
        self.bump = bump;
        self.allowed_crankers = Vec::new();
    }
    pub fn update(&mut self, op: UpdateWhitelistOp) -> Result<()> {
        match op {
            UpdateWhitelistOp::SetOwner(owner) => self.owner = owner,
            UpdateWhitelistOp::AddAllowedCranker(cranker) => self.add_allowed_cranker(cranker),
            UpdateWhitelistOp::RemoveAllowedCranker(cranker) => {
                self.remove_allowed_cranker(cranker)
            }
        }
        Ok(())
    }
    fn add_allowed_cranker(&mut self, cranker: Pubkey) {
        let crankers = &mut self.allowed_crankers;
        if !crankers.into_iter().any(|&mut c| c == cranker) {
            crankers.push(cranker);
        }
    }
    fn remove_allowed_cranker(&mut self, cranker: Pubkey) {
        let crankers = &mut self.allowed_crankers;
        if let Some(index) = crankers.into_iter().position(|&mut c| c == cranker) {
            crankers.swap_remove(index);
        }
    }
}
