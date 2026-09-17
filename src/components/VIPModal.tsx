"use client";

import { useState, useEffect } from "react";
import {
  Crown,
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface VIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export default function VIPModal({ isOpen, onClose, onUnlocked }: VIPModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<string>("IDLE");
  const [countdown, setCountdown] = useState(60);

  const plans = [
    {
      id: "daily",
      name: "Daily VIP Pass",
      kes: 350,
      usd: 3.5,
      desc: "Full access to today's locked VIP predictions and Banker.",
    },
    {
      id: "weekly",
      name: "7-Day Pro Access",
      kes: 1500,
      usd: 14.0,
      badge: "MOST POPULAR",
      desc: "7 full days of VIP bankers, weekend mega accumulators & strategy.",
    },
    {
      id: "monthly",
      name: "Monthly Elite Club",
      kes: 4500,
      usd: 40.0,
      badge: "BEST VALUE",
      desc: "30 days unrestricted access, saves over 55% with 1-on-1 advisor.",
    },
  ];

  // Poll for payment completion when paymentRef is active
  useEffect(() => {
    if (!paymentRef || pollStatus === "SUCCESS") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/vip/status?reference=${paymentRef}`);
        const data = await res.json();

        if (data.active) {
          setPollStatus("SUCCESS");
          localStorage.setItem("apex_vip_active", "true");
          clearInterval(interval);
          setTimeout(() => {
            onUnlocked();
            onClose();
          }, 1500);
        }
      } catch (err) {
        console.error("Polling status failed:", err);
      }
    }, 3000);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [paymentRef, pollStatus, onUnlocked, onClose]);

  if (!isOpen) return null;

  const handleInitiateSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 9) {
      setErrorMessage("Please enter a valid Safaricom/Airtel phone number (e.g. 0712345678)");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/vip/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          planId: selectedPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      setPaymentRef(data.reference);
      setPollStatus("WAITING_PIN");
      setCountdown(60);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not connect to payment gateway");
    } finally {
      setLoading(false);
    }
  };

  // Instant sandbox simulation approval for demo/testing
  const handleSimulateApproval = async () => {
    if (!paymentRef) return;
    setLoading(true);
    try {
      const res = await fetch("/api/vip/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: paymentRef }),
      });
      const data = await res.json();
      if (data.success) {
        setPollStatus("SUCCESS");
        localStorage.setItem("apex_vip_active", "true");
        setTimeout(() => {
          onUnlocked();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to simulate approval");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#12141F] border border-purple-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-7 text-slate-200 relative shadow-2xl shadow-purple-950/70 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
            <Crown className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">
              Unlock APEX90 VIP Lounge
            </h2>
            <p className="text-xs text-purple-300 font-medium">
              Instant M-Pesa STK Push Payment via PayHero
            </p>
          </div>
        </div>

        {pollStatus === "SUCCESS" ? (
          /* Success Screen */
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="text-xl font-display font-black text-white uppercase mb-2">
              Payment Verified! VIP Unlocked
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              You now have full access to all VIP predictions, odds intelligence, and banker breakdowns.
            </p>
          </div>
        ) : pollStatus === "WAITING_PIN" ? (
          /* Waiting for STK PIN prompt */
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400 mx-auto mb-4 animate-pulse">
              <Smartphone className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-display font-bold text-white uppercase mb-1">
              Check Your Phone
            </h3>
            <p className="text-xs text-slate-300 mb-4 max-w-sm mx-auto leading-relaxed">
              An M-Pesa payment prompt has been sent to <strong className="text-white">{phone}</strong>. Enter your M-Pesa PIN to complete payment.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181a27] border border-purple-500/30 text-xs font-mono text-purple-300 mb-6">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              Waiting for PIN confirmation ({countdown}s)
            </div>

            {/* Sandbox Simulation Helper */}
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-left mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
                <Zap className="w-4 h-4" />
                Sandbox / Instant Testing
              </div>
              <p className="text-[11px] text-slate-300 mb-3">
                Evaluating without live M-Pesa deduction? Click below to instantly simulate successful M-Pesa PIN entry:
              </p>
              <button
                type="button"
                onClick={handleSimulateApproval}
                disabled={loading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Simulate Instant PIN Approval
              </button>
            </div>
          </div>
        ) : (
          /* Subscription Plans & Form */
          <form onSubmit={handleInitiateSTK} className="space-y-4">
            {/* Plan Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select VIP Access Plan
              </label>
              <div className="grid grid-cols-1 gap-2">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id as any)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-purple-950/60 border-purple-500 shadow-md shadow-purple-950"
                          : "bg-[#161824] border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base font-bold text-white tracking-tight">
                            {plan.name}
                          </span>
                          {plan.badge && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500 text-black">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{plan.desc}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-display font-black text-lg text-white">
                          KES {plan.kes.toLocaleString()}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ~${plan.usd}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>M-Pesa Phone Number</span>
                <span className="text-[10px] text-slate-500 font-normal">Format: 07XXXXXXXX</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#161824] border border-slate-700 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
                <Smartphone className="w-5 h-5 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display text-base font-black uppercase tracking-wider shadow-lg shadow-purple-950 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending STK Push Prompt...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 text-amber-300" />
                  Pay via M-Pesa STK Push
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Secured by PayHero Gateway • Automated Instant Unlock</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
