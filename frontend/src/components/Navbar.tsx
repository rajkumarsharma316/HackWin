"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { connectWallet, getPublicKey, shortenAddress } from "@/lib/freighter";

export default function Navbar() {
  const pathname = usePathname();
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getPublicKey().then(setWallet);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    const addr = await connectWallet();
    if (addr) setWallet(addr);
    setLoading(false);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <span className="trophy">🏆</span>
        <span>HackWi</span>
      </Link>

      {/* Hamburger Button */}
      <button
        className={`hamburger-btn ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Desktop Nav Links */}
      <ul className="navbar-links">
        <li>
          <Link href="/" className={isActive("/") ? "active" : ""}>
            Home
          </Link>
        </li>
        <li>
          <Link
            href="/winners"
            className={isActive("/winners") ? "active" : ""}
          >
            Winners
          </Link>
        </li>
        <li>
          <Link
            href="/verify"
            className={isActive("/verify") ? "active" : ""}
          >
            Verify
          </Link>
        </li>
        <li>
          <Link
            href="/admin"
            className={isActive("/admin") ? "active" : ""}
          >
            Admin
          </Link>
        </li>
      </ul>

      {/* Desktop Wallet Button */}
      <div className="navbar-wallet-desktop">
        {wallet ? (
          <button className="wallet-btn connected">
            ✅ {shortenAddress(wallet)}
          </button>
        ) : (
          <button className="wallet-btn" onClick={handleConnect} disabled={loading}>
            {loading ? "Connecting..." : "🔗 Connect Wallet"}
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile Dropdown Menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <Link href="/" className={`mobile-menu-link ${isActive("/") ? "active" : ""}`}>
          🏠 Home
        </Link>
        <Link href="/winners" className={`mobile-menu-link ${isActive("/winners") ? "active" : ""}`}>
          🏆 Winners
        </Link>
        <Link href="/verify" className={`mobile-menu-link ${isActive("/verify") ? "active" : ""}`}>
          🔍 Verify
        </Link>
        <Link href="/admin" className={`mobile-menu-link ${isActive("/admin") ? "active" : ""}`}>
          🛡️ Admin
        </Link>
        <div className="mobile-menu-divider" />
        {wallet ? (
          <button className="wallet-btn connected mobile-wallet-btn">
            ✅ {shortenAddress(wallet)}
          </button>
        ) : (
          <button
            className="wallet-btn mobile-wallet-btn"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? "Connecting..." : "🔗 Connect Wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}
