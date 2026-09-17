"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[#12141C] border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600" />
        
        <div className="w-16 h-16 rounded-2xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 text-purple-400">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          Offline Mode Active
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
          Connection Interrupted
        </h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You are currently browsing offline. You can still view previously cached predictions and bankroll performance when reconnected.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm tracking-wide transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Check Connection & Retry
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
