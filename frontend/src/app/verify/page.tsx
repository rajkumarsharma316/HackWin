"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getWinnerByWallet, seedDemoData, Winner } from "@/lib/contract";

export default function VerifyPage() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<Winner | null | undefined>(undefined);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    seedDemoData();
  }, []);

  const handleVerify = () => {
    if (!address.trim()) return;
    const found = getWinnerByWallet(address.trim());
    setResult(found || null);
    setSearched(true);
  };

  const rankLabel = (rank: number) => {
    if (rank === 1) return "🥇 1st Place";
    if (rank === 2) return "🥈 2nd Place";
    if (rank === 3) return "🥉 3rd Place";
    return `#${rank}`;
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🔍 Verify a Winner</h1>
          <p className="page-subtitle">
            Paste any Stellar wallet address to check if they are a registered
            hackathon winner on-chain.
          </p>
        </div>

        {/* Search Bar */}
        <div className="verify-form">
          <input
            type="text"
            placeholder="Enter Stellar wallet address (e.g., GCXK...DEMO1)"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setSearched(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          <button className="btn-primary" onClick={handleVerify}>
            Verify
          </button>
        </div>

        {/* Results */}
        {searched && result && (
          <div className={`glass-card verify-result verify-success animate-in`}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>✅</div>
            <h3 style={{ color: "var(--success)", marginBottom: "16px", fontFamily: "var(--font-display)" }}>
              Verified Winner!
            </h3>
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Name
                </span>
                <div style={{ fontWeight: 600 }}>{result.name}</div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Project
                </span>
                <div style={{ color: "var(--accent-primary)" }}>{result.project}</div>
              </div>
              <div style={{ display: "flex", gap: "32px" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Hackathon
                  </span>
                  <div>{result.hackathonName}</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Rank
                  </span>
                  <div>{rankLabel(result.rank)}</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Prize
                  </span>
                  <div style={{ color: "var(--accent-gold)", fontWeight: 600 }}>
                    {result.prizeXlm.toLocaleString()} XLM
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "20px" }}>
              <Link
                href={`/winner/${encodeURIComponent(result.wallet)}`}
                className="btn-primary"
                style={{ fontSize: "0.9rem", padding: "10px 20px" }}
              >
                View Full Certificate →
              </Link>
            </div>
          </div>
        )}

        {searched && !result && (
          <div className="glass-card verify-result verify-fail animate-in">
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>❌</div>
            <h3 style={{ color: "var(--error)", marginBottom: "8px", fontFamily: "var(--font-display)" }}>
              Not a Registered Winner
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              This wallet address is not found in the hackathon winner registry.
            </p>
          </div>
        )}

        {/* Demo hint */}
        <div style={{ textAlign: "center", marginTop: "40px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          <p>💡 Try searching for demo addresses like <strong>GCXK...DEMO1</strong> or <strong>GHIJ...DEMO4</strong></p>
        </div>
      </div>
    </>
  );
}
