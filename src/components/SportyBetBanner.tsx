"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, Ticket, Zap } from "lucide-react";

export default function SportyBetBanner() {
  const [booking, setBooking] = useState<{
    code: string;
    description: string;
  }>({
    code: "BC94X2",
    description: "Today's High-Yield Multi-Bet Accumulator",
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/booking-code")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.code) {
          setBooking({ code: d.code, description: d.description });
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(booking.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-gradient-to-r from-[#1c131a] via-[#141220] to-[#0e1017] border border-rose-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg shadow-rose-950/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: SportyBet Badge & Desc */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-rose-900/40 shrink-0">
            <Ticket className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-display text-[11px] font-black uppercase tracking-wider">
                SPORTYBET
              </span>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">
                Official Multi-Bet Slip
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {booking.description}
            </p>
          </div>
        </div>

        {/* Right: Booking Code & Copy Button */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <div className="flex items-center gap-2 bg-[#0c0d14] border border-rose-500/40 rounded-xl px-3.5 py-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Code:</span>
            <span className="font-mono text-base sm:text-lg font-black text-rose-300 tracking-wider">
              {booking.code}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-rose-950 active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <a
            href="https://www.sportybet.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Open SportyBet"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
