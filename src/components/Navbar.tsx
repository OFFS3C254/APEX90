"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Flame,
  History,
  Crown,
  Lock,
  Download,
  ShieldCheck,
  Menu,
  X,
  Radio,
} from "lucide-react";
import PushNotificationBell from "./PushNotificationBell";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    // Check VIP status from cookie or localStorage
    const checkVip = () => {
      const hasCookie = document.cookie.includes("apex_vip_token");
      const localVip = localStorage.getItem("apex_vip_active") === "true";
      setIsVip(hasCookie || localVip);
    };
    checkVip();
    window.addEventListener("focus", checkVip);
    return () => window.removeEventListener("focus", checkVip);
  }, []);

  const navItems = [
    { label: "Today's Picks", href: "/", icon: Flame },
    { label: "History & Stats", href: "/history", icon: History },
    { label: "VIP Club", href: "/vip", icon: Crown, highlight: true },
    { label: "Admin", href: "/admin", icon: Lock },
  ];

  return (
    <>
      {/* Top Ticker / Status Bar */}
      <div className="bg-[#0e1017] border-b border-[#1b1f2b] px-3 sm:px-6 py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] text-emerald-400 tracking-wide font-medium">
              LIVE RESULTS ENGINE ACTIVE
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-400 text-[11px]">
              Top European Leagues: PL • UCL • LaLiga • Serie A • Bundesliga
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isVip ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold">
                <Crown className="w-3 h-3 text-amber-400" />
                VIP UNLOCKED
              </span>
            ) : (
              <Link
                href="/vip"
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                Join VIP (M-Pesa STK)
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-[#090a0f]/90 backdrop-blur-md border-b border-[#1e2230]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#141224] border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(124,58,237,0.3)] group-hover:border-purple-400 transition-all">
                <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-display font-extrabold text-2xl tracking-tighter text-white">
                    APEX
                  </span>
                  <span className="font-display font-black text-xl px-1.5 py-0.2 bg-purple-600 text-white rounded skew-x-[-8deg] tracking-tight">
                    90
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 -mt-1 font-semibold">
                  Odds Intelligence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-purple-900/30 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                        : item.highlight
                        ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.highlight ? "text-amber-400" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right CTAs */}
            <div className="flex items-center gap-2">
              <PushNotificationBell />

              <Link
                href="/vip"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wide shadow-md shadow-purple-950 transition-all border border-purple-400/30"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                UNLOCK VIP
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0c0e15] border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                    isActive
                      ? "bg-purple-900/40 text-purple-300 border border-purple-500/30"
                      : "text-slate-300 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar for Native PWA Feel */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090A0F]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                isActive
                  ? "text-purple-400 font-bold"
                  : item.highlight
                  ? "text-amber-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
