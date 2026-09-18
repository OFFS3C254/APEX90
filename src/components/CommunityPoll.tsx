"use client";

import { useEffect, useState } from "react";
import { Users, Check, ThumbsUp } from "lucide-react";

interface CommunityPollProps {
  predictionId: string;
  homeTeam: string;
  awayTeam: string;
}

export default function CommunityPoll({ predictionId, homeTeam, awayTeam }: CommunityPollProps) {
  const [poll, setPoll] = useState<{
    homePct: number;
    drawPct: number;
    awayPct: number;
    totalVotes: number;
  }>({
    homePct: 62,
    drawPct: 20,
    awayPct: 18,
    totalVotes: 142,
  });

  const [userVote, setUserVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    // Check if user already voted in this browser
    const stored = localStorage.getItem(`apex_vote_${predictionId}`);
    if (stored) {
      setUserVote(stored);
    }

    // Fetch live votes
    fetch(`/api/predictions/vote?prediction_id=${predictionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.totalVotes) {
          setPoll(data);
        }
      })
      .catch(() => {});
  }, [predictionId]);

  const handleVote = async (vote: "1" | "X" | "2") => {
    if (userVote || voting) return;
    setVoting(true);

    let voterHash = localStorage.getItem("apex_voter_id");
    if (!voterHash) {
      voterHash = "voter_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("apex_voter_id", voterHash);
    }

    try {
      const res = await fetch("/api/predictions/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prediction_id: predictionId,
          vote,
          voter_hash: voterHash,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUserVote(vote);
        localStorage.setItem(`apex_vote_${predictionId}`, vote);
        setPoll({
          homePct: data.homePct,
          drawPct: data.drawPct,
          awayPct: data.awayPct,
          totalVotes: data.totalVotes,
        });
      }
    } catch (e) {
      console.error("Voting failed:", e);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="mt-3 p-3 rounded-xl bg-[#0e1017] border border-slate-800/80 space-y-2 text-xs">
      <div className="flex items-center justify-between text-slate-400">
        <span className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 text-slate-300">
          <Users className="w-3.5 h-3.5 text-purple-400" />
          Community Prediction Poll
        </span>
        <span className="text-[10px] font-mono text-slate-500">
          {poll.totalVotes} votes
        </span>
      </div>

      {/* Voting Buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "1 (Home)", value: "1", pct: poll.homePct, team: homeTeam },
          { label: "X (Draw)", value: "X", pct: poll.drawPct, team: "Draw" },
          { label: "2 (Away)", value: "2", pct: poll.awayPct, team: awayTeam },
        ].map((item) => {
          const isSelected = userVote === item.value;
          return (
            <button
              key={item.value}
              type="button"
              disabled={!!userVote || voting}
              onClick={() => handleVote(item.value as any)}
              className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-purple-600 text-white font-bold ring-1 ring-purple-400"
                  : userVote
                  ? "bg-[#141622] text-slate-400 opacity-80"
                  : "bg-[#161824] hover:bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <div className="text-[10px] font-bold truncate block">{item.label}</div>
              <div className="font-mono font-black text-xs text-purple-300">{item.pct}%</div>
            </button>
          );
        })}
      </div>

      {/* Visual Sentiment Bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-800">
        <div style={{ width: `${poll.homePct}%` }} className="bg-emerald-500 transition-all duration-500" title={`Home ${poll.homePct}%`} />
        <div style={{ width: `${poll.drawPct}%` }} className="bg-amber-500 transition-all duration-500" title={`Draw ${poll.drawPct}%`} />
        <div style={{ width: `${poll.awayPct}%` }} className="bg-purple-500 transition-all duration-500" title={`Away ${poll.awayPct}%`} />
      </div>
    </div>
  );
}
