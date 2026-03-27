// Soroban RPC client — connects the frontend to the deployed Soroban smart contract
// This module handles building, simulating, signing, and submitting transactions.

import * as StellarSdk from "@stellar/stellar-sdk";

// ── Configuration ─────────────────────────────────────────────────────────
// Set these env variables when deploying your contract to testnet/mainnet.
// While unset, the app falls back to localStorage demo mode.

export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID || "";
export const TOKEN_CONTRACT_ID =
  process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID || "";

// Returns true if a token contract ID is configured
export function isTokenDeployed(): boolean {
  return TOKEN_CONTRACT_ID.length > 0;
}

export function getTokenContract(): StellarSdk.Contract {
  if (!TOKEN_CONTRACT_ID) throw new Error("TOKEN_CONTRACT_ID is not set");
  return new StellarSdk.Contract(TOKEN_CONTRACT_ID);
}

// Returns true if a contract ID is configured (i.e., contract is deployed)
export function isContractDeployed(): boolean {
  return CONTRACT_ID.length > 0;
}

// ── RPC Server ────────────────────────────────────────────────────────────

let _server: StellarSdk.rpc.Server | null = null;

export function getServer(): StellarSdk.rpc.Server {
  if (!_server) {
    _server = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);
  }
  return _server;
}

// ── Contract Instance ─────────────────────────────────────────────────────

export function getContract(): StellarSdk.Contract {
  if (!CONTRACT_ID) throw new Error("CONTRACT_ID is not set");
  return new StellarSdk.Contract(CONTRACT_ID);
}

// ── Read-Only Call (simulate, no signing needed) ──────────────────────────

export async function callReadOnly(
  method: string,
  ...args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.xdr.ScVal | undefined> {
  const server = getServer();
  const contract = getContract();

  // Use a random source account for simulation
  const sourceKeypair = StellarSdk.Keypair.random();
  const sourceAccount = await server.getAccount(sourceKeypair.publicKey()).catch(() => {
    // For read-only simulation, create a dummy account
    return new StellarSdk.Account(sourceKeypair.publicKey(), "0");
  });

  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
    console.error("Simulation error:", simResult);
    throw new Error(`Contract read failed: ${JSON.stringify(simResult)}`);
  }

  if (StellarSdk.rpc.Api.isSimulationSuccess(simResult) && simResult.result) {
    return simResult.result.retval;
  }

  return undefined;
}

// ── Write Call (sign with Freighter, submit to network) ───────────────────

export async function callWrite(
  sourcePublicKey: string,
  method: string,
  ...args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.rpc.Api.GetTransactionResponse> {
  const server = getServer();
  const contract = getContract();

  const sourceAccount = await server.getAccount(sourcePublicKey);

  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: "10000000", // 1 XLM max fee for safety
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  // Simulate first
  const simResult = await server.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${JSON.stringify(simResult)}`);
  }

  // Prepare the transaction (adds Soroban data, auth, etc.)
  const preparedTx = StellarSdk.rpc.assembleTransaction(tx, simResult).build();

  // Sign with Freighter
  const freighterApi = await import("@stellar/freighter-api");
  const { signTransaction } = freighterApi;
  const signResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (signResult.error) {
    throw new Error(`Freighter signing failed: ${signResult.error}`);
  }

  // Parse the signed transaction and submit
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signResult.signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction submit failed: ${JSON.stringify(sendResult)}`);
  }

  // Poll for result
  let getResult = await server.getTransaction(sendResult.hash);
  while (getResult.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await server.getTransaction(sendResult.hash);
  }

  return getResult;
}

// ── ScVal Helpers (convert between JS types and Soroban types) ────────────

export function toScString(value: string): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "string" });
}

export function toScU64(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "u64" });
}

export function toScU32(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "u32" });
}

export function toScI128(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "i128" });
}

export function toScAddress(address: string): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(StellarSdk.Address.fromString(address), { type: "address" });
}

export function fromScVal<T>(scVal: StellarSdk.xdr.ScVal): T {
  return StellarSdk.scValToNative(scVal) as T;
}
