"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  getAllWinners,
  getHackathons,
  seedDemoData,
  Winner,
  Hackathon,
} from "@/lib/contract";

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filter, setFilter] = useState<number | "all">("all");

  useEffect(() => {
    seedDemoData();
    setWinners(getAllWinners());
    setHackathons(getHackathons());
  }, []);

  const filtered =
    filter === "all"
      ? winners
      : winners.filter((w) => w.hackathonId === filter);

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🏆 Winner Board</h1>
          <p className="page-subtitle">
            All hackathon winners recorded on the Stellar blockchain
          </p>
        </div>

        {/* Filter by Hackathon */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "32px" }}>
          <button
            className={filter === "all" ? "btn-primary" : "btn-secondary"}
            onClick={() => setFilter("all")}
            style={{ padding: "8px 18px", fontSize: "0.85rem" }}
          >
            All
          </button>
          {hackathons.map((h) => (
            <button
              key={h.id}
              className={filter === h.id ? "btn-primary" : "btn-secondary"}
              onClick={() => setFilter(h.id)}
              style={{ padding: "8px 18px", fontSize: "0.85rem" }}
            >
              {h.name}
            </button>
          ))}
        </div>

        {/* Hackathon Cards */}
        {filter === "all" && (
          <div className="hackathon-grid" style={{ marginBottom: "48px" }}>
            {hackathons.map((h) => (
              <Link key={h.id} href={`/hackathon/${h.id}`} style={{ textDecoration: "none" }}>
                <div className="glass-card hackathon-card">
                  <div className="hackathon-name">{h.name}</div>
                  <div className="hackathon-meta">
                    <div className="hackathon-meta-item">📅 {h.date}</div>
                    <div className="hackathon-meta-item">🏢 {h.organizer}</div>
                  </div>
                  <div className="hackathon-winner-count">
                    🏆 {h.winnerCount} winner{h.winnerCount !== 1 ? "s" : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Winners Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No winners found</h3>
            <p>No winners have been registered yet.</p>
          </div>
        ) : (
          <div className="winners-grid">
            {filtered
              .sort((a, b) => a.rank - b.rank)
              .map((w, i) => (
                <Link
                  key={i}
                  href={`/winner/${encodeURIComponent(w.wallet)}`}
                  style={{ textDecoration: "none" }}
                >
                  <div className="glass-card winner-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div
                      className={`rank-badge rank-${w.rank <= 3 ? w.rank : "other"}`}
                    >
                      {rankEmoji(w.rank)}
                    </div>
                    <div className="winner-name">{w.name}</div>
                    <div className="winner-project">{w.project}</div>
                    <div className="winner-details">
                      <span className="winner-prize">
                        {w.prizeXlm.toLocaleString()} XLM
                      </span>
                      <span className="winner-hackathon-tag">
                        {w.hackathonName}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>

      <footer className="footer page-container">
        <p>Powered by Stellar Soroban · Verified on-chain</p>
      </footer>
    </>
  );
}
