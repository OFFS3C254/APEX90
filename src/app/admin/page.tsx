"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Crown,
  Zap,
  Search,
  Settings,
  Users,
  Calendar,
  Layers,
  Sparkles,
  Sliders,
  DollarSign,
  Loader2,
  X,
} from "lucide-react";
import { Fixture } from "@/lib/sportsApi";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "predictions" | "fixtures" | "subscribers" | "settings">("overview");

  // Dashboard Stats
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Predictions
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPreds, setLoadingPreds] = useState(true);
  const [predFilterStatus, setPredFilterStatus] = useState("ALL");

  // Fixtures
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixtureDate, setFixtureDate] = useState(new Date().toISOString().split("T")[0]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);

  // Sync Action
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<any>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState<any>(null);
  const [showGrantVipModal, setShowGrantVipModal] = useState(false);

  // Form states
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [formData, setFormData] = useState({
    market: "1X2",
    pick: "1",
    odds: "1.85",
    confidence: "85",
    analysis: "",
    is_vip: false,
    is_banker: false,
    published: true,
  });

  // Score override state
  const [scoreData, setScoreData] = useState({
    home_score: "",
    away_score: "",
    status: "",
  });

  // Manual VIP grant
  const [grantPhone, setGrantPhone] = useState("");
  const [grantDays, setGrantDays] = useState("7");

  // Settings
  const [settings, setSettings] = useState<any>({});
  const [footballApiKey, setFootballApiKey] = useState("");
  const [payheroChannel, setPayheroChannel] = useState("");
  const [payheroKey, setPayheroKey] = useState("");

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPredictions = async () => {
    setLoadingPreds(true);
    try {
      const url = new URL("/api/admin/predictions", window.location.origin);
      if (predFilterStatus !== "ALL") url.searchParams.set("status", predFilterStatus);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setPredictions(data.predictions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPreds(false);
    }
  };

  const fetchFixtures = async (date: string) => {
    setLoadingFixtures(true);
    try {
      const res = await fetch(`/api/admin/fixtures?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setFixtures(data.fixtures || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFixtures(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPredictions();
    fetchFixtures(fixtureDate);
    fetchSettings();
  }, []);

  // Trigger results sync and auto-grading
  const handleSyncScores = async () => {
    setSyncing(true);
    setSyncLog(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();
      setSyncLog(data);
      fetchStats();
      fetchPredictions();
    } catch (err: any) {
      setSyncLog({ error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  // Open creation modal with a fixture
  const handleSelectFixtureToCreate = (fix: Fixture) => {
    setSelectedFixture(fix);
    setFormData({
      market: "1X2",
      pick: "1",
      odds: "1.85",
      confidence: "85",
      analysis: `${fix.home_team} strong home form against ${fix.away_team}. Tactical expectation of intense forward pressing.`,
      is_vip: false,
      is_banker: false,
      published: true,
    });
    setShowCreateModal(true);
  };

  // Submit new prediction
  const handleCreatePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixture) return;

    try {
      const payload = {
        fixture_id: selectedFixture.id,
        league_name: selectedFixture.league_name,
        league_country: selectedFixture.league_country,
        league_logo: selectedFixture.league_logo,
        home_team: selectedFixture.home_team,
        away_team: selectedFixture.away_team,
        home_logo: selectedFixture.home_logo,
        away_logo: selectedFixture.away_logo,
        kickoff_time: selectedFixture.kickoff_time,
        date: selectedFixture.date,
        market: formData.market,
        pick: formData.pick,
        odds: parseFloat(formData.odds),
        confidence: parseInt(formData.confidence, 10),
        analysis: formData.analysis,
        is_vip: formData.is_vip ? 1 : 0,
        is_banker: formData.is_banker ? 1 : 0,
        published: formData.published ? 1 : 0,
      };

      const res = await fetch("/api/admin/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowCreateModal(false);
        fetchPredictions();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Score override / Auto-grading trigger
  const handleSaveScore = async () => {
    if (!showScoreModal) return;

    try {
      const body: any = {
        home_score: scoreData.home_score !== "" ? parseInt(scoreData.home_score, 10) : null,
        away_score: scoreData.away_score !== "" ? parseInt(scoreData.away_score, 10) : null,
        auto_grade: true,
      };

      if (scoreData.status) {
        body.status = scoreData.status;
      }

      const res = await fetch(`/api/admin/predictions/${showScoreModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowScoreModal(null);
        fetchPredictions();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete prediction
  const handleDeletePrediction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prediction?")) return;
    await fetch(`/api/admin/predictions/${id}`, { method: "DELETE" });
    fetchPredictions();
    fetchStats();
  };

  // Toggle Banker
  const handleToggleBanker = async (p: any) => {
    await fetch(`/api/admin/predictions/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_banker: p.is_banker === 1 ? 0 : 1 }),
    });
    fetchPredictions();
  };

  // Toggle VIP
  const handleToggleVip = async (p: any) => {
    await fetch(`/api/admin/predictions/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_vip: p.is_vip === 1 ? 0 : 1 }),
    });
    fetchPredictions();
  };

  // Grant Manual VIP
  const handleGrantVip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantPhone) return;
    await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: grantPhone, days: grantDays }),
    });
    setShowGrantVipModal(false);
    setGrantPhone("");
    fetchStats();
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {};
    if (footballApiKey) payload.FOOTBALL_DATA_API_KEY = footballApiKey;
    if (payheroChannel) payload.PAYHERO_CHANNEL_ID = payheroChannel;
    if (payheroKey) payload.PAYHERO_API_KEY = payheroKey;

    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchSettings();
    alert("Settings saved!");
  };

  // Contextual picks based on market
  const getPicksForMarket = (market: string) => {
    switch (market) {
      case "1X2":
        return [
          { value: "1", label: "1 (Home Win)" },
          { value: "X", label: "X (Draw)" },
          { value: "2", label: "2 (Away Win)" },
        ];
      case "DOUBLE_CHANCE":
        return [
          { value: "1X", label: "1X (Home Win or Draw)" },
          { value: "12", label: "12 (Home Win or Away Win)" },
          { value: "X2", label: "X2 (Draw or Away Win)" },
        ];
      case "OVER_UNDER":
        return [
          { value: "Over 1.5", label: "Over 1.5 Goals" },
          { value: "Under 1.5", label: "Under 1.5 Goals" },
          { value: "Over 2.5", label: "Over 2.5 Goals" },
          { value: "Under 2.5", label: "Under 2.5 Goals" },
          { value: "Over 3.5", label: "Over 3.5 Goals" },
          { value: "Under 3.5", label: "Under 3.5 Goals" },
        ];
      case "BTTS":
        return [
          { value: "Yes", label: "Yes (Both Teams Score)" },
          { value: "No", label: "No (Clean Sheet/0-0)" },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#10121a] border border-[#1e2333] rounded-xl overflow-x-auto scrollbar-none">
        {[
          { id: "overview", label: "Overview & Sync", icon: Zap },
          { id: "predictions", label: "Predictions Hub", icon: Layers },
          { id: "fixtures", label: "Fixture Importer", icon: Calendar },
          { id: "subscribers", label: "VIP & Payments", icon: Crown },
          { id: "settings", label: "API Configuration", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-purple-600 text-white shadow-md shadow-purple-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & AUTO-GRADING SYNC */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Metrics Row */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-[#11131c] border border-slate-800 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Predictions</span>
                <span className="font-display text-2xl font-black text-white">{stats.totalPredictions}</span>
              </div>
              <div className="bg-[#11131c] border border-amber-500/30 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Pending Grading</span>
                <span className="font-display text-2xl font-black text-amber-300">{stats.pendingGrading}</span>
              </div>
              <div className="bg-[#11131c] border border-emerald-500/30 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Win Rate</span>
                <span className="font-display text-2xl font-black text-emerald-400">{stats.winRate}%</span>
              </div>
              <div className="bg-[#11131c] border border-purple-500/30 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-purple-300 block">VIP Subscribers</span>
                <span className="font-display text-2xl font-black text-purple-400">{stats.activeSubs}</span>
              </div>
              <div className="bg-[#11131c] border border-slate-800 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Revenue</span>
                <span className="font-display text-2xl font-black text-white">KES {stats.totalRevenueKes}</span>
              </div>
            </div>
          )}

          {/* Sync & Auto-Grading Engine Action Box */}
          <div className="bg-gradient-to-r from-[#171329] to-[#0f111a] border border-purple-500/40 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h3 className="font-display text-xl font-bold uppercase text-white tracking-tight">
                    Automatic Results Sync & Scoring Engine
                  </h3>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  Connects to the sports fixtures engine, matches final scores for completed games, and deterministically auto-grades every pending pick into WON / LOST / VOID.
                </p>
              </div>

              <button
                onClick={handleSyncScores}
                disabled={syncing}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950 shrink-0 cursor-pointer active:scale-98"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching Live Scores & Auto-Grading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Fetch Live Scores & Run Auto-Grading
                  </>
                )}
              </button>
            </div>

            {/* Sync Results Feedback */}
            {syncLog && (
              <div className="mt-4 p-4 rounded-xl bg-[#0b0c13] border border-purple-500/30 text-xs space-y-2 animate-in fade-in">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {syncLog.message || "Sync execution finished"}
                </div>
                {syncLog.result?.details && syncLog.result.details.length > 0 && (
                  <div className="space-y-1 pt-1 font-mono text-[11px] text-slate-300">
                    {syncLog.result.details.map((d: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-purple-400">[{d.outcome}]</span>
                        <span>{d.match}:</span>
                        <span className="text-slate-400">{d.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PREDICTIONS HUB */}
      {activeTab === "predictions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#11131c] border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Filter:</span>
              {["ALL", "PENDING", "WON", "LOST"].map((st) => (
                <button
                  key={st}
                  onClick={() => setPredFilterStatus(st)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    predFilterStatus === st
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveTab("fixtures")}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Pick From Fixtures
            </button>
          </div>

          {/* Predictions Table */}
          <div className="bg-[#11131c] border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#161824] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Match</th>
                  <th className="p-3">Kickoff</th>
                  <th className="p-3">Market & Pick</th>
                  <th className="p-3">Odds</th>
                  <th className="p-3">Status / Score</th>
                  <th className="p-3">Banker / VIP</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <img src={p.home_logo} className="w-4 h-4 object-contain" alt="" />
                        <span>{p.home_team} vs {p.away_team}</span>
                        <img src={p.away_logo} className="w-4 h-4 object-contain" alt="" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">{p.league_name}</span>
                    </td>

                    <td className="p-3 font-mono text-slate-400">
                      {p.date} {p.kickoff_time.slice(11, 16)}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 font-bold text-[11px]">
                        {p.market}: {p.pick}
                      </span>
                    </td>

                    <td className="p-3 font-mono font-bold text-white">
                      {p.odds.toFixed(2)}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {p.status === "WON" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {p.status === "LOST" && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        {p.status === "PENDING" && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        <span className={`font-bold font-mono text-[11px] ${
                          p.status === "WON" ? "text-emerald-400" : p.status === "LOST" ? "text-rose-400" : "text-amber-400"
                        }`}>
                          {p.status}
                        </span>
                        {p.home_score !== null && (
                          <span className="text-slate-400 font-mono">({p.home_score}-{p.away_score})</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleBanker(p)}
                          className={`p-1 rounded cursor-pointer ${
                            p.is_banker ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "text-slate-600 hover:text-slate-400"
                          }`}
                          title="Toggle Banker of the Day"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleVip(p)}
                          className={`p-1 rounded cursor-pointer ${
                            p.is_vip ? "bg-purple-500/20 text-purple-400 border border-purple-500/40" : "text-slate-600 hover:text-slate-400"
                          }`}
                          title="Toggle VIP Exclusive"
                        >
                          <Crown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setShowScoreModal(p);
                            setScoreData({
                              home_score: p.home_score !== null ? String(p.home_score) : "",
                              away_score: p.away_score !== null ? String(p.away_score) : "",
                              status: p.status,
                            });
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 cursor-pointer"
                        >
                          Grade / Score
                        </button>
                        <button
                          onClick={() => handleDeletePrediction(p.id)}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FIXTURES IMPORTER */}
      {activeTab === "fixtures" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-[#11131c] border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase">Select Fixtures Date:</span>
              <input
                type="date"
                value={fixtureDate}
                onChange={(e) => {
                  setFixtureDate(e.target.value);
                  fetchFixtures(e.target.value);
                }}
                className="bg-[#161824] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
              />
            </div>

            <button
              onClick={() => fetchFixtures(fixtureDate)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* Fixtures List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fixtures.map((f) => (
              <div
                key={f.id}
                className="bg-[#11131c] border border-slate-800 hover:border-purple-500/40 rounded-xl p-4 flex items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-semibold text-purple-300">{f.league_name}</span>
                    <span>•</span>
                    <span className="font-mono">{f.kickoff_time.slice(11, 16)} UTC</span>
                  </div>

                  <div className="flex items-center gap-2 font-display text-base font-bold text-white truncate">
                    <img src={f.home_logo} className="w-5 h-5 object-contain" alt="" />
                    <span>{f.home_team} vs {f.away_team}</span>
                    <img src={f.away_logo} className="w-5 h-5 object-contain" alt="" />
                  </div>
                </div>

                <button
                  onClick={() => handleSelectFixtureToCreate(f)}
                  className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-display text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer shadow-sm"
                >
                  Create Tip
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIBERS & PAYMENTS */}
      {activeTab === "subscribers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#11131c] border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="font-display font-bold text-white uppercase text-base">
                VIP Subscribers & PayHero Transactions
              </h3>
              <p className="text-xs text-slate-400">
                Automated M-Pesa STK receipts, access expiration dates, and manual VIP grants
              </p>
            </div>

            <button
              onClick={() => setShowGrantVipModal(true)}
              className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              Manual VIP Grant
            </button>
          </div>

          <div className="bg-[#11131c] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400">
              Transactions and active subscriptions are updated in real-time via PayHero Webhooks (`/api/webhooks/payhero`).
            </p>
          </div>
        </div>
      )}

      {/* TAB 5: API SETTINGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-[#11131c] border border-slate-800 rounded-xl p-6 space-y-4 max-w-xl">
          <h3 className="font-display font-bold text-white uppercase text-base mb-1">
            Sports Data API & PayHero Credentials
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Configure live production API keys. If left unset, the system runs with authentic cached datasets and sandbox simulation mode.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-400 block">
              Football-Data.org API Token
            </label>
            <input
              type="text"
              placeholder="e.g. 847d92..."
              value={footballApiKey}
              onChange={(e) => setFootballApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-400 block">
              PayHero Channel ID
            </label>
            <input
              type="text"
              placeholder="e.g. 1234"
              value={payheroChannel}
              onChange={(e) => setPayheroChannel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-400 block">
              PayHero API Key / Authorization Header
            </label>
            <input
              type="password"
              placeholder="Basic base64... or Bearer token"
              value={payheroKey}
              onChange={(e) => setPayheroKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Save API Configurations
          </button>
        </form>
      )}

      {/* MODAL: CREATE PREDICTION FROM FIXTURE */}
      {showCreateModal && selectedFixture && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#12141f] border border-purple-500/40 rounded-2xl max-w-lg w-full p-6 text-slate-200 relative shadow-2xl my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-black text-xl text-white uppercase mb-1">
              Publish Prediction
            </h3>
            <p className="text-xs text-purple-300 font-semibold mb-4">
              {selectedFixture.home_team} vs {selectedFixture.away_team} ({selectedFixture.league_name})
            </p>

            <form onSubmit={handleCreatePrediction} className="space-y-4">
              {/* Market */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Prediction Market
                </label>
                <select
                  value={formData.market}
                  onChange={(e) => {
                    const m = e.target.value;
                    const picks = getPicksForMarket(m);
                    setFormData({ ...formData, market: m, pick: picks[0]?.value || "1" });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white"
                >
                  <option value="1X2">1X2 (Full Time Result)</option>
                  <option value="DOUBLE_CHANCE">Double Chance</option>
                  <option value="OVER_UNDER">Over/Under Goals</option>
                  <option value="BTTS">Both Teams To Score (BTTS)</option>
                </select>
              </div>

              {/* Pick */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Selected Pick
                </label>
                <select
                  value={formData.pick}
                  onChange={(e) => setFormData({ ...formData, pick: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white"
                >
                  {getPicksForMarket(formData.market).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Odds & Confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Bookmaker Odds
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.odds}
                    onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Confidence %
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="99"
                    value={formData.confidence}
                    onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Analysis */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Tactical Memo & Rationale
                </label>
                <textarea
                  rows={3}
                  value={formData.analysis}
                  onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#161824] border border-slate-800">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_banker}
                    onChange={(e) => setFormData({ ...formData, is_banker: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  Banker of the Day
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-purple-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_vip}
                    onChange={(e) => setFormData({ ...formData, is_vip: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  VIP Exclusive
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Publish Prediction to Live Board
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL SCORE OVERRIDE & GRADING */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141f] border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-slate-200 relative shadow-2xl">
            <button
              onClick={() => setShowScoreModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-lg text-white uppercase mb-1">
              Score & Result Grading
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {showScoreModal.home_team} vs {showScoreModal.away_team}
              <br />
              Pick: <strong className="text-purple-300">{showScoreModal.market} - {showScoreModal.pick}</strong>
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Home Score
                  </label>
                  <input
                    type="number"
                    value={scoreData.home_score}
                    onChange={(e) => setScoreData({ ...scoreData, home_score: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-white text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Away Score
                  </label>
                  <input
                    type="number"
                    value={scoreData.away_score}
                    onChange={(e) => setScoreData({ ...scoreData, away_score: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-white text-center font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Manual Status Override (Optional)
                </label>
                <select
                  value={scoreData.status}
                  onChange={(e) => setScoreData({ ...scoreData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white"
                >
                  <option value="">Auto-Calculate based on Score</option>
                  <option value="WON">Force WON</option>
                  <option value="LOST">Force LOST</option>
                  <option value="VOID">Force VOID (Postponed/Cancelled)</option>
                  <option value="PENDING">Reset to PENDING</option>
                </select>
              </div>

              <button
                onClick={handleSaveScore}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Apply Score & Auto-Grade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GRANT MANUAL VIP */}
      {showGrantVipModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141f] border border-purple-500/40 rounded-2xl max-w-sm w-full p-6 text-slate-200 relative shadow-2xl">
            <button
              onClick={() => setShowGrantVipModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-lg text-white uppercase mb-1">
              Grant VIP Pass
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Manually activate VIP access for any M-Pesa phone number
            </p>

            <form onSubmit={handleGrantVip} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="0712345678"
                  value={grantPhone}
                  onChange={(e) => setGrantPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Access Duration (Days)
                </label>
                <select
                  value={grantDays}
                  onChange={(e) => setGrantDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#161824] border border-slate-700 text-xs text-white"
                >
                  <option value="1">1 Day (Daily)</option>
                  <option value="7">7 Days (Weekly)</option>
                  <option value="30">30 Days (Monthly)</option>
                  <option value="365">365 Days (Annual VIP)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Grant Access
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
