"use client";

import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Flame,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import MatchCard, { PredictionItem } from "@/components/MatchCard";

interface StatsData {
  overallAccuracy: number;
  winRateLast7Days: number;
  winRateLast30Days: number;
  currentStreak: number;
  totalGraded: number;
  totalWins: number;
  totalLosses: number;
}

interface DaySummary {
  total: number;
  won: number;
  lost: number;
  pending: number;
  void: number;
  accuracy: number;
}

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [marketFilter, setMarketFilter] = useState("ALL");

  const fetchHistory = async (date?: string) => {
    setLoading(true);
    try {
      const url = new URL("/api/predictions/history", window.location.origin);
      if (date) url.searchParams.set("date", date);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (marketFilter !== "ALL") url.searchParams.set("market", marketFilter);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.success) {
        setSelectedDate(data.selectedDate);
        setAvailableDates(data.availableDates || []);
        setPredictions(data.predictions || []);
        setStats(data.stats);
        setDaySummary(data.daySummary);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(selectedDate || undefined);
  }, [selectedDate, statusFilter, marketFilter]);

  const handleDateChange = (d: string) => {
    setSelectedDate(d);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          Verified Public Audit Trail
        </div>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white uppercase tracking-tight">
          Historical Predictions & Results Archive
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
          Complete transparent log of past predictions with deterministically graded match scores, calculated ROI, and rolling win rates.
        </p>
      </div>

      {/* Running Performance Statistics Board */}
      {stats && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 7 Days Win Rate */}
          <div className="bg-[#11131b] border border-[#1f2334] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Last 7 Days Win Rate
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="font-display font-black text-3xl sm:text-4xl text-emerald-400 tracking-tight">
              {stats.winRateLast7Days}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Rolling 7-day audited tips</span>
          </div>

          {/* 30 Days Win Rate */}
          <div className="bg-[#11131b] border border-[#1f2334] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Last 30 Days Win Rate
              </span>
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div className="font-display font-black text-3xl sm:text-4xl text-purple-400 tracking-tight">
              {stats.winRateLast30Days}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Comprehensive monthly accuracy</span>
          </div>

          {/* Current Win Streak */}
          <div className="bg-[#11131b] border border-[#1f2334] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Winning Streak
              </span>
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              </span>
            </div>
            <div className="font-display font-black text-3xl sm:text-4xl text-amber-300 tracking-tight">
              {stats.currentStreak} <span className="text-xl font-normal text-slate-400">In A Row</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Consecutive winning banker picks</span>
          </div>

          {/* All-time Accuracy */}
          <div className="bg-[#11131b] border border-[#1f2334] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                All-Time Accuracy
              </span>
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Zap className="w-4 h-4" />
              </span>
            </div>
            <div className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              {stats.overallAccuracy}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium font-mono">
              {stats.totalWins}W / {stats.totalLosses}L total graded
            </span>
          </div>
        </section>
      )}

      {/* Date Picker & Filter Controls */}
      <section className="bg-[#10121a] border border-[#1f2333] rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Quick Date Pills + Calendar Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {availableDates.slice(0, 6).map((d) => {
              const isSelected = selectedDate === d;
              const dateObj = new Date(d);
              const label = dateObj.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <button
                  key={d}
                  onClick={() => handleDateChange(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-md shadow-purple-950"
                      : "bg-[#161824] text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Native Date Input Picker */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
              Custom Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-[#161824] border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>

        {/* Filters Bar: Status & Market */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              Outcome:
            </span>
            {["ALL", "WON", "LOST"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-slate-700 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold">Market:</span>
            {["ALL", "1X2", "DOUBLE_CHANCE", "OVER_UNDER", "BTTS"].map((m) => (
              <button
                key={m}
                onClick={() => setMarketFilter(m)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  marketFilter === m
                    ? "bg-purple-900/60 text-purple-300 border border-purple-500/30"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                {m === "ALL" ? "All" : m}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Selected Day Performance Summary Banner */}
      {daySummary && (
        <div className="bg-[#121420] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-lg text-white uppercase">
              {new Date(selectedDate).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              {daySummary.total} match{daySummary.total !== 1 ? "es" : ""} recorded
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {daySummary.won} Won
            </span>
            <span className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              {daySummary.lost} Lost
            </span>
            {daySummary.pending > 0 && (
              <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {daySummary.pending} Pending
              </span>
            )}
            <span className="px-3 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-500/40 font-mono-odds">
              Day Win Rate: {daySummary.accuracy}%
            </span>
          </div>
        </div>
      )}

      {/* History Matches List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-xl bg-[#11131a] border border-[#1f2333] p-5 h-40 animate-pulse-subtle"
            ></div>
          ))}
        </div>
      ) : predictions.length === 0 ? (
        <div className="rounded-2xl bg-[#11131a] border border-[#1f2333] p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="font-display text-xl font-bold uppercase text-white">
            No Historical Matches Found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No archived predictions match your selected date or outcome filters. Try picking another date above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.map((pred) => (
            <MatchCard
              key={pred.id}
              prediction={pred}
              isVipUnlocked={true} // In history view, past VIP picks are transparently viewable for auditing!
            />
          ))}
        </div>
      )}
    </div>
  );
}
