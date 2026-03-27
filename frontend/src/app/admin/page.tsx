"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  getAdmin,
  setAdmin,
  isAdmin,
  getHackathons,
  getAllWinners,
  fetchAdmin,
  fetchHackathons,
  fetchAllWinners,
  seedDemoData,
  createHackathonOnChain,
  addWinnerOnChain,
  initializeAdmin,
  Hackathon,
  Winner,
} from "@/lib/contract";
import { isContractDeployed } from "@/lib/soroban";
import { connectWallet, getPublicKey, shortenAddress } from "@/lib/freighter";

export default function AdminPage() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [admin, setAdminState] = useState<string | null>(null);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);
  const onChain = isContractDeployed();

  // Hackathon form
  const [hackName, setHackName] = useState("");
  const [hackDate, setHackDate] = useState("");
  const [hackOrganizer, setHackOrganizer] = useState("");
  const [hackStatus, setHackStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Winner form
  const [winHackathonId, setWinHackathonId] = useState<number>(0);
  const [winWallet, setWinWallet] = useState("");
  const [winName, setWinName] = useState("");
  const [winProject, setWinProject] = useState("");
  const [winPrize, setWinPrize] = useState("");
  const [winRank, setWinRank] = useState("");
  const [winStatus, setWinStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const refresh = useCallback(async () => {
    // Optimistic UI updates from sync cache
    setHackathons(getHackathons());
    setWinners(getAllWinners());
    setAdminState(getAdmin());

    // Fetch live on-chain data to ensure we don't act on stale local storage
    if (onChain) {
      try {
        const liveAdmin = await fetchAdmin();
        setAdminState(liveAdmin);
        const liveHacks = await fetchHackathons();
        setHackathons(liveHacks);
        const liveWinners = await fetchAllWinners();
        setWinners(liveWinners);
      } catch (err) {
        console.error("Failed to fetch on-chain data during refresh:", err);
      }
    }
  }, [onChain]);

  useEffect(() => {
    // Only seed demo data when NOT connected to a real contract
    if (!onChain) {
      seedDemoData();
    }
    getPublicKey().then(setWallet);
    refresh();
  }, [refresh, onChain]);

  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) setWallet(addr);
  };

  const handleBecomeAdmin = async () => {
    if (!wallet) return;
    if (getAdmin()) return;
    setLoading(true);
    try {
      if (onChain) {
        const liveAdmin = await fetchAdmin();
        if (liveAdmin) {
          // Already initialized by someone else (or us previously)
          setAdminState(liveAdmin);
          return;
        }
        await initializeAdmin(wallet);
      } else {
        setAdmin(wallet);
      }
      setAdminState(wallet);
    } catch (err) {
      console.error("Initialize failed:", err);
      alert("Failed to initialize admin on-chain. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHackathon = async () => {
    if (!hackName.trim() || !hackDate.trim() || !hackOrganizer.trim()) {
      setHackStatus({ type: "error", msg: "Please fill all fields" });
      return;
    }
    setLoading(true);
    try {
      setHackStatus({ type: "success", msg: onChain ? "⏳ Sending transaction to Stellar..." : "Creating..." });
      await createHackathonOnChain(
        wallet!, hackName.trim(), hackDate.trim(), hackOrganizer.trim()
      );
      setHackStatus({ type: "success", msg: "Hackathon created successfully! ✅" });
      setHackName("");
      setHackDate("");
      setHackOrganizer("");
      refresh();
    } catch (err) {
      console.error("Create hackathon error:", err);
      setHackStatus({ type: "error", msg: `Failed: ${String(err)}` });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWinner = async () => {
    if (!winHackathonId || !winWallet.trim() || !winName.trim() || !winProject.trim() || !winPrize || !winRank) {
      setWinStatus({ type: "error", msg: "Please fill all fields" });
      return;
    }
    // Validate Stellar address format
    const trimmedWallet = winWallet.trim();
    if (!trimmedWallet.startsWith("G") || trimmedWallet.length !== 56) {
      setWinStatus({ type: "error", msg: "Invalid wallet address. Must start with G and be 56 characters long." });
      return;
    }
    setLoading(true);
    try {
      setWinStatus({ type: "success", msg: onChain ? "⏳ Sending transaction to Stellar..." : "Registering..." });
      await addWinnerOnChain(
        wallet!,
        winHackathonId,
        winWallet.trim(),
        winName.trim(),
        winProject.trim(),
        Number(winPrize),
        Number(winRank)
      );
      setWinStatus({ type: "success", msg: "Winner registered on-chain! 🏆" });
      setWinWallet("");
      setWinName("");
      setWinProject("");
      setWinPrize("");
      setWinRank("");
      refresh();
    } catch (err) {
      console.error("Add winner error:", err);
      setWinStatus({ type: "error", msg: `Failed: ${String(err)}` });
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status: { type: "success" | "error"; msg: string } | null) => {
    if (!status) return null;
    return (
      <div className={status.type === "success" ? "status-success" : "status-error"}>
        {status.msg}
      </div>
    );
  };

  // ── Not connected ──
  if (!wallet) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="admin-gate">
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🔒</div>
            <h2>Admin Panel</h2>
            <p>Connect your Freighter wallet to access the admin panel.</p>
            <button className="btn-primary" onClick={handleConnect} style={{ marginTop: "16px" }}>
              🔗 Connect Wallet
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── No admin set yet ──
  if (!admin) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="admin-gate">
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>⚡</div>
            <h2>Initialize Admin</h2>
            <p>
              No admin has been set yet. Connect your wallet and claim admin
              rights to manage the registry.
            </p>
            {onChain && (
              <p style={{ color: "var(--accent-gold)", fontSize: "0.85rem", marginTop: "8px" }}>
                ⛓️ This will send a transaction to the Stellar blockchain.
              </p>
            )}
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "8px" }}>
              Connected as: {shortenAddress(wallet)}
            </p>
            <button
              className="btn-primary"
              onClick={handleBecomeAdmin}
              disabled={loading}
              style={{ marginTop: "16px" }}
            >
              {loading ? "⏳ Initializing..." : "🛡️ Claim Admin"}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Not admin ──
  if (!isAdmin(wallet)) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="admin-gate">
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🚫</div>
            <h2>Access Denied</h2>
            <p>Only the admin wallet can manage the registry.</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "8px" }}>
              Your wallet: {shortenAddress(wallet)}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Admin wallet: {shortenAddress(admin)}
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Admin Panel ──
  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🛡️ Admin Panel</h1>
          <p className="page-subtitle">
            Manage hackathons and register winners {onChain ? "on-chain" : "(demo mode)"}
          </p>
          <div style={{ marginTop: "8px", color: "var(--success)", fontSize: "0.85rem" }}>
            ✅ Admin: {shortenAddress(wallet)}
          </div>
          {onChain ? (
            <div style={{ marginTop: "4px", color: "var(--accent-gold)", fontSize: "0.8rem" }}>
              ⛓️ Live on Stellar Testnet — transactions are real!
            </div>
          ) : (
            <div style={{ marginTop: "4px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
              🖥️ Demo mode — data saved in browser only
            </div>
          )}
        </div>

        {/* Info banner for on-chain mode */}
        {onChain && hackathons.length === 0 && (
          <div className="glass-card" style={{ marginBottom: "32px", border: "1px solid var(--accent-gold)", padding: "20px" }}>
            <p style={{ color: "var(--accent-gold)", fontWeight: 600, marginBottom: "8px" }}>
              ⚠️ No hackathons on-chain yet!
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Your contract is deployed but empty. Start by creating a hackathon below.
              Each &quot;Create Hackathon&quot; will send a transaction to the Stellar blockchain via Freighter.
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="stats-bar" style={{ marginBottom: "48px" }}>
          <div className="glass-card stat-card">
            <div className="stat-value">{hackathons.length}</div>
            <div className="stat-label">Hackathons</div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-value">{winners.length}</div>
            <div className="stat-label">Winners</div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-value">
              {winners.reduce((s, w) => s + w.prizeXlm, 0).toLocaleString()}
            </div>
            <div className="stat-label">Total XLM</div>
          </div>
        </div>

        {/* Create Hackathon */}
        <div className="glass-card form-section">
          <h3>📋 Create Hackathon</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Hackathon Name</label>
              <input
                type="text"
                placeholder="e.g., HackStellar 2025"
                value={hackName}
                onChange={(e) => setHackName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={hackDate}
                onChange={(e) => setHackDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Organizer</label>
              <input
                type="text"
                placeholder="e.g., Stellar Foundation"
                value={hackOrganizer}
                onChange={(e) => setHackOrganizer(e.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleCreateHackathon} disabled={loading}>
              {loading ? "⏳ Submitting..." : "➕ Create Hackathon"}
            </button>
          </div>
          {renderStatus(hackStatus)}
        </div>

        {/* Add Winner */}
        <div className="glass-card form-section" style={{ marginTop: "32px" }}>
          <h3>🏆 Register Winner</h3>
          {onChain && hackathons.length === 0 && (
            <p style={{ color: "var(--accent-gold)", fontSize: "0.9rem", marginBottom: "16px" }}>
              ⚠️ Create a hackathon first before registering winners.
            </p>
          )}
          <div className="form-grid">
            <div className="form-group">
              <label>Hackathon</label>
              <select
                value={winHackathonId}
                onChange={(e) => setWinHackathonId(Number(e.target.value))}
              >
                <option value={0}>Select a hackathon</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Winner Wallet</label>
              <input
                type="text"
                placeholder="Stellar address (G...)"
                value={winWallet}
                onChange={(e) => setWinWallet(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Winner Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={winName}
                onChange={(e) => setWinName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                placeholder="Project title"
                value={winProject}
                onChange={(e) => setWinProject(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Prize (XLM)</label>
              <input
                type="number"
                placeholder="e.g., 5000"
                value={winPrize}
                onChange={(e) => setWinPrize(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Rank</label>
              <input
                type="number"
                placeholder="1, 2, 3..."
                value={winRank}
                onChange={(e) => setWinRank(e.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleAddWinner} disabled={loading || (onChain && hackathons.length === 0)}>
              {loading ? "⏳ Submitting..." : "🏆 Register Winner"}
            </button>
          </div>
          {renderStatus(winStatus)}
        </div>

        {/* Recent Winners Table */}
        {winners.length > 0 && (
          <div className="glass-card" style={{ marginTop: "32px", overflowX: "auto" }}>
            <h3 style={{ fontFamily: "var(--font-display)", marginBottom: "16px" }}>
              📊 Registered Winners ({winners.length})
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Rank</th>
                  <th style={{ padding: "10px 12px" }}>Name</th>
                  <th style={{ padding: "10px 12px" }}>Project</th>
                  <th style={{ padding: "10px 12px" }}>Hackathon</th>
                  <th style={{ padding: "10px 12px" }}>Prize</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((w, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                    <td style={{ padding: "10px 12px" }}>
                      {w.rank === 1 ? "🥇" : w.rank === 2 ? "🥈" : w.rank === 3 ? "🥉" : `#${w.rank}`}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{w.name}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{w.project}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className="winner-hackathon-tag">{w.hackathonName}</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--accent-gold)", fontWeight: 600 }}>
                      {w.prizeXlm.toLocaleString()} XLM
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="footer page-container">
        <p>Admin Panel · Hackathon Winner Registry on Stellar</p>
      </footer>
    </>
  );
}
