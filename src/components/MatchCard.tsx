"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Crown,
  Lock,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  History,
  Ticket,
} from "lucide-react";
import H2HModal from "./H2HModal";
import CommunityPoll from "./CommunityPoll";

export interface PredictionItem {
  id: string;
  fixture_id: string;
  league_name: string;
  league_country: string;
  league_logo: string;
  home_team: string;
  away_team: string;
  home_logo: string;
  away_logo: string;
  kickoff_time: string;
  date: string;
  market: string;
  pick: string;
  odds: number;
  confidence: number;
  analysis: string;
  is_vip: number;
  is_banker: number;
  status: string; // 'PENDING' | 'WON' | 'LOST' | 'VOID'
  home_score: number | null;
  away_score: number | null;
  match_status: string;
  booking_code?: string;
}

interface MatchCardProps {
  prediction: PredictionItem;
  isVipUnlocked?: boolean;
  onUnlockVip?: () => void;
}

export default function MatchCard({
  prediction: p,
  isVipUnlocked = false,
  onUnlockVip,
}: MatchCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showH2H, setShowH2H] = useState(false);

  const isLocked = p.is_vip === 1 && !isVipUnlocked;

  const formatMarketTag = (m: string) => {
    switch (m) {
      case "1X2": return "1X2";
      case "DOUBLE_CHANCE": return "Double Chance";
      case "OVER_UNDER": return "Goals O/U";
      case "BTTS": return "BTTS";
      default: return m;
    }
  };

  const kickoffDate = new Date(p.kickoff_time);
  const timeStr = isNaN(kickoffDate.getTime())
    ? "18:00"
    : kickoffDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
        isLocked
          ? "sports-card-vip-locked border border-purple-500/30"
          : "sports-card hover:border-slate-700"
      }`}
    >
      {/* Top Header: League, Kickoff Time, VIP/Status */}
      <div className="px-4 py-2.5 bg-[#0b0d14] border-b border-[#1b1e2c] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          {p.league_logo && (
            <img
              src={p.league_logo}
              alt={p.league_name}
              className="w-4 h-4 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          )}
          <span className="font-semibold text-slate-300 truncate max-w-[140px] sm:max-w-[200px]">
            {p.league_name}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 flex items-center gap-1 font-mono shrink-0">
            <Clock className="w-3 h-3 text-slate-500" />
            {timeStr}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {p.is_vip === 1 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40 font-bold text-[10px] tracking-wider uppercase">
              <Crown className="w-3 h-3 text-amber-400" />
              VIP
            </span>
          )}

          {/* Outcome Status Badges */}
          {p.status === "WON" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] uppercase tracking-wider font-mono-odds">
              <CheckCircle2 className="w-3.5 h-3.5" />
              WON {p.home_score !== null ? `${p.home_score}-${p.away_score}` : ""}
            </span>
          )}
          {p.status === "LOST" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold text-[11px] uppercase tracking-wider font-mono-odds">
              <XCircle className="w-3.5 h-3.5" />
              LOST {p.home_score !== null ? `${p.home_score}-${p.away_score}` : ""}
            </span>
          )}
          {p.status === "VOID" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              VOID
            </span>
          )}
          {p.status === "PENDING" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 text-[11px] font-medium">
              PENDING
            </span>
          )}
        </div>
      </div>

      {/* Main Card Body */}
      <div className="p-4">
        {/* Teams Matchup Row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          {/* Home Team */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#161822] p-1 border border-slate-800 flex items-center justify-center shrink-0">
              <img
                src={p.home_logo}
                alt={p.home_team}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://crests.football-data.org/PL.png";
                }}
              />
            </div>
            <span className="font-display text-base font-bold text-white tracking-tight truncate">
              {p.home_team}
            </span>
          </div>

          {/* Scores / VS */}
          <div className="text-center px-2 shrink-0">
            {p.home_score !== null && p.away_score !== null ? (
              <span className="font-mono-odds font-black text-lg text-emerald-400 tracking-wider">
                {p.home_score} - {p.away_score}
              </span>
            ) : (
              <span className="font-display font-bold text-xs uppercase px-2 py-1 rounded bg-[#181a24] text-slate-400 border border-slate-800">
                VS
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end text-right">
            <span className="font-display text-base font-bold text-white tracking-tight truncate">
              {p.away_team}
            </span>
            <div className="w-9 h-9 rounded-full bg-[#161822] p-1 border border-slate-800 flex items-center justify-center shrink-0">
              <img
                src={p.away_logo}
                alt={p.away_team}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://crests.football-data.org/PL.png";
                }}
              />
            </div>
          </div>
        </div>

        {/* Prediction & Odds Board */}
        {isLocked ? (
          /* VIP Locked State */
          <div className="relative rounded-xl p-4 bg-[#141022] border border-purple-500/30 overflow-hidden text-center my-2">
            <div className="filter blur-sm select-none opacity-40 flex items-center justify-between text-slate-400">
              <span className="font-display text-xl">PICK: HOME WIN</span>
              <span className="font-mono-odds text-lg">ODDS 2.30</span>
              <span>85% Confidence</span>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-purple-950/70 backdrop-blur-[2px]">
              <Lock className="w-5 h-5 text-amber-400 mb-1 animate-bounce" />
              <span className="font-display text-base font-black text-white uppercase tracking-tight">
                VIP Premium Pick
              </span>
              <p className="text-[11px] text-purple-200 mb-2">
                High-yield algorithmic prediction
              </p>
              <button
                onClick={onUnlockVip}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-950 transition-transform active:scale-95"
              >
                Unlock with M-Pesa STK
              </button>
            </div>
          </div>
        ) : (
          /* Unlocked Prediction Bar */
          <div className="bg-[#151722] rounded-xl p-3 border border-[#232736] flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {formatMarketTag(p.market)}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-purple-400">PICK:</span>
                <span className="font-display text-lg font-black text-white uppercase tracking-tight">
                  {p.pick}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Confidence Gauge */}
              <div className="flex flex-col items-center bg-[#1c1f2e] border border-slate-700/60 rounded-lg px-2.5 py-1">
                <span className="text-[9px] uppercase font-semibold text-slate-400">Conf.</span>
                <span className="font-mono-odds text-sm font-bold text-emerald-400">
                  {p.confidence}%
                </span>
              </div>

              {/* Bookmaker Odds */}
              <div className="flex flex-col items-center bg-purple-950/60 border border-purple-500/40 rounded-lg px-3 py-1">
                <span className="text-[9px] uppercase font-bold text-purple-300">Odds</span>
                <span className="font-mono-odds text-base font-black text-white">
                  {p.odds.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SportyBet Specific Booking Code if present */}
        {p.booking_code && (
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-rose-300 font-bold text-[11px]">
              <Ticket className="w-3.5 h-3.5" />
              SportyBet Code:
            </span>
            <span className="font-mono font-black text-white px-2 py-0.5 bg-rose-900/60 rounded border border-rose-500/40 tracking-wider">
              {p.booking_code}
            </span>
          </div>
        )}

        {/* Action Buttons: Key Stats & H2H */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
          {!isLocked && p.analysis && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-medium">Tactical Notes</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <button
            onClick={() => setShowH2H(true)}
            className="ml-auto flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 px-2.5 py-1 rounded-lg bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/30 font-semibold cursor-pointer transition-colors"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>H2H & Form</span>
          </button>
        </div>

        {/* Collapsible Tactical Analysis */}
        {!isLocked && p.analysis && showDetails && (
          <div className="mt-2 p-3 rounded-lg bg-[#0e1017] border border-slate-800/80 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
            {p.analysis}
          </div>
        )}

        {/* Community Sentiment Poll */}
        <CommunityPoll
          predictionId={p.id}
          homeTeam={p.home_team}
          awayTeam={p.away_team}
        />
      </div>

      {/* H2H & Form Modal */}
      <H2HModal
        isOpen={showH2H}
        onClose={() => setShowH2H(false)}
        homeTeam={p.home_team}
        awayTeam={p.away_team}
        homeLogo={p.home_logo}
        awayLogo={p.away_logo}
      />
    </div>
  );
}
