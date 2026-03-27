<p align="center">
  <img src="https://img.shields.io/badge/Stellar-Soroban-blue?logo=stellar&logoColor=white" alt="Stellar" />
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/Rust-Soroban_SDK-orange?logo=rust" alt="Rust" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF?logo=githubactions&logoColor=white" alt="CI/CD" />
</p>

# 🏆 HackWin — On-Chain Hackathon Winner Registry

> A decentralized DApp on **Stellar Soroban** that permanently records hackathon winners on-chain — tamper-proof, verifiable, and forever.

---

## 📋 Table of Contents

- [Live Demo](#-live-demo)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Smart Contract](#-smart-contract)
- [Contract Addresses & Transactions](#-contract-addresses--transactions)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Future Roadmap](#-future-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Team](#-team)

---

## 🌐 Live Demo

<!-- TODO: Replace with your actual deployed URL -->
🔗 **Live App:** [https://hackwin.vercel.app](https://hackwin.vercel.app)

| Platform | Status |
|----------|--------|
| Vercel / Netlify | [![Deploy Status](https://img.shields.io/badge/status-live-brightgreen)](#) |
| Stellar Testnet | ✅ Connected |

---

## 📸 Screenshots

<!-- TODO: Add actual screenshots — place images in a /screenshots folder -->

### Desktop View
![Desktop Home Page](./screenshots/desktop-home.png)

### Mobile Responsive View
![Mobile Responsive View](./screenshots/mobile-responsive.png)

### Admin Dashboard
![Admin Panel](./screenshots/admin-panel.png)

### Winner Verification
![Verify Winner](./screenshots/verify-winner.png)

> **Tip:** To capture screenshots, run the app locally → open DevTools → toggle device toolbar (Ctrl+Shift+M) → screenshot at 375px width for mobile views.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏗️ **Create Hackathons** | Admin registers hackathon events on-chain (name, date, organizer) |
| 🏅 **Register Winners** | Record winners with wallet, project, rank & prize in XLM |
| 🔍 **Public Verification** | Anyone can verify a winner by pasting their Stellar wallet address |
| 📊 **Global Stats** | Real-time total winners, hackathons, and prize pool dashboard |
| 💼 **Wallet Integration** | Freighter wallet connect for admin operations |
| 🎨 **Glassmorphism UI** | Modern, responsive UI with animations and dark theme |
| 📱 **Mobile Responsive** | Fully responsive across desktop, tablet, and mobile |
| 🔄 **Hybrid Mode** | Works with Soroban contract OR localStorage demo mode |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI component library |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Stellar SDK](https://github.com/stellar/js-stellar-sdk) | Blockchain interaction |
| [Freighter API](https://www.freighter.app/) | Wallet integration |

### Smart Contract
| Technology | Purpose |
|------------|---------|
| [Rust](https://www.rust-lang.org/) | Contract language |
| [Soroban SDK](https://soroban.stellar.org/) | Stellar smart contract framework |
| [Stellar Testnet](https://laboratory.stellar.org/) | Deployment network |

### DevOps
| Technology | Purpose |
|------------|---------|
| [GitHub Actions](#-cicd-pipeline) | CI/CD pipeline |
| [Vercel](#-deployment) | Frontend hosting |

---

## 🏗️ Architecture

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
│  │    Soroban Mode ←→ localStorage Demo Mode       │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ Soroban RPC
                       ▼
┌────────────────────────────────────────────────────────┐
│           Stellar Soroban Smart Contract               │
│  ┌──────────────────────────────────────────────────┐ │
│  │  HackathonRegistry (Rust / soroban-sdk)          │ │
│  │  • initialize()      • create_hackathon()        │ │
│  │  • add_winner()       • get_winners()            │ │
│  │  • verify_winner()    • get_stats()              │ │
│  │  • get_hackathons()   • get_admin()              │ │
│  └──────────────────────────────────────────────────┘ │
│                  Stellar Testnet                       │
└────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contract

### Contract Functions

| Function | Access | Description |
|----------|--------|-------------|
| `initialize(admin)` | One-time | Sets admin wallet address |
| `create_hackathon(name, date, organizer)` | Admin | Creates a hackathon entry, returns ID |
| `add_winner(hackathon_id, wallet, name, project, prize_xlm, rank)` | Admin | Records a winner on-chain |
| `get_hackathons()` | Public | Lists all registered hackathons |
| `get_winners(hackathon_id)` | Public | Lists winners for a hackathon |
| `verify_winner(wallet)` | Public | Verifies if a wallet is a registered winner |
| `get_stats()` | Public | Returns (total_winners, total_hackathons, total_prize) |
| `get_admin()` | Public | Returns the admin address |

### Data Structures

```rust
struct Hackathon { id, name, date, organizer, winner_count }
struct Winner   { wallet, name, project, hackathon_id, hackathon_name, prize_xlm, rank, timestamp }
```

---

## 🔗 Contract Addresses & Transactions

<!-- TODO: Update these with your actual values -->

| Item | Value |
|------|-------|
| **Network** | Stellar Testnet |
| **Contract ID** | `CDF7PK6UC76PNPX5WNWTOAQ3RG3ZZILWSTFOQANW3HYQW5MVIKIPTNKQ` |
| **Deploy Tx Hash** | `<ADD_YOUR_DEPLOY_TX_HASH_HERE>` |
| **Initialize Tx Hash** | `<ADD_YOUR_INITIALIZE_TX_HASH_HERE>` |
| **Soroban RPC** | `https://soroban-testnet.stellar.org` |
| **Network Passphrase** | `Test SDF Network ; September 2015` |

> 🔎 View on Stellar Explorer: [stellar.expert/explorer/testnet/contract/CDF7PK6...](https://stellar.expert/explorer/testnet/contract/CDF7PK6UC76PNPX5WNWTOAQ3RG3ZZILWSTFOQANW3HYQW5MVIKIPTNKQ)

**Note:** This project uses **inter-contract calls** if extended with token/pool contracts. If you deploy a custom token or liquidity pool, add their addresses here:

| Token / Pool | Address |
|--------------|---------|
| Custom Token (if any) | `<ADD_TOKEN_ADDRESS>` |
| Pool Address (if any) | `<ADD_POOL_ADDRESS>` |

---

## ⚙️ CI/CD Pipeline

<!-- TODO: Replace with your actual GitHub Actions badge -->

[![CI/CD Pipeline](https://github.com/<YOUR_USERNAME>/hackwin/actions/workflows/ci.yml/badge.svg)](https://github.com/<YOUR_USERNAME>/hackwin/actions)

### Pipeline Stages

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  Lint &  │───▶│  Build   │───▶│   Test    │───▶│  Deploy  │
│  Format  │    │ Contract │    │  Contract │    │ Frontend │
└──────────┘    └──────────┘    └───────────┘    └──────────┘
```

To set up CI/CD, create `.github/workflows/ci.yml`:

```yaml
name: HackWin CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ── Smart Contract ─────────────────────────────
  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown
      - name: Build Contract
        run: |
          cd hackathon-registry
          cargo build --target wasm32-unknown-unknown --release
      - name: Run Tests
        run: |
          cd hackathon-registry
          cargo test

  # ── Frontend ───────────────────────────────────
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - name: Install Dependencies
        run: cd frontend && npm ci
      - name: Lint
        run: cd frontend && npm run lint
      - name: Build
        run: cd frontend && npm run build

  # ── Deploy (Vercel) ────────────────────────────
  deploy:
    needs: [contract, frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
```

### CI/CD Screenshot / Badge

<!-- TODO: Add a screenshot of your green CI/CD pipeline -->
![CI/CD Pipeline Running](./screenshots/cicd-pipeline.png)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Rust** + `wasm32-unknown-unknown` target
- **Stellar CLI** (`stellar-cli`)
- **Freighter Wallet** browser extension

### 1. Clone the Repository

```bash
git clone https://github.com/<YOUR_USERNAME>/hackwin.git
cd hackwin
```

### 2. Smart Contract Setup

```bash
cd hackathon-registry

# Add WASM target
rustup target add wasm32-unknown-unknown

# Build
cargo build --target wasm32-unknown-unknown --release

# Run tests
cargo test
```

### 3. Deploy Contract to Testnet

```bash
# Generate a keypair (if needed)
stellar keys generate --global deployer --network testnet

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/hackathon_registry.wasm \
  --source deployer \
  --network testnet

# Initialize (use the contract ID returned above)
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize --admin <YOUR_WALLET_ADDRESS>
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your contract ID

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create `frontend/.env.local` with:

```env
# Your deployed Soroban contract address (starts with C...)
NEXT_PUBLIC_CONTRACT_ID=CDF7PK6UC76PNPX5WNWTOAQ3RG3ZZILWSTFOQANW3HYQW5MVIKIPTNKQ

# Soroban RPC URL (testnet by default)
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Network passphrase
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

> When `NEXT_PUBLIC_CONTRACT_ID` is empty, the app automatically runs in **Demo Mode** using localStorage.

---

## 📁 Project Structure

```
hackwin/
├── hackathon-registry/          ← Soroban Smart Contract
│   ├── contracts/
│   │   └── hackathon-registry/
│   │       └── src/
│   │           └── lib.rs       ← Contract logic (Rust)
│   ├── Cargo.toml
│   └── Cargo.lock
│
├── frontend/                    ← Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         ← Home page (hero, stats, recent winners)
│   │   │   ├── admin/           ← Admin dashboard (create hackathon, add winner)
│   │   │   ├── verify/          ← Public winner verification
│   │   │   ├── winners/         ← All winners listing
│   │   │   ├── winner/          ← Individual winner detail
│   │   │   ├── hackathon/       ← Hackathon detail page
│   │   │   ├── layout.tsx       ← Root layout
│   │   │   └── globals.css      ← Glassmorphism design system
│   │   ├── components/
│   │   │   └── Navbar.tsx       ← Navigation bar
│   │   └── lib/
│   │       ├── contract.ts      ← Hybrid data layer (Soroban ↔ localStorage)
│   │       ├── soroban.ts       ← Soroban RPC helpers
│   │       └── freighter.ts     ← Freighter wallet integration
│   ├── .env.local
│   ├── package.json
│   └── next.config.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml               ← CI/CD pipeline
│
├── screenshots/                 ← App screenshots for README
└── README.md                    ← This file
```

---

## 📖 Usage Guide

### For Admins
1. Install [Freighter Wallet](https://freighter.app/) and switch to **Testnet**
2. Navigate to `/admin`
3. Connect your wallet (must match the initialized admin address)
4. **Create Hackathon** → Fill in name, date, and organizer
5. **Add Winner** → Select hackathon, enter winner details

### For Public Users
1. Visit the homepage to see stats & recent winners
2. Browse `/winners` to see all registered winners
3. Go to `/verify` → paste any Stellar wallet address to check if they are a registered winner

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd hackathon-registry
cargo test
```

The contract includes a comprehensive `test_full_flow` test covering:
- ✅ Contract initialization
- ✅ Hackathon creation
- ✅ Winner registration
- ✅ Winner verification
- ✅ Global stats validation

### Frontend Lint

```bash
cd frontend
npm run lint
```

### Frontend Build Check

```bash
cd frontend
npm run build
```

---

## 🌍 Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variables in Vercel dashboard
5. Deploy!

### Smart Contract → Stellar Testnet

See [Getting Started → Deploy Contract](#3-deploy-contract-to-testnet) section above.

---

## 🗺️ Future Roadmap

- [ ] Multi-admin support with role-based access
- [ ] On-chain certificate NFT minting for winners
- [ ] Custom token rewards (SEP-41 compliant)
- [ ] Mainnet deployment
- [ ] Winner profile pages with project links
- [ ] Event-driven notifications via Stellar Horizon streaming
- [ ] IPFS integration for project documentation storage

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

<!-- TODO: Add your team info -->

| Name | Role | GitHub |
|------|------|--------|
| Your Name | Full Stack Developer | [@yourusername](https://github.com/yourusername) |

---

<p align="center">
  Built with ❤️ on <a href="https://stellar.org">Stellar</a> using <a href="https://soroban.stellar.org">Soroban</a> smart contracts.
</p>
