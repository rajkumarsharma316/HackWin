# Hackathon Registry — Soroban Smart Contract

A Soroban smart contract on Stellar that permanently records hackathon winners on-chain.

## Features
- Register hackathons (admin only)
- Add winners with rank, prize (XLM), and project details (admin only)
- Public read: list all winners, all hackathons
- Verify any wallet address as a registered winner
- Global stats: total winners, hackathons, prize pool

## Project Structure
```
hackathon-registry/
├── contracts/
│   └── hackathon-registry/   ← Soroban contract (Rust)
│       └── src/lib.rs
├── Cargo.toml                ← Workspace
└── README.md
```

## Build
```bash
cargo build --target wasm32-unknown-unknown --release
```

## Test
```bash
cargo test
```
