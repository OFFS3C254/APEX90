"use client";

import { useState, useEffect } from "react";
import { Download, X, Share2, PlusSquare, Smartphone } from "lucide-react";

export default function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / standalone
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // 2. Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Register service worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[APEX90] ServiceWorker registered:", reg.scope))
        .catch((err) => console.warn("[APEX90] ServiceWorker error:", err));
    }

    // 4. Capture beforeinstallprompt for Android / Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  // Show if either beforeinstallprompt is ready OR it's iOS and not yet installed
  const canShow = !!installPrompt || (isIos && !isStandalone);
  if (!canShow) return null;

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallPrompt(null);
      }
    } else if (isIos) {
      setShowIosModal(true);
    }
  };

  return (
    <>
      {/* Floating Bottom Install Banner */}
      <div className="fixed bottom-14 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-md z-40 bg-[#121520] border border-purple-500/40 rounded-xl p-3 shadow-2xl shadow-purple-950/60 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#18152e] border border-purple-500/50 flex items-center justify-center text-purple-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-tight text-white flex items-center gap-1.5">
              Install APEX90 PWA
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                Fast & Offline
              </span>
            </span>
            <span className="text-[11px] text-slate-400 line-clamp-1">
              Add to Home Screen for live match score alerts
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#121520] border border-purple-500/40 rounded-2xl max-w-sm w-full p-6 text-slate-200 relative shadow-2xl">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4 mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-center text-white mb-2 uppercase tracking-tight">
              Install on iPhone / iPad
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
              Install APEX90 as a standalone home screen app without going through the App Store.
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <Share2 className="w-5 h-5 text-purple-400 shrink-0" />
                <span>
                  1. Tap the <strong className="text-white">Share</strong> button at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <PlusSquare className="w-5 h-5 text-purple-400 shrink-0" />
                <span>
                  2. Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong>.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="mt-6 w-full py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
