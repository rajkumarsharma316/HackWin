"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  getHackathonById,
  getWinnersByHackathon,
  seedDemoData,
  Hackathon,
  Winner,
} from "@/lib/contract";

export default function HackathonPage() {
  const params = useParams();
  const id = Number(params.id);
  const [hackathon, setHackathon] = useState<Hackathon | undefined>();
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    seedDemoData();
    setHackathon(getHackathonById(id));
    setWinners(getWinnersByHackathon(id));
  }, [id]);

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  if (!hackathon) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Hackathon not found</h3>
            <p>This hackathon does not exist in the registry.</p>
            <Link href="/winners" className="btn-secondary" style={{ marginTop: "16px", display: "inline-block" }}>
              ← Back to Winners
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
          <h1 className="page-title">{hackathon.name}</h1>
          <p className="page-subtitle">
            📅 {hackathon.date} · 🏢 {hackathon.organizer}
          </p>
        </div>

        {winners.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>No winners yet</h3>
            <p>Winners for this hackathon haven&apos;t been registered yet.</p>
          </div>
        ) : (
          <div className="winners-grid">
            {winners
              .sort((a, b) => a.rank - b.rank)
              .map((w, i) => (
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
                      <span className="winner-prize">
                        {w.prizeXlm.toLocaleString()} XLM
                      </span>
                      <span className="winner-hackathon-tag">
                        Rank #{w.rank}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Link href="/winners" className="btn-secondary">
            ← Back to All Winners
          </Link>
        </div>
      </div>
    </>
  );
}
