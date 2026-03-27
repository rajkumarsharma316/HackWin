"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getWinnerByWallet, seedDemoData, Winner } from "@/lib/contract";

export default function WinnerProfilePage() {
  const params = useParams();
  const wallet = decodeURIComponent(params.wallet as string);
  const [winner, setWinner] = useState<Winner | undefined>();

  useEffect(() => {
    seedDemoData();
    setWinner(getWinnerByWallet(wallet));
  }, [wallet]);

  const rankLabel = (rank: number) => {
    if (rank === 1) return "1st Place 🥇";
    if (rank === 2) return "2nd Place 🥈";
    if (rank === 3) return "3rd Place 🥉";
    return `#${rank} Place`;
  };

  if (!winner) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="empty-state" style={{ paddingTop: "80px" }}>
            <div className="empty-icon">🔍</div>
            <h3>Winner not found</h3>
            <p>No winner is registered with this wallet address.</p>
            <Link href="/verify" className="btn-secondary" style={{ marginTop: "16px", display: "inline-block" }}>
              🔍 Try Verifying
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Winner Certificate</h1>
          <p className="page-subtitle">On-chain proof of hackathon achievement</p>
        </div>

        {/* Certificate */}
        <div className="glass-card certificate animate-in">
          <div className="certificate-trophy">🏆</div>
          <div className="certificate-title">Certificate of Achievement</div>
          <div className="certificate-subtitle">
            This certifies that the following individual has been officially
            recognized as a hackathon winner, permanently recorded on the Stellar blockchain.
          </div>
          <div className="certificate-name">{winner.name}</div>
          <div className="certificate-project">{winner.project}</div>

          <div className="certificate-details">
            <div className="certificate-detail">
              <div className="certificate-detail-label">Hackathon</div>
              <div className="certificate-detail-value">
                {winner.hackathonName}
              </div>
            </div>
            <div className="certificate-detail">
              <div className="certificate-detail-label">Rank</div>
              <div className="certificate-detail-value">
                {rankLabel(winner.rank)}
              </div>
            </div>
            <div className="certificate-detail">
              <div className="certificate-detail-label">Prize</div>
              <div className="certificate-detail-value">
                {winner.prizeXlm.toLocaleString()} XLM
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-glass)" }}>
            <div className="certificate-detail-label" style={{ marginBottom: "4px" }}>
              Wallet Address
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
              {winner.wallet}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ textAlign: "center", marginTop: "32px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${winner.wallet}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            🔗 View on Stellar Expert
          </a>
          <Link href="/winners" className="btn-secondary">
            ← Back to Winners
          </Link>
        </div>
      </div>

      <footer className="footer page-container">
        <p>Verified on the Stellar Blockchain · Immutable &amp; Permanent</p>
      </footer>
    </>
  );
}
