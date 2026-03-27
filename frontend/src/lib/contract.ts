import {
  isContractDeployed,
  isTokenDeployed,
  callReadOnly,
  callWrite,
  toScString,
  toScU64,
  toScU32,
  toScI128,
  toScAddress,
  fromScVal,
  getTokenContract,
  getServer,
  NETWORK_PASSPHRASE,
} from "./soroban";
import * as StellarSdk from "@stellar/stellar-sdk";

// ── Types ───────────────────────────────────────────────────────────────

export interface Winner {
  wallet: string;
  name: string;
  project: string;
  hackathonId: number;
  hackathonName: string;
  prizeXlm: number;
  rank: number;
  timestamp: number;
}

export interface Hackathon {
  id: number;
  name: string;
  date: string;
  organizer: string;
  winnerCount: number;
}

export interface Stats {
  totalWinners: number;
  totalHackathons: number;
  totalPrizeXlm: number;
}

// ═════════════════════════════════════════════════════════════════════════
// SOROBAN MODE — calls the real deployed contract
// ═════════════════════════════════════════════════════════════════════════

interface RawHackathon {
  id: bigint | number;
  name: string;
  date: string;
  organizer: string;
  winner_count: bigint | number;
}

interface RawWinner {
  wallet: string;
  name: string;
  project: string;
  hackathon_id: bigint | number;
  hackathon_name: string;
  prize_xlm: bigint | number;
  rank: bigint | number;
  timestamp: bigint | number;
}

async function soroban_getHackathons(): Promise<Hackathon[]> {
  const result = await callReadOnly("get_hackathons");
  if (!result) return [];
  const rawData: RawHackathon[] = fromScVal<RawHackathon[]>(result) || [];
  return rawData.map(h => ({
    id: Number(h.id),
    name: h.name,
    date: h.date,
    organizer: h.organizer,
    winnerCount: Number(h.winner_count)
  }));
}

async function soroban_getWinners(hackathonId: number): Promise<Winner[]> {
  const result = await callReadOnly("get_winners", toScU64(hackathonId));
  if (!result) return [];
  const rawData: RawWinner[] = fromScVal<RawWinner[]>(result) || [];
  return rawData.map(w => ({
    wallet: w.wallet,
    name: w.name,
    project: w.project,
    hackathonId: Number(w.hackathon_id),
    hackathonName: w.hackathon_name,
    prizeXlm: Number(w.prize_xlm),
    rank: Number(w.rank),
    timestamp: Number(w.timestamp)
  }));
}

async function soroban_verifyWinner(wallet: string): Promise<Winner | undefined> {
  const result = await callReadOnly("verify_winner", toScAddress(wallet));
  if (!result) return undefined;
  const w: RawWinner | null = fromScVal<RawWinner | null>(result);
  if (!w) return undefined;
  return {
    wallet: w.wallet,
    name: w.name,
    project: w.project,
    hackathonId: Number(w.hackathon_id),
    hackathonName: w.hackathon_name,
    prizeXlm: Number(w.prize_xlm),
    rank: Number(w.rank),
    timestamp: Number(w.timestamp)
  };
}

async function soroban_getStats(): Promise<Stats> {
  const result = await callReadOnly("get_stats");
  if (!result) return { totalWinners: 0, totalHackathons: 0, totalPrizeXlm: 0 };
  const [totalWinners, totalHackathons, totalPrizeXlm] = fromScVal<[bigint | number, bigint | number, bigint | number]>(result);
  return {
    totalWinners: Number(totalWinners),
    totalHackathons: Number(totalHackathons),
    totalPrizeXlm: Number(totalPrizeXlm)
  };
}

async function soroban_getAdmin(): Promise<string | null> {
  try {
    const result = await callReadOnly("get_admin");
    if (!result) return null;
    return fromScVal<string>(result);
  } catch {
    return null;
  }
}

async function soroban_initialize(adminWallet: string): Promise<void> {
  const { TOKEN_CONTRACT_ID } = await import("./soroban");
  await callWrite(adminWallet, "initialize", toScAddress(adminWallet), toScAddress(TOKEN_CONTRACT_ID));
}

async function soroban_createHackathon(
  adminWallet: string, name: string, date: string, organizer: string
): Promise<number> {
  const result = await callWrite(
    adminWallet, "create_hackathon",
    toScString(name), toScString(date), toScString(organizer)
  );
  console.log("create_hackathon result:", JSON.stringify(result, null, 2));
  if (result.status === "SUCCESS" && result.returnValue) {
    return fromScVal<number>(result.returnValue);
  }
  throw new Error(`create_hackathon failed with status: ${result.status}`);
}

async function soroban_addWinner(
  adminWallet: string,
  hackathonId: number, wallet: string, name: string,
  project: string, prizeXlm: number, rank: number
): Promise<void> {
  await callWrite(
    adminWallet, "add_winner",
    toScU64(hackathonId), toScAddress(wallet),
    toScString(name), toScString(project),
    toScI128(prizeXlm), toScU32(rank)
  );
}

// ═════════════════════════════════════════════════════════════════════════
// LOCAL MODE — localStorage fallback for demo / development
// ═════════════════════════════════════════════════════════════════════════

const STORAGE_KEY_HACKATHONS = "hackwin_hackathons";
const STORAGE_KEY_WINNERS = "hackwin_winners";
const STORAGE_KEY_ADMIN = "hackwin_admin";

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  // Soroban returns BigInt values — convert them to Number for JSON
  localStorage.setItem(key, JSON.stringify(data, (_key, value) =>
    typeof value === "bigint" ? Number(value) : value
  ));
}

// ═════════════════════════════════════════════════════════════════════════
// PUBLIC API — automatically routes to Soroban or localStorage
// ═════════════════════════════════════════════════════════════════════════

// ── Admin ───────────────────────────────────────────────────────────────

export function getAdmin(): string | null {
  if (isContractDeployed()) {
    // For sync usage — admin is cached after first async fetch
    return loadFromStorage<string | null>("hackwin_cached_admin", null);
  }
  return loadFromStorage<string | null>(STORAGE_KEY_ADMIN, null);
}

export async function fetchAdmin(): Promise<string | null> {
  if (isContractDeployed()) {
    const admin = await soroban_getAdmin();
    if (admin) saveToStorage("hackwin_cached_admin", admin);
    return admin;
  }
  return loadFromStorage<string | null>(STORAGE_KEY_ADMIN, null);
}

export async function initializeAdmin(wallet: string): Promise<void> {
  if (isContractDeployed()) {
    await soroban_initialize(wallet);
    saveToStorage("hackwin_cached_admin", wallet);
  } else {
    saveToStorage(STORAGE_KEY_ADMIN, wallet);
  }
}

export function setAdmin(wallet: string): void {
  saveToStorage(STORAGE_KEY_ADMIN, wallet);
  saveToStorage("hackwin_cached_admin", wallet);
}

export function isAdmin(wallet: string | null): boolean {
  if (!wallet) return false;
  const admin = getAdmin();
  if (!admin) return false;
  return admin === wallet;
}

// ── Hackathons ──────────────────────────────────────────────────────────

export function getHackathons(): Hackathon[] {
  return loadFromStorage<Hackathon[]>(STORAGE_KEY_HACKATHONS, []);
}

export async function fetchHackathons(): Promise<Hackathon[]> {
  if (isContractDeployed()) {
    const hackathons = await soroban_getHackathons();
    saveToStorage(STORAGE_KEY_HACKATHONS, hackathons); // cache locally
    return hackathons;
  }
  return loadFromStorage<Hackathon[]>(STORAGE_KEY_HACKATHONS, []);
}

export function getHackathonById(id: number): Hackathon | undefined {
  return getHackathons().find(h => h.id === id);
}

export function createHackathon(name: string, date: string, organizer: string): Hackathon {
  const hackathons = getHackathons();
  const id = hackathons.length > 0 ? Math.max(...hackathons.map(h => h.id)) + 1 : 1;
  const hackathon: Hackathon = { id, name, date, organizer, winnerCount: 0 };
  hackathons.push(hackathon);
  saveToStorage(STORAGE_KEY_HACKATHONS, hackathons);
  return hackathon;
}

export async function createHackathonOnChain(
  adminWallet: string, name: string, date: string, organizer: string
): Promise<Hackathon> {
  if (isContractDeployed()) {
    const id = await soroban_createHackathon(adminWallet, name, date, organizer);
    const hackathon: Hackathon = { id, name, date, organizer, winnerCount: 0 };
    // Update local cache
    const hackathons = getHackathons();
    hackathons.push(hackathon);
    saveToStorage(STORAGE_KEY_HACKATHONS, hackathons);
    return hackathon;
  } else {
    return createHackathon(name, date, organizer);
  }
}

// ── Winners ─────────────────────────────────────────────────────────────

export function getAllWinners(): Winner[] {
  return loadFromStorage<Winner[]>(STORAGE_KEY_WINNERS, []);
}

export async function fetchAllWinners(): Promise<Winner[]> {
  if (isContractDeployed()) {
    const hackathons = getHackathons();
    const allWinners: Winner[] = [];
    for (const h of hackathons) {
      const winners = await soroban_getWinners(h.id);
      allWinners.push(...winners);
    }
    saveToStorage(STORAGE_KEY_WINNERS, allWinners);
    return allWinners;
  }
  return loadFromStorage<Winner[]>(STORAGE_KEY_WINNERS, []);
}

export function getWinnersByHackathon(hackathonId: number): Winner[] {
  return getAllWinners().filter(w => w.hackathonId === hackathonId);
}

export function getWinnerByWallet(wallet: string): Winner | undefined {
  return getAllWinners().find(w => w.wallet.toLowerCase() === wallet.toLowerCase());
}

export async function verifyWinnerOnChain(wallet: string): Promise<Winner | undefined> {
  if (isContractDeployed()) {
    return soroban_verifyWinner(wallet);
  }
  return getWinnerByWallet(wallet);
}

export function addWinner(
  hackathonId: number,
  wallet: string,
  name: string,
  project: string,
  prizeXlm: number,
  rank: number
): Winner {
  const hackathon = getHackathonById(hackathonId);
  if (!hackathon) throw new Error("Hackathon not found");

  const winner: Winner = {
    wallet, name, project, hackathonId,
    hackathonName: hackathon.name,
    prizeXlm, rank,
    timestamp: Date.now(),
  };

  const winners = getAllWinners();
  winners.push(winner);
  saveToStorage(STORAGE_KEY_WINNERS, winners);

  // Update hackathon winner count
  const hackathons = getHackathons();
  const idx = hackathons.findIndex(h => h.id === hackathonId);
  if (idx >= 0) {
    hackathons[idx].winnerCount += 1;
    saveToStorage(STORAGE_KEY_HACKATHONS, hackathons);
  }

  return winner;
}

export async function addWinnerOnChain(
  adminWallet: string,
  hackathonId: number,
  wallet: string,
  name: string,
  project: string,
  prizeXlm: number,
  rank: number
): Promise<Winner> {
  if (isContractDeployed()) {
    await soroban_addWinner(adminWallet, hackathonId, wallet, name, project, prizeXlm, rank);
  }
  // Always update local cache too
  return addWinner(hackathonId, wallet, name, project, prizeXlm, rank);
}

// ── Stats ───────────────────────────────────────────────────────────────

export function getStats(): Stats {
  const winners = getAllWinners();
  const hackathons = getHackathons();
  return {
    totalWinners: winners.length,
    totalHackathons: hackathons.length,
    totalPrizeXlm: winners.reduce((sum, w) => sum + w.prizeXlm, 0),
  };
}

export async function fetchStats(): Promise<Stats> {
  if (isContractDeployed()) {
    return soroban_getStats();
  }
  return getStats();
}

// ── Demo Data ───────────────────────────────────────────────────────────

export function seedDemoData(): void {
  // Never seed fake data when a real contract is deployed
  if (isContractDeployed()) return;
  if (getHackathons().length > 0) return; // Already seeded

  const h1 = createHackathon("HackStellar 2025", "2025-06-15", "Stellar Foundation");
  const h2 = createHackathon("SorobanCon Hackathon", "2025-09-20", "Soroban Community");
  const h3 = createHackathon("DeFi Build Week", "2025-12-01", "Stellar DevRel");

  addWinner(h1.id, "GCXK...DEMO1", "Alice Chen", "StellarPay — Instant Micropayments", 5000, 1);
  addWinner(h1.id, "GBMT...DEMO2", "Bob Kumar", "AstroLend — Decentralized Lending", 3000, 2);
  addWinner(h1.id, "GDEF...DEMO3", "Carol Reyes", "StarID — On-chain Identity", 1500, 3);

  addWinner(h2.id, "GHIJ...DEMO4", "Dave Park", "Nebula Swap — Cross-asset DEX", 4000, 1);
  addWinner(h2.id, "GKLM...DEMO5", "Eve Johnson", "CosmicDAO — Governance Tools", 2500, 2);

  addWinner(h3.id, "GNOP...DEMO6", "Frank Li", "OrbitVault — Yield Optimizer", 6000, 1);
  addWinner(h3.id, "GQRS...DEMO7", "Grace Ndlovu", "StellarSafe — Multi-sig Wallet", 3500, 2);
  addWinner(h3.id, "GTUV...DEMO8", "Hiro Tanaka", "LumeTrack — Supply Chain", 2000, 3);
}

// ── HWT Token Functions ─────────────────────────────────────────────────

export async function getTokenBalance(wallet: string): Promise<number> {
  if (isTokenDeployed()) {
    try {
      const tokenContract = getTokenContract();
      const server = getServer();
      const sourceKeypair = StellarSdk.Keypair.random();
      const sourceAccount = new StellarSdk.Account(sourceKeypair.publicKey(), "0");

      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(tokenContract.call("balance", toScAddress(wallet)))
        .setTimeout(30)
        .build();

      const simResult = await server.simulateTransaction(tx);
      if (StellarSdk.rpc.Api.isSimulationSuccess(simResult) && simResult.result) {
        return Number(fromScVal<bigint>(simResult.result.retval));
      }
    } catch (err) {
      console.error("Failed to fetch token balance:", err);
    }
  }
  // Demo mode: calculate from prize amounts
  const winners = getAllWinners().filter(
    (w) => w.wallet.toLowerCase() === wallet.toLowerCase()
  );
  return winners.reduce((sum, w) => sum + w.prizeXlm, 0);
}

export async function getTokenTotalSupply(): Promise<number> {
  if (isTokenDeployed()) {
    try {
      const tokenContract = getTokenContract();
      const server = getServer();
      const sourceKeypair = StellarSdk.Keypair.random();
      const sourceAccount = new StellarSdk.Account(sourceKeypair.publicKey(), "0");

      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(tokenContract.call("total_supply"))
        .setTimeout(30)
        .build();

      const simResult = await server.simulateTransaction(tx);
      if (StellarSdk.rpc.Api.isSimulationSuccess(simResult) && simResult.result) {
        return Number(fromScVal<bigint>(simResult.result.retval));
      }
    } catch (err) {
      console.error("Failed to fetch token supply:", err);
    }
  }
  // Demo mode: sum of all prizes
  return getAllWinners().reduce((sum, w) => sum + w.prizeXlm, 0);
}

