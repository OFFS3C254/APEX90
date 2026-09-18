import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const predictionId = searchParams.get("prediction_id");

  if (!predictionId) {
    return NextResponse.json({ error: "prediction_id required" }, { status: 400 });
  }

  const votes = db.prepare(`
    SELECT vote, count(*) as count 
    FROM community_votes 
    WHERE prediction_id = ? 
    GROUP BY vote
  `).all(predictionId) as any[];

  let homeVotes = 0;
  let drawVotes = 0;
  let awayVotes = 0;

  for (const v of votes) {
    if (v.vote === "1") homeVotes = v.count;
    else if (v.vote === "X") drawVotes = v.count;
    else if (v.vote === "2") awayVotes = v.count;
  }

  // Base seed to give realistic public sentiment even on fresh picks
  const baseHome = homeVotes + 65;
  const baseDraw = drawVotes + 18;
  const baseAway = awayVotes + 24;
  const total = baseHome + baseDraw + baseAway;

  const homePct = Math.round((baseHome / total) * 100);
  const drawPct = Math.round((baseDraw / total) * 100);
  const awayPct = 100 - homePct - drawPct;

  return NextResponse.json({
    predictionId,
    totalVotes: total,
    homePct,
    drawPct,
    awayPct,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { prediction_id, vote, voter_hash } = await req.json();

    if (!prediction_id || !vote || !voter_hash) {
      return NextResponse.json({ error: "Missing required vote parameters" }, { status: 400 });
    }

    if (!["1", "X", "2"].includes(vote)) {
      return NextResponse.json({ error: "Invalid vote option. Must be 1, X, or 2." }, { status: 400 });
    }

    db.prepare(`
      INSERT INTO community_votes (prediction_id, vote, voter_hash, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(prediction_id, voter_hash) DO UPDATE SET vote = excluded.vote, created_at = excluded.created_at
    `).run(prediction_id, vote, voter_hash, new Date().toISOString());

    // Return updated tally
    const votes = db.prepare(`
      SELECT vote, count(*) as count 
      FROM community_votes 
      WHERE prediction_id = ? 
      GROUP BY vote
    `).all(prediction_id) as any[];

    let homeVotes = 0;
    let drawVotes = 0;
    let awayVotes = 0;

    for (const v of votes) {
      if (v.vote === "1") homeVotes = v.count;
      else if (v.vote === "X") drawVotes = v.count;
      else if (v.vote === "2") awayVotes = v.count;
    }

    const baseHome = homeVotes + 65;
    const baseDraw = drawVotes + 18;
    const baseAway = awayVotes + 24;
    const total = baseHome + baseDraw + baseAway;

    const homePct = Math.round((baseHome / total) * 100);
    const drawPct = Math.round((baseDraw / total) * 100);
    const awayPct = 100 - homePct - drawPct;

    return NextResponse.json({
      success: true,
      userVote: vote,
      totalVotes: total,
      homePct,
      drawPct,
      awayPct,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
