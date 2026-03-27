"use client";

// Freighter wallet integration helper
// Handles connect, disconnect, and address utilities with proper error handling.

export async function isFreighterInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const freighterApi = await import("@stellar/freighter-api");
    const { isConnected } = freighterApi;
    const result = await Promise.race([
      isConnected(),
      new Promise<{ isConnected: false }>((resolve) =>
        setTimeout(() => resolve({ isConnected: false }), 3000)
      ),
    ]);
    return result.isConnected;
  } catch {
    return false;
  }
}

export async function connectWallet(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const freighterApi = await import("@stellar/freighter-api");

    // First check if extension is actually reachable
    const { isConnected, requestAccess } = freighterApi;
    const connCheck = await Promise.race([
      isConnected(),
      new Promise<{ isConnected: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ isConnected: false, error: "timeout" }), 3000)
      ),
    ]);

    if (!connCheck.isConnected) {
      alert(
        "Freighter Wallet not detected!\n\n" +
        "Make sure:\n" +
        "1. Freighter extension is installed\n" +
        "2. You have created an account in Freighter\n" +
        "3. Try refreshing the page\n\n" +
        "Install from: https://www.freighter.app"
      );
      return null;
    }

    // Request access — Freighter popup will open
    const result = await Promise.race([
      requestAccess(),
      new Promise<{ address: ""; error: string }>((resolve) =>
        setTimeout(
          () => resolve({ address: "", error: "Connection timed out. Please try again." }),
          30000
        )
      ),
    ]);

    if (result.error) {
      console.error("Freighter access error:", result.error);
      alert("Wallet connection failed: " + result.error);
      return null;
    }
    if (!result.address) {
      alert("No address returned. Make sure you have an account set up in Freighter.");
      return null;
    }
    return result.address;
  } catch (err) {
    console.error("Failed to connect Freighter:", err);
    alert(
      "Failed to connect wallet.\n\n" +
      "Make sure Freighter is installed and you have an account created.\n" +
      "Check the browser console for details."
    );
    return null;
  }
}

export async function getPublicKey(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const freighterApi = await import("@stellar/freighter-api");
    const { getAddress } = freighterApi;
    const result = await Promise.race([
      getAddress(),
      new Promise<{ address: ""; error: "timeout" }>((resolve) =>
        setTimeout(() => resolve({ address: "", error: "timeout" }), 3000)
      ),
    ]);
    if (result.error || !result.address) return null;
    return result.address;
  } catch {
    return null;
  }
}

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
