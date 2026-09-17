"use client";

import { useState, useEffect } from "react";
import {
  Crown,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import VIPModal from "@/components/VIPModal";

export default function VIPPage() {
  const [isVip, setIsVip] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const hasCookie = document.cookie.includes("apex_vip_token");
    const localVip = localStorage.getItem("apex_vip_active") === "true";
    setIsVip(hasCookie || localVip);
  }, []);

  const tiers = [
    {
      id: "daily",
      name: "Daily VIP Pass",
      kes: 350,
      usd: 3.5,
      period: "per day",
      features: [
        "Full unblur for all VIP matches today",
        "Banker of the Day pro tactical memo",
        "High-yield accumulator tips (10.0+ odds)",
        "Instant SMS / Push match alert",
      ],
    },
    {
      id: "weekly",
      name: "7-Day Pro Access",
      kes: 1500,
      usd: 14.0,
      period: "per week",
      badge: "MOST POPULAR",
      features: [
        "7 full days unrestricted VIP access",
        "Daily Banker of the Day (90%+ win rate)",
        "Weekend Mega Accumulator special",
        "VIP Community & Early Line Alerts",
        "Bankroll management & staking plan",
      ],
    },
    {
      id: "monthly",
      name: "Monthly Elite Club",
      kes: 4500,
      usd: 40.0,
      period: "per month",
      badge: "BEST VALUE",
      features: [
        "30 days full premium privileges",
        "All daily markets & high-yield bankers",
        "Priority VIP auto-grading alerts",
        "Direct 1-on-1 advisor consultation",
        "Save over 55% compared to daily pass",
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-[#19142b] to-[#0f1018] border border-purple-500/40 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl shadow-purple-950/40">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-purple-900/60">
          <Crown className="w-8 h-8 text-amber-300" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          Elite Sportsbook Subscription
        </div>

        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white uppercase tracking-tight mb-3">
          APEX90 VIP Lounge
        </h1>
        <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Gain direct access to quantitative algorithm picks, value overlays, and our highest-conviction daily bankers — unlocked instantly to your phone via M-Pesa.
        </p>

        {isVip && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Your VIP Subscription is Currently ACTIVE
          </div>
        )}
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl p-6 flex flex-col justify-between border transition-all ${
              t.badge
                ? "bg-[#141124] border-purple-500 shadow-xl shadow-purple-950/50 relative scale-[1.02]"
                : "bg-[#10121b] border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              {t.badge && (
                <div className="inline-block px-2.5 py-0.5 rounded bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider mb-3">
                  {t.badge}
                </div>
              )}

              <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">
                {t.name}
              </h3>

              <div className="my-4 pb-4 border-b border-slate-800">
                <span className="text-2xl sm:text-3xl font-display font-black text-white">
                  KES {t.kes.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 block font-mono">
                  ~${t.usd} / {t.period}
                </span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 mb-6">
                {t.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className={`w-full py-3 rounded-xl font-display text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                t.badge
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950"
                  : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Pay with M-Pesa STK
            </button>
          </div>
        ))}
      </div>

      {/* Trust & PayHero Guarantee */}
      <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h4 className="text-base font-display font-bold text-white uppercase">
              Seamless PayHero M-Pesa Automated Integration
            </h4>
            <p className="text-xs text-slate-400 max-w-lg mt-0.5">
              No manual screenshots or waiting. An automated STK push prompt appears on your phone; entering your M-Pesa PIN activates your account in real-time.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
        >
          Subscribe Now
        </button>
      </div>

      <VIPModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUnlocked={() => setIsVip(true)}
      />
    </div>
  );
}
