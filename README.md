# HackWin 🏆
![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![Code Quality](https://img.shields.io/badge/code%20quality-A-blue)

## Project Description
HackWin is a decentralized Hackathon Winner Registry built on the Stellar blockchain. It permanently records hackathon winners on-chain using a Soroban smart contract — tamper-proof, verifiable, and forever accessible through a modern web interface.

## Project Vision
HackWin makes hackathon achievements trustworthy and permanent by:

- storing winner records immutably on Stellar through smart contracts,
- letting anyone verify a winner's credentials with just a wallet address, and
- providing a sleek, responsive glassmorphism UI that makes on-chain data accessible.

## Key Features
- On-chain hackathon winner registry powered by Soroban smart contracts
- Public winner verification by Stellar wallet address
- Admin dashboard for creating hackathons and registering winners
- Real-time stats dashboard (total winners, hackathons, XLM awarded)
- Freighter wallet integration for signing transactions
- Hybrid mode — works with deployed contract or localStorage demo mode
- Responsive glassmorphism UI with dark theme and animations

## How It Works
1. **Connect Wallet:** Admin connects their Freighter wallet on the Stellar testnet.
2. **Create Hackathon:** Register a hackathon event (name, date, organizer) — stored on-chain.
3. **Add Winners:** Record winners with wallet address, project name, rank, and prize in XLM.
4. **Verify Anytime:** Anyone can verify a winner by pasting their Stellar wallet address.

## Deployed Smart Contract Details

| Item | Value |
|------|-------|
| **Network** | Stellar Testnet |
| **Contract ID** | `CDF7PK6UC76PNPX5WNWTOAQ3RG3ZZILWSTFOQANW3HYQW5MVIKIPTNKQ` |
| **Soroban RPC** | `https://soroban-testnet.stellar.org` |
| **Network Passphrase** | `Test SDF Network ; September 2015` |

> 🔎 View on [Stellar Explorer](https://stellar.expert/explorer/testnet/contract/CDF7PK6UC76PNPX5WNWTOAQ3RG3ZZILWSTFOQANW3HYQW5MVIKIPTNKQ)

## Demo Link
https://hackwin.vercel.app

## CI/CD Status
- **Workflow:** `.github/workflows/ci.yml`
- **Badge:** ![CI](https://github.com/rajkumarsharma316/HackWin/actions/workflows/ci.yml/badge.svg)

## Project Setup Guide

### Prerequisites
- Node.js 18+ and npm
- Rust toolchain with `wasm32-unknown-unknown` target
- Soroban CLI
- [Freighter Wallet](https://freighter.app/) browser extension

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rajkumarsharma316/HackWin.git
   cd HackWin
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

4. **Build contracts (from repo root):**
   ```bash
   cd hackathon-registry
   cargo build --target wasm32-unknown-unknown --release
   ```

## Testing
Run the smart contract test suite:

```bash
cd hackathon-registry
cargo test
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              USER (Freighter Wallet)            │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│          Next.js Frontend (React 19)            │
│   Home · Admin · Verify · Winners               │
│   contract.ts (Soroban ↔ localStorage)          │
└────────────────────┬────────────────────────────┘
                     │ Soroban RPC
                     ▼
┌─────────────────────────────────────────────────┐
│     HackathonRegistry Smart Contract (Rust)     │
│     Stellar Testnet · soroban-sdk v25           │
└─────────────────────────────────────────────────┘
```

## Tech Stack
- **Soroban Smart Contracts** (Rust)
- **React 19 + Next.js 16**
- **Stellar SDK + Freighter API**
- **CSS** (Glassmorphism Design System)
- **GitHub Actions** (CI/CD)
- **Vercel** (Hosting)

## Future Scope
- Multi-admin support with role-based access
- On-chain certificate NFT minting for winners
- Mainnet deployment
- Winner profile pages with project links
- IPFS integration for project documentation

## License
MIT
