import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const isVip = searchParams.get("is_vip");

  let query = "SELECT * FROM predictions WHERE 1=1";
  const params: any[] = [];

  if (date) {
    query += " AND date = ?";
    params.push(date);
  }
  if (status && status !== "ALL") {
    query += " AND status = ?";
    params.push(status);
  }
  if (isVip !== null && isVip !== undefined && isVip !== "") {
    query += " AND is_vip = ?";
    params.push(parseInt(isVip, 10));
  }

  query += " ORDER BY date DESC, kickoff_time ASC";

  const rows = db.prepare(query).all(...params);
  return NextResponse.json({ success: true, count: rows.length, predictions: rows });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      fixture_id,
      league_name,
      league_country,
      league_logo,
      home_team,
      away_team,
      home_logo,
      away_logo,
      kickoff_time,
      date,
      market,
      pick,
      odds,
      confidence,
      analysis,
      is_vip,
      is_banker,
      published = 1,
    } = body;

    if (!home_team || !away_team || !market || !pick || !odds) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = `pred_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const targetDate = date || kickoff_time?.split("T")[0] || now.split("T")[0];

    // If banker is set, unmark any existing banker for this date
    if (is_banker) {
      db.prepare("UPDATE predictions SET is_banker = 0 WHERE date = ?").run(targetDate);
    }

    db.prepare(`
      INSERT INTO predictions (
        id, fixture_id, league_name, league_country, league_logo,
        home_team, away_team, home_logo, away_logo, kickoff_time,
        date, market, pick, odds, confidence, analysis, is_vip,
        is_banker, status, home_score, away_score, match_status, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, NULL, 'NS', ?, ?, ?)
    `).run(
      id,
      fixture_id || `FIX-${Date.now()}`,
      league_name || "Premier League",
      league_country || "England",
      league_logo || "https://crests.football-data.org/PL.png",
      home_team,
      away_team,
      home_logo || "https://crests.football-data.org/57.png",
      away_logo || "https://crests.football-data.org/65.png",
      kickoff_time || `${targetDate}T15:00:00Z`,
      targetDate,
      market,
      pick,
      parseFloat(odds) || 1.80,
      parseInt(confidence, 10) || 80,
      analysis || "Tactical intelligence analysis.",
      is_vip ? 1 : 0,
      is_banker ? 1 : 0,
      published ? 1 : 0,
      now,
      now
    );

    const created = db.prepare("SELECT * FROM predictions WHERE id = ?").get(id);
    return NextResponse.json({ success: true, prediction: created }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create prediction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
