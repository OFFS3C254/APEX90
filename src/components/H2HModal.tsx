"use client";

import { useEffect, useState } from "react";
import { X, Trophy, Shield, TrendingUp, History, Loader2, Sparkles } from "lucide-react";

interface H2HModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
}

export default function H2HModal({
  isOpen,
  onClose,
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
}: H2HModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/fixtures/h2h?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [isOpen, homeTeam, awayTeam]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#12141F] border border-purple-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 text-slate-200 relative shadow-2xl shadow-purple-950/70 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 block">
              Historical Head-to-Head & Form Guide
            </span>
            <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
              {homeTeam} vs {awayTeam}
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
            <p className="text-xs text-slate-400">Querying API-Sports statistical intelligence...</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Form Indicators */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0f111a] border border-slate-800">
              {/* Home Form */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 truncate block">
                  {homeTeam} (Recent 5)
                </span>
                <div className="flex items-center gap-1.5">
                  {(data?.homeForm || ["W", "W", "D", "W", "L"]).map((f: string, i: number) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${
                        f === "W"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : f === "D"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Away Form */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 truncate block">
                  {awayTeam} (Recent 5)
                </span>
                <div className="flex items-center gap-1.5">
                  {(data?.awayForm || ["W", "D", "W", "W", "D"]).map((f: string, i: number) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${
                        f === "W"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : f === "D"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Aggregated Metrics */}
            {data?.stats && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-[#161824] border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Home Wins</span>
                  <span className="font-mono-odds font-black text-base text-emerald-400">
                    {data.stats.homeWins}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#161824] border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Draws</span>
                  <span className="font-mono-odds font-black text-base text-amber-400">
                    {data.stats.draws}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#161824] border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Away Wins</span>
                  <span className="font-mono-odds font-black text-base text-purple-400">
                    {data.stats.awayWins}
                  </span>
                </div>
              </div>
            )}

            {/* Past Meetings List */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Last {data?.matches?.length || 0} Direct Clashes
              </span>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {data?.matches?.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#161824] border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {m.date} • {m.league}
                      </span>
                      <span className="font-semibold text-slate-200">
                        {m.home_team} vs {m.away_team}
                      </span>
                    </div>

                    <div className="font-mono-odds font-black text-sm px-2.5 py-1 rounded bg-[#0e1017] text-white border border-slate-800">
                      {m.home_score} - {m.away_score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                Avg Goals: <strong className="text-white">{data?.stats?.avgGoals || "2.5"}</strong>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Powered by API-Sports</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
