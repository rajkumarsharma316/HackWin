"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  getStats,
  getAllWinners,
  seedDemoData,
  Stats,
  Winner,
} from "@/lib/contract";

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    totalWinners: 0,
    totalHackathons: 0,
    totalPrizeXlm: 0,
  });
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);

  useEffect(() => {
    seedDemoData();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(getStats());
    const all = getAllWinners();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentWinners(all.slice(-4).reverse());
  }, []);

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="hero page-container">
        <div className="hero-badge">⚡ Powered by Stellar Soroban</div>
        <h1 className="hero-title">
          The On-Chain
          <br />
          <span className="gradient-text">Hackathon Winner Registry</span>
        </h1>
        <p className="hero-description">
          Permanently record hackathon winners on the Stellar blockchain.
          Tamper-proof, verifiable, and forever. Celebrate&nbsp;achievements
          that live on-chain.
        </p>
        <div className="hero-actions">
          <Link href="/winners" className="btn-primary">
            🏆 View Winners
          </Link>
          <Link href="/verify" className="btn-secondary">
            🔍 Verify a Winner
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="page-container">
        <div className="stats-bar">
          <div className="glass-card stat-card animate-in animate-delay-1">
            <div className="stat-value">{stats.totalWinners}</div>
            <div className="stat-label">Winners Registered</div>
          </div>
          <div className="glass-card stat-card animate-in animate-delay-2">
            <div className="stat-value">{stats.totalHackathons}</div>
            <div className="stat-label">Hackathons</div>
          </div>
          <div className="glass-card stat-card animate-in animate-delay-3">
            <div className="stat-value">
              {stats.totalPrizeXlm.toLocaleString()}
            </div>
            <div className="stat-label">XLM Awarded</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works page-container">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="glass-card step-card animate-in animate-delay-1">
            <div className="step-number">1</div>
            <h3>Admin Registers Hackathon</h3>
            <p>
              Authorized admin creates a new hackathon entry with name, date,
              and organizer details on-chain.
            </p>
          </div>
          <div className="glass-card step-card animate-in animate-delay-2">
            <div className="step-number">2</div>
            <h3>Winners Are Recorded</h3>
            <p>
              Admin adds winners with their wallet address, project name,
              rank, and prize — permanently stored on Stellar.
            </p>
          </div>
          <div className="glass-card step-card animate-in animate-delay-3">
            <div className="step-number">3</div>
            <h3>Verify Anytime</h3>
            <p>
              Anyone can verify a winner by pasting their Stellar wallet
              address. On-chain proof, always accessible.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Winners */}
      {recentWinners.length > 0 && (
        <section className="page-container" style={{ paddingBottom: "40px" }}>
          <div className="page-header">
            <h2 className="page-title">Recent Winners</h2>
            <p className="page-subtitle">
              The latest hackathon champions recorded on-chain
            </p>
          </div>
          <div className="winners-grid">
            {recentWinners.map((w, i) => (
              <Link
                key={i}
                href={`/winner/${encodeURIComponent(w.wallet)}`}
                style={{ textDecoration: "none" }}
              >
                <div className="glass-card winner-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div
                    className={`rank-badge rank-${w.rank <= 3 ? w.rank : "other"}`}
                  >
                    {rankEmoji(w.rank)}
                  </div>
                  <div className="winner-name">{w.name}</div>
                  <div className="winner-project">{w.project}</div>
                  <div className="winner-details">
                    <span className="winner-prize">{w.prizeXlm.toLocaleString()} XLM</span>
                    <span className="winner-hackathon-tag">
                      {w.hackathonName}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href="/winners" className="btn-secondary">
              View All Winners →
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer page-container">
        <p>
          Built on{" "}
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stellar
          </a>{" "}
          with ❤️ using{" "}
          <a
            href="https://soroban.stellar.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Soroban
          </a>{" "}
          smart contracts.
        </p>
      </footer>
    </>
  );
}
