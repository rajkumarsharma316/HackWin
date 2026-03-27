# HackWin 🏆
![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![Code Quality](https://img.shields.io/badge/code%20quality-A-blue)

## Project Description
HackWin is an on-chain Hackathon Winner Registry built on the Stellar blockchain. It uses a Soroban smart contract to permanently record hackathon winners in a tamper-proof, publicly verifiable manner — along with a modern glassmorphism web interface for admins and public users.

## Demo Video
<!-- Replace with your actual demo video link -->
[HackWin Demo Video](https://hackwin.vercel.app)

## Project Vision
The vision of HackWin is to bring transparency and permanence to hackathon achievements by:

- recording winner data immutably on Stellar through smart contracts,
- enabling anyone to verify a winner's credentials with just a wallet address, and
- providing a sleek, responsive UI that makes on-chain verification accessible to everyone.

## Key Features
- **On-chain winner registry** powered by Soroban smart contracts
- **Public verification** — paste any Stellar wallet address to check winner status
- **Admin dashboard** for creating hackathons and registering winners
- **Glassmorphism UI** with dark theme, animations, and mobile responsive design
- **Freighter wallet integration** for transaction signing
- **Hybrid mode** — works with the deployed contract or in localStorage demo mode
- **Real-time stats** — total winners, hackathons, and XLM prize pool

## How It Works
HackWin is simple but powerful. Here is how the system operates:

1. **Connect Wallet:** Admin connects their Freighter wallet on the Stellar testnet.
2. **Create Hackathon:** Register a new hackathon event with name, date, and organizer — stored permanently on-chain.
3. **Add Winners:** Record winners with their wallet address, project name, rank, and prize amount in XLM.
4. **Verify Anytime:** Anyone can verify a winner by pasting their Stellar wallet address on the public Verify page.

**Example:** If Alice won 1st place at HackStellar 2025 with a prize of 5,000 XLM, her record lives on-chain forever and can be verified by anyone.

## Deployed Smart Contract Details

### Contract ID and Transaction Hash
| Contract           | Address / Contract ID                                      | Deployment Tx Hash |
|--------------------|------------------------------------------------------------|--------------------|
| HackathonRegistry  | `CDF7PK6UC76PNPX5WNWTOAQ3RG3ZZILWSTFOQANW3HYQW5MVIKIPTNKQ` | `<ADD_YOUR_DEPLOY_TX_HASH>` |

### Initialize Transaction
| Item                | Value |
|---------------------|-------|
| Contract Address    | `CDF7PK6UC76PNPX5WNWTOAQ3RG3ZZILWSTFOQANW3HYQW5MVIKIPTNKQ` |
| Initialize Tx Hash  | `<ADD_YOUR_INITIALIZE_TX_HASH>` |

### Block Explorer Screenshots
Add screenshots of the deployed contract from the block explorer under `docs/screenshots/contracts/`.

- HackathonRegistry Explorer Screenshot: ![HackathonRegistry Contract](docs/screenshots/contracts/hackathon-registry.png)

## UI Screenshots

### Home / Dashboard Screen:
![Home Screen](docs/screenshots/home-screen.png)

### Admin Panel:
![Admin Panel](docs/screenshots/admin-panel.png)

### Winner Verification:
![Verify Winner](docs/screenshots/verify-winner.png)

### Mobile View:
![Mobile View](docs/screenshots/mobile-view.png)

## Demo Link
https://hackwin.vercel.app

## CI/CD Status
- **Workflow:** HackWin CI/CD at `.github/workflows/ci.yml`
- **GitHub Actions:** https://github.com/rajkumarsharma316/HackWin/actions/workflows/ci.yml
- **Badge:** ![CI](https://github.com/rajkumarsharma316/HackWin/actions/workflows/ci.yml/badge.svg)

## Project Setup Guide

### Prerequisites
- Node.js 18+ and npm
- Rust toolchain
- Soroban CLI (`stellar-cli`)
- A Stellar testnet account (fund via [Friendbot](https://friendbot.stellar.org))
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

4. **Build smart contract (from repo root):**
   ```bash
   cd hackathon-registry
   rustup target add wasm32-unknown-unknown
   cargo build --target wasm32-unknown-unknown --release
   ```

5. **Deploy contract to Stellar testnet:**
   ```bash
   stellar keys generate --global deployer --network testnet

   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/hackathon_registry.wasm \
     --source deployer \
     --network testnet

   # Initialize with your admin wallet address
   stellar contract invoke \
     --id <CONTRACT_ID> \
     --source deployer \
     --network testnet \
     -- initialize --admin <YOUR_WALLET_ADDRESS>
   ```

6. **Configure environment:**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local and set NEXT_PUBLIC_CONTRACT_ID to your deployed contract
   ```

## Testing
Run the smart contract test suite to verify registry logic:

```bash
cd hackathon-registry
cargo test
```

Tests cover:
- ✅ Contract initialization
- ✅ Hackathon creation
- ✅ Winner registration with rank and prize
- ✅ Winner verification by wallet address
- ✅ Global stats validation (total_winners, total_hackathons, total_prize)

## Future Scope
- Add multi-admin support with role-based access control
- Introduce on-chain certificate NFT minting for winners
- Custom token rewards (SEP-41 compliant)
- Mainnet deployment for production use
- Winner profile pages with project links and descriptions
- Event-driven notifications via Stellar Horizon streaming
- IPFS integration for project documentation storage

## Architecture
HackWin follows a modular architecture separating the smart contract layer from the frontend.

### System Overview

```
┌────────────────────────────────────────────────────────┐
│                     USER (Browser)                     │
│                    Freighter Wallet                    │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│              Next.js Frontend (React 19)               │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐  │
│  │   Home   │ │  Admin   │ │ Verify │ │  Winners  │  │
│  └──────────┘ └──────────┘ └────────┘ └───────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │         contract.ts (Hybrid Data Layer)          │  │
│  │    Soroban Mode  ←→  localStorage Demo Mode      │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ Soroban RPC
                       ▼
┌────────────────────────────────────────────────────────┐
│           Stellar Soroban Smart Contract               │
│  ┌──────────────────────────────────────────────────┐ │
│  │  HackathonRegistry (Rust / soroban-sdk v25)      │ │
│  │  • initialize()      • create_hackathon()        │ │
│  │  • add_winner()       • get_winners()            │ │
│  │  • verify_winner()    • get_stats()              │ │
│  │  • get_hackathons()   • get_admin()              │ │
│  └──────────────────────────────────────────────────┘ │
│                  Stellar Testnet                       │
└────────────────────────────────────────────────────────┘
```

### Gameplay Sequence (Admin Flow)

```
Admin ──► Connect Freighter Wallet
     ──► Create Hackathon (name, date, organizer)
     ──► Add Winner (wallet, name, project, rank, prize)
     ──► Data stored permanently on Stellar blockchain

Public ──► Visit Homepage (stats, recent winners)
       ──► Verify Winner by wallet address
       ──► Browse all winners and hackathons
```

## Tech Stack
- **Soroban Smart Contracts** (Rust)
- **React 19** + **Next.js 16** (App Router)
- **Stellar SDK** v14
- **Freighter Wallet API** v6
- **CSS** (Glassmorphism Design System)
- **GitHub Actions** (CI/CD)
- **Vercel** (Deployment)

## License
MIT
