"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, KeyRound, ShieldAlert, ArrowRight, Radio } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@apex90.com");
  const [password, setPassword] = useState("Admin12345!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid administrator credentials");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#11131c] border border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40 relative">
        <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400 mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-display font-black text-white uppercase tracking-tight">
            APEX90 Staff Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Restricted administrative terminal for predictions, fixtures & auto-grading
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#161824] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                required
              />
              <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#161824] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                required
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950 cursor-pointer active:scale-98"
          >
            {loading ? "Verifying Credentials..." : "Authenticate & Access Terminal"}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Preset credentials note */}
          <div className="mt-4 p-3 rounded-xl bg-[#161824] border border-slate-800 text-[11px] text-slate-400">
            <strong className="text-purple-300 font-semibold block mb-0.5">
              Default Super-Admin Credentials:
            </strong>
            <div className="font-mono text-slate-300">
              Email: <span className="text-white">admin@apex90.com</span>
              <br />
              Password: <span className="text-white">Admin12345!</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
