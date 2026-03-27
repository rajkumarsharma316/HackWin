#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec, Symbol,
};

// ─── Data Types ───────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct Hackathon {
    pub id: u64,
    pub name: String,
    pub date: String,
    pub organizer: String,
    pub winner_count: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Winner {
    pub wallet: Address,
    pub name: String,
    pub project: String,
    pub hackathon_id: u64,
    pub hackathon_name: String,
    pub prize_xlm: i128,
    pub rank: u32,
    pub timestamp: u64,
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Admin,
    HackathonCount,
    Hackathon(u64),
    HackathonWinners(u64),
    WinnerByWallet(Address),
    TotalWinners,
    TotalPrize,
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct HackathonRegistry;

#[contractimpl]
impl HackathonRegistry {
    // ── Initialize ──────────────────────────────────────────────────────────

    /// Called once on deployment. Sets the admin wallet.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::HackathonCount, &0u64);
        env.storage().instance().set(&DataKey::TotalWinners, &0u32);
        env.storage().instance().set(&DataKey::TotalPrize, &0i128);
    }

    // ── Admin Helpers ────────────────────────────────────────────────────────

    fn require_admin(env: &Env) -> Address {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        admin
    }

    fn get_hackathon_count(env: &Env) -> u64 {
        env.storage().instance().get(&DataKey::HackathonCount).unwrap_or(0)
    }

    // ── Hackathon Management ─────────────────────────────────────────────────

    /// Admin creates a new hackathon entry. Returns its ID.
    pub fn create_hackathon(
        env: Env,
        name: String,
        date: String,
        organizer: String,
    ) -> u64 {
        Self::require_admin(&env);

        let count = Self::get_hackathon_count(&env);
        let id = count + 1;

        let hackathon = Hackathon {
            id,
            name,
            date,
            organizer,
            winner_count: 0,
        };

        env.storage().instance().set(&DataKey::Hackathon(id), &hackathon);
        env.storage().instance().set(&DataKey::HackathonCount, &id);
        env.storage()
            .instance()
            .set(&DataKey::HackathonWinners(id), &Vec::<Winner>::new(&env));

        id
    }

    // ── Winner Management ────────────────────────────────────────────────────

    /// Admin registers a winner for a hackathon.
    pub fn add_winner(
        env: Env,
        hackathon_id: u64,
        wallet: Address,
        name: String,
        project: String,
        prize_xlm: i128,
        rank: u32,
    ) {
        Self::require_admin(&env);

        // Fetch hackathon
        let mut hackathon: Hackathon = env
            .storage()
            .instance()
            .get(&DataKey::Hackathon(hackathon_id))
            .expect("Hackathon not found");

        let winner = Winner {
            wallet: wallet.clone(),
            name,
            project,
            hackathon_id,
            hackathon_name: hackathon.name.clone(),
            prize_xlm,
            rank,
            timestamp: env.ledger().timestamp(),
        };

        // Append to hackathon winners list
        let mut winners: Vec<Winner> = env
            .storage()
            .instance()
            .get(&DataKey::HackathonWinners(hackathon_id))
            .unwrap_or(Vec::new(&env));
        winners.push_back(winner.clone());
        env.storage()
            .instance()
            .set(&DataKey::HackathonWinners(hackathon_id), &winners);

        // Index winner by wallet address
        env.storage()
            .instance()
            .set(&DataKey::WinnerByWallet(wallet), &winner);

        // Update hackathon winner count
        hackathon.winner_count += 1;
        env.storage()
            .instance()
            .set(&DataKey::Hackathon(hackathon_id), &hackathon);

        // Update global stats
        let total: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalWinners)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalWinners, &(total + 1));

        let prize_total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalPrize)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalPrize, &(prize_total + prize_xlm));
    }

    // ── Public Read Functions ────────────────────────────────────────────────

    /// Returns all winners for a given hackathon ID.
    pub fn get_winners(env: Env, hackathon_id: u64) -> Vec<Winner> {
        env.storage()
            .instance()
            .get(&DataKey::HackathonWinners(hackathon_id))
            .unwrap_or(Vec::new(&env))
    }

    /// Returns all registered hackathons.
    pub fn get_hackathons(env: Env) -> Vec<Hackathon> {
        let count = Self::get_hackathon_count(&env);
        let mut list = Vec::new(&env);
        for i in 1..=count {
            if let Some(h) = env.storage().instance().get(&DataKey::Hackathon(i)) {
                list.push_back(h);
            }
        }
        list
    }

    /// Verify if a wallet belongs to a registered winner.
    pub fn verify_winner(env: Env, wallet: Address) -> Option<Winner> {
        env.storage()
            .instance()
            .get(&DataKey::WinnerByWallet(wallet))
    }

    /// Returns global stats: (total_winners, total_hackathons, total_prize_xlm)
    pub fn get_stats(env: Env) -> (u32, u64, i128) {
        let total_winners: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalWinners)
            .unwrap_or(0);
        let total_hackathons = Self::get_hackathon_count(&env);
        let total_prize: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalPrize)
            .unwrap_or(0);
        (total_winners, total_hackathons, total_prize)
    }

    /// Returns the current admin address.
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::{Address, Env, String};

    #[test]
    fn test_full_flow() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(HackathonRegistry, ());
        let client = HackathonRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let winner_wallet = Address::generate(&env);

        // Initialize
        client.initialize(&admin);

        // Create hackathon
        let hack_id = client.create_hackathon(
            &String::from_str(&env, "HackStellar 2025"),
            &String::from_str(&env, "2025-06-01"),
            &String::from_str(&env, "Stellar Foundation"),
        );
        assert_eq!(hack_id, 1);

        // Add winner
        client.add_winner(
            &hack_id,
            &winner_wallet,
            &String::from_str(&env, "Alice"),
            &String::from_str(&env, "DeFi Escrow"),
            &5000,
            &1,
        );

        // Verify winner
        let found = client.verify_winner(&winner_wallet);
        assert!(found.is_some());
        let w = found.unwrap();
        assert_eq!(w.rank, 1);
        assert_eq!(w.prize_xlm, 5000);

        // Get stats
        let (total_w, total_h, total_p) = client.get_stats();
        assert_eq!(total_w, 1);
        assert_eq!(total_h, 1);
        assert_eq!(total_p, 5000);
    }
}
