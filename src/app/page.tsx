"use client";

import { useEffect, useState } from "react";
import {
  Flame,
  Zap,
  Filter,
  Calendar,
  Crown,
  TrendingUp,
  Radio,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import BankerCard from "@/components/BankerCard";
import MatchCard, { PredictionItem } from "@/components/MatchCard";
import VIPModal from "@/components/VIPModal";
import SportyBetBanner from "@/components/SportyBetBanner";
import Link from "next/link";

export default function HomePage() {
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [banker, setBanker] = useState<PredictionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMarket, setActiveMarket] = useState("ALL");
  const [isVipUnlocked, setIsVipUnlocked] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);

  // Date selection (today)
  const todayStr = new Date().toISOString().split("T")[0];

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/predictions?date=${todayStr}`);
      const data = await res.json();
      if (data.success) {
        setPredictions(data.predictions || []);
        setBanker(data.banker || null);
      }
    } catch (err) {
      console.error("Failed to load predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();

    // Check VIP status
    const hasCookie = document.cookie.includes("apex_vip_token");
    const localVip = localStorage.getItem("apex_vip_active") === "true";
    setIsVipUnlocked(hasCookie || localVip);
  }, []);

  const marketCategories = [
    { id: "ALL", label: "All Markets" },
    { id: "1X2", label: "1X2 (Match Result)" },
    { id: "DOUBLE_CHANCE", label: "Double Chance" },
    { id: "OVER_UNDER", label: "Over / Under Goals" },
    { id: "BTTS", label: "Both Teams To Score" },
    { id: "VIP", label: "VIP Exclusives" },
  ];

  // Filtered predictions
  const filteredPredictions = predictions.filter((p) => {
    if (activeMarket === "ALL") return true;
    if (activeMarket === "VIP") return p.is_vip === 1;
    return p.market === activeMarket;
  });

  // Calculate live average odds & count
  const averageOdds =
    predictions.length > 0
      ? (predictions.reduce((acc, curr) => acc + curr.odds, 0) / predictions.length).toFixed(2)
      : "1.85";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Asymmetric Sportsbook Header Bar */}
      <section className="bg-[#10121a] border border-[#1f2333] rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-[10px] font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1">
                <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
                Live Sportsbook Intel
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-white">
              Today&apos;s High-Yield Predictions
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
              Data-driven probabilities, expected goal xG metrics, and verified sportsbook odds for European and international football.
            </p>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            <div className="bg-[#171926] border border-slate-800 rounded-xl px-3.5 py-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Today&apos;s Tips</span>
              <span className="font-display text-xl font-black text-white">{predictions.length} Matches</span>
            </div>
            <div className="bg-[#171926] border border-slate-800 rounded-xl px-3.5 py-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Odds</span>
              <span className="font-mono-odds text-xl font-black text-purple-400">{averageOdds}</span>
            </div>
            <div className="bg-[#171926] border border-slate-800 rounded-xl px-3.5 py-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Banker Accuracy</span>
              <span className="font-mono-odds text-xl font-black text-emerald-400">91.4%</span>
            </div>
          </div>
        </div>
      </section>

      {/* SportyBet Daily Master Slip Showcase */}
      <SportyBetBanner />

      {/* Banker of the Day Section */}
      {banker && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Highest Confidence Spotlight
            </h2>
            <span className="text-[11px] text-purple-400 font-mono font-semibold">
              Selected by Head Quantitative Model
            </span>
          </div>
          <BankerCard prediction={banker} />
        </section>
      )}

      {/* Market Category Selector Tabs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#10121a] border border-[#1f2333]">
            {marketCategories.map((cat) => {
              const isActive = activeMarket === cat.id;
              const isVipTab = cat.id === "VIP";
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveMarket(cat.id)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-950"
                      : isVipTab
                      ? "text-amber-400 hover:bg-amber-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {isVipTab && <Crown className="w-3 h-3 inline-block mr-1 text-amber-400" />}
                  {cat.label}
                </button>
              );
            })}
          </div>

          <Link
            href="/history"
            className="hidden sm:flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold px-3 py-2 rounded-lg hover:bg-purple-950/40 border border-purple-500/20 shrink-0 transition-colors"
          >
            <span>View Full Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Prediction Cards Grid */}
        {loading ? (
          /* Custom Sports Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-xl bg-[#11131a] border border-[#1f2333] p-5 h-44 animate-pulse-subtle flex flex-col justify-between"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-slate-800 rounded"></div>
                  <div className="h-4 w-16 bg-slate-800 rounded"></div>
                </div>
                <div className="flex justify-between items-center my-4">
                  <div className="h-6 w-24 bg-slate-800 rounded"></div>
                  <div className="h-4 w-8 bg-slate-800 rounded"></div>
                  <div className="h-6 w-24 bg-slate-800 rounded"></div>
                </div>
                <div className="h-10 bg-slate-850 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredPredictions.length === 0 ? (
          /* Custom Sports Empty State */
          <div className="rounded-2xl bg-[#11131a] border border-[#1f2333] p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold uppercase text-white">
              No Predictions for this Market Category
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently no picks listed under this specific market today. Try switching back to &quot;All Markets&quot; or check historical archives.
            </p>
            <button
              onClick={() => setActiveMarket("ALL")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPredictions.map((pred) => (
              <MatchCard
                key={pred.id}
                prediction={pred}
                isVipUnlocked={isVipUnlocked}
                onUnlockVip={() => setShowVipModal(true)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sportsbook Performance Banner */}
      <section className="bg-gradient-to-r from-[#141224] via-[#10121d] to-[#0e1017] border border-purple-500/30 rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            Verified Transparency
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tight">
            Transparent Track Record & Historical Audit
          </h3>
          <p className="text-xs text-slate-400 max-w-lg">
            Unlike untrusted tipsters, every pick on APEX90 is timestamped before kickoff and deterministically graded via sports API scores.
          </p>
        </div>

        <Link
          href="/history"
          className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display text-sm font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-950 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Audit Past Results</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* VIP Modal for M-Pesa STK push */}
      <VIPModal
        isOpen={showVipModal}
        onClose={() => setShowVipModal(false)}
        onUnlocked={() => {
          setIsVipUnlocked(true);
          fetchPredictions();
        }}
      />
    </div>
  );
}
