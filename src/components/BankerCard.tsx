"use client";

import Image from "next/image";
import { Zap, ShieldCheck, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface BankerCardProps {
  prediction: {
    id: string;
    league_name: string;
    league_logo: string;
    home_team: string;
    away_team: string;
    home_logo: string;
    away_logo: string;
    kickoff_time: string;
    market: string;
    pick: string;
    odds: number;
    confidence: number;
    analysis: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
  };
}

export default function BankerCard({ prediction }: BankerCardProps) {
  const p = prediction;

  const formatMarket = (m: string) => {
    switch (m) {
      case "1X2": return "Full Time Result (1X2)";
      case "DOUBLE_CHANCE": return "Double Chance";
      case "OVER_UNDER": return "Total Goals (Over/Under)";
      case "BTTS": return "Both Teams To Score";
      default: return m;
    }
  };

  const kickoffDate = new Date(p.kickoff_time);
  const timeStr = isNaN(kickoffDate.getTime())
    ? "19:45 UTC"
    : kickoffDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="relative rounded-2xl sports-card-banker p-4 sm:p-6 overflow-hidden border border-purple-500/40">
      {/* Top Banner & Banker Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-600 text-white font-display text-sm font-bold uppercase tracking-wider shadow-md shadow-purple-900/40">
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            Banker of the Day
          </span>
          <span className="text-xs text-purple-300 font-semibold uppercase tracking-tight hidden sm:inline">
            • High Confidence Verified
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {p.status === "WON" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono-odds text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              WON {p.home_score !== null ? `(${p.home_score}-${p.away_score})` : ""}
            </span>
          )}
          {p.status === "LOST" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono-odds text-xs font-bold uppercase tracking-wider">
              <XCircle className="w-4 h-4 text-rose-400" />
              LOST {p.home_score !== null ? `(${p.home_score}-${p.away_score})` : ""}
            </span>
          )}
          {p.status === "PENDING" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              KICKOFF {timeStr}
            </span>
          )}
          {p.status === "VOID" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-slate-700/40 text-slate-300 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              VOID
            </span>
          )}
        </div>
      </div>

      {/* League & Kickoff Info */}
      <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
        {p.league_logo && (
          <img
            src={p.league_logo}
            alt={p.league_name}
            className="w-4 h-4 object-contain filter brightness-110"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
        )}
        <span className="font-semibold text-slate-300">{p.league_name}</span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3 text-slate-500" />
          {timeStr}
        </span>
      </div>

      {/* Matchup Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mb-5 bg-[#0f0e1a]/80 p-4 rounded-xl border border-purple-500/20">
        {/* Teams Display */}
        <div className="sm:col-span-7 flex items-center justify-between gap-3">
          {/* Home */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-11 h-11 rounded-full bg-[#17142b] p-1.5 border border-purple-500/30 flex items-center justify-center shrink-0">
              <img
                src={p.home_logo}
                alt={p.home_team}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://crests.football-data.org/PL.png";
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight text-white line-clamp-1">
                {p.home_team}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Home</span>
            </div>
          </div>

          <div className="text-center px-2">
            <span className="font-display font-black text-slate-500 text-lg">VS</span>
            {p.home_score !== null && p.away_score !== null && (
              <div className="font-mono-odds font-black text-xl text-emerald-400 tracking-wider">
                {p.home_score} - {p.away_score}
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center gap-3 flex-1 justify-end text-right">
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight text-white line-clamp-1">
                {p.away_team}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Away</span>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#17142b] p-1.5 border border-purple-500/30 flex items-center justify-center shrink-0">
              <img
                src={p.away_logo}
                alt={p.away_team}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://crests.football-data.org/PL.png";
                }}
              />
            </div>
          </div>
        </div>

        {/* Prediction Box & Odds */}
        <div className="sm:col-span-5 flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-purple-500/20 sm:pl-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {formatMarket(p.market)}
            </span>
            <span className="font-display text-2xl font-black text-amber-300 uppercase tracking-tight">
              PICK: {p.pick}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Odds badge */}
            <div className="flex flex-col items-center bg-purple-950/70 border border-purple-500/40 rounded-lg px-3 py-1.5">
              <span className="text-[9px] uppercase font-bold text-purple-300">Odds</span>
              <span className="font-mono-odds text-lg font-black text-white">
                {p.odds.toFixed(2)}
              </span>
            </div>

            {/* Confidence */}
            <div className="flex flex-col items-center bg-emerald-950/60 border border-emerald-500/40 rounded-lg px-2.5 py-1.5">
              <span className="text-[9px] uppercase font-bold text-emerald-300">Conf.</span>
              <span className="font-mono-odds text-base font-black text-emerald-400">
                {p.confidence}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rationale & Tactical Intelligence */}
      <div className="bg-[#12101e]/90 rounded-xl p-3.5 border border-purple-500/20 text-xs leading-relaxed text-slate-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-purple-300 font-bold uppercase tracking-wide mr-1">
            Tactical Analysis:
          </strong>
          {p.analysis}
        </div>
      </div>
    </div>
  );
}
