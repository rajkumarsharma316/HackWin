#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Symbol,
};

// ─── Data Types ───────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Admin,
    Name,
    Symbol,
    Decimals,
    Balance(Address),
    TotalSupply,
    Allowance(Address, Address), // (owner, spender)
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct HackWinToken;

#[contractimpl]
impl HackWinToken {
    // ── Initialize ──────────────────────────────────────────────────────────

    /// Called once on deployment. Sets admin and token metadata.
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
        env.storage().instance().set(&DataKey::TotalSupply, &0i128);
    }

    // ── Admin Helpers ────────────────────────────────────────────────────────

    fn require_admin(env: &Env) -> Address {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        admin
    }

    // ── Mint (Admin Only) ────────────────────────────────────────────────────

    /// Mint new tokens to the specified address. Admin only.
    pub fn mint(env: Env, to: Address, amount: i128) {
        Self::require_admin(&env);
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let balance = Self::balance(env.clone(), to.clone());
        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &(balance + amount));

        let supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(supply + amount));

        // Emit event
        env.events()
            .publish((symbol_short!("mint"), to), amount);
    }

    // ── Transfer ─────────────────────────────────────────────────────────────

    /// Transfer tokens from one address to another. Requires auth from sender.
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("Insufficient balance");
        }

        let to_balance = Self::balance(env.clone(), to.clone());

        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));

        // Emit event
        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    // ── Approve ──────────────────────────────────────────────────────────────

    /// Approve a spender to transfer tokens on behalf of the owner.
    pub fn approve(env: Env, owner: Address, spender: Address, amount: i128) {
        owner.require_auth();
        env.storage().instance().set(
            &DataKey::Allowance(owner.clone(), spender.clone()),
            &amount,
        );

        env.events()
            .publish((symbol_short!("approve"), owner, spender), amount);
    }

    // ── Transfer From (Allowance) ────────────────────────────────────────────

    /// Transfer tokens using an allowance. Requires auth from the spender.
    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) {
        spender.require_auth();
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowance < amount {
            panic!("Insufficient allowance");
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("Insufficient balance");
        }

        let to_balance = Self::balance(env.clone(), to.clone());

        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));
        env.storage().instance().set(
            &DataKey::Allowance(from.clone(), spender),
            &(allowance - amount),
        );

        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    // ── Read-Only Functions ──────────────────────────────────────────────────

    /// Get the balance of an address.
    pub fn balance(env: Env, addr: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(addr))
            .unwrap_or(0)
    }

    /// Get the allowance for a spender on behalf of an owner.
    pub fn allowance(env: Env, owner: Address, spender: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Allowance(owner, spender))
            .unwrap_or(0)
    }

    /// Get total supply of the token.
    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    /// Get token name.
    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    /// Get token symbol.
    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }

    /// Get token decimals.
    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Decimals).unwrap()
    }

    /// Get admin address.
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{Address, Env, String};

    #[test]
    fn test_initialize_and_metadata() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(HackWinToken, ());
        let client = HackWinTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(
            &admin,
            &String::from_str(&env, "HackWin Token"),
            &String::from_str(&env, "HWT"),
            &7,
        );

        assert_eq!(client.name(), String::from_str(&env, "HackWin Token"));
        assert_eq!(client.symbol(), String::from_str(&env, "HWT"));
        assert_eq!(client.decimals(), 7);
        assert_eq!(client.total_supply(), 0);
    }

    #[test]
    fn test_mint_and_balance() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(HackWinToken, ());
        let client = HackWinTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(
            &admin,
            &String::from_str(&env, "HackWin Token"),
            &String::from_str(&env, "HWT"),
            &7,
        );

        client.mint(&user, &10000);
        assert_eq!(client.balance(&user), 10000);
        assert_eq!(client.total_supply(), 10000);

        // Mint more
        client.mint(&user, &5000);
        assert_eq!(client.balance(&user), 15000);
        assert_eq!(client.total_supply(), 15000);
    }

    #[test]
    fn test_transfer() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(HackWinToken, ());
        let client = HackWinTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        client.initialize(
            &admin,
            &String::from_str(&env, "HackWin Token"),
            &String::from_str(&env, "HWT"),
            &7,
        );

        client.mint(&alice, &10000);
        client.transfer(&alice, &bob, &3000);

        assert_eq!(client.balance(&alice), 7000);
        assert_eq!(client.balance(&bob), 3000);
    }

    #[test]
    fn test_approve_and_transfer_from() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(HackWinToken, ());
        let client = HackWinTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let owner = Address::generate(&env);
        let spender = Address::generate(&env);
        let recipient = Address::generate(&env);

        client.initialize(
            &admin,
            &String::from_str(&env, "HackWin Token"),
            &String::from_str(&env, "HWT"),
            &7,
        );

        client.mint(&owner, &10000);
        client.approve(&owner, &spender, &5000);
        assert_eq!(client.allowance(&owner, &spender), 5000);

        client.transfer_from(&spender, &owner, &recipient, &3000);
        assert_eq!(client.balance(&owner), 7000);
        assert_eq!(client.balance(&recipient), 3000);
        assert_eq!(client.allowance(&owner, &spender), 2000);
    }

    #[test]
    #[should_panic(expected = "Insufficient balance")]
    fn test_transfer_insufficient_balance() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(HackWinToken, ());
        let client = HackWinTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        client.initialize(
            &admin,
            &String::from_str(&env, "HackWin Token"),
            &String::from_str(&env, "HWT"),
            &7,
        );

        client.mint(&alice, &100);
        client.transfer(&alice, &bob, &500); // Should panic
    }
}
