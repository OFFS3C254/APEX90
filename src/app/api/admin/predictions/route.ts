import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { broadcastPredictionToTelegram } from "@/lib/telegram";
import { broadcastPushNotification } from "@/lib/pushNotifications";

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
      booking_code,
      broadcast_telegram = false,
      broadcast_push = false,
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
        is_banker, booking_code, status, home_score, away_score, match_status, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, NULL, 'NS', ?, ?, ?)
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
      booking_code ? booking_code.trim().toUpperCase() : null,
      published ? 1 : 0,
      now,
      now
    );

    const created: any = db.prepare("SELECT * FROM predictions WHERE id = ?").get(id);

    // Automated Broadcast Triggers
    let telegramSent = false;
    let pushSent = false;

    // Telegram VIP Broadcast (if flagged or if banker)
    if (broadcast_telegram || is_banker) {
      try {
        const tgRes = await broadcastPredictionToTelegram({
          home_team,
          away_team,
          league_name: league_name || "Football",
          kickoff_time: kickoff_time || `${targetDate}T15:00:00Z`,
          market,
          pick,
          odds: parseFloat(odds) || 1.80,
          confidence: parseInt(confidence, 10) || 80,
          analysis: analysis || "Tactical intelligence memo.",
          is_banker: !!is_banker,
          is_vip: !!is_vip,
          booking_code: booking_code ? booking_code.trim().toUpperCase() : undefined,
        });
        telegramSent = tgRes.success;
      } catch (tgErr) {
        console.error("Telegram broadcast failed:", tgErr);
      }
    }

    // Web Push Notification Broadcast (if flagged or if banker)
    if (broadcast_push || is_banker) {
      try {
        const pushTitle = is_banker
          ? "⚡ BANKER OF THE DAY RELEASED!"
          : is_vip
          ? "👑 NEW VIP TIP PUBLISHED!"
          : `🔥 NEW PICK: ${home_team} vs ${away_team}`;

        const pushBody = `${market}: ${pick} @ ${parseFloat(odds).toFixed(2)} odds. ${
          booking_code ? `SportyBet: ${booking_code}. ` : ""
        }Check tactical intel now!`;

        await broadcastPushNotification({
          title: pushTitle,
          body: pushBody,
          url: "/",
          tag: `pred-${id}`,
        });
        pushSent = true;
      } catch (pushErr) {
        console.error("Push broadcast failed:", pushErr);
      }
    }

    return NextResponse.json({
      success: true,
      prediction: created,
      broadcasts: { telegramSent, pushSent },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create prediction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
