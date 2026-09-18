import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { gradePrediction } from "@/lib/grading";
import { broadcastPushNotification } from "@/lib/pushNotifications";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = db.prepare("SELECT * FROM predictions WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    const {
      market = existing.market,
      pick = existing.pick,
      odds = existing.odds,
      confidence = existing.confidence,
      analysis = existing.analysis,
      is_vip = existing.is_vip,
      is_banker = existing.is_banker,
      booking_code = existing.booking_code,
      status = existing.status,
      home_score = existing.home_score,
      away_score = existing.away_score,
      match_status = existing.match_status,
      published = existing.published,
      auto_grade = false,
    } = body;

    let finalStatus = status;

    // If auto_grade flag is passed or score changed and status not manually forced, calculate deterministic outcome
    if (auto_grade || (home_score !== null && away_score !== null && body.status === undefined)) {
      const grading = gradePrediction({
        market,
        pick,
        homeScore: home_score !== null ? parseInt(home_score, 10) : null,
        awayScore: away_score !== null ? parseInt(away_score, 10) : null,
        matchStatus: match_status || "FT",
      });
      finalStatus = grading.status;
    }

    // If banker is toggled on, remove banker status from other picks on this date
    if (is_banker && is_banker !== existing.is_banker) {
      db.prepare("UPDATE predictions SET is_banker = 0 WHERE date = ? AND id != ?").run(existing.date, id);
    }

    db.prepare(`
      UPDATE predictions SET
        market = ?,
        pick = ?,
        odds = ?,
        confidence = ?,
        analysis = ?,
        is_vip = ?,
        is_banker = ?,
        booking_code = ?,
        status = ?,
        home_score = ?,
        away_score = ?,
        match_status = ?,
        published = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      market,
      pick,
      parseFloat(odds),
      parseInt(confidence, 10),
      analysis,
      is_vip ? 1 : 0,
      is_banker ? 1 : 0,
      booking_code ? booking_code.trim().toUpperCase() : null,
      finalStatus,
      home_score !== null && home_score !== undefined && home_score !== "" ? parseInt(home_score, 10) : null,
      away_score !== null && away_score !== undefined && away_score !== "" ? parseInt(away_score, 10) : null,
      match_status,
      published ? 1 : 0,
      new Date().toISOString(),
      id
    );

    const updated = db.prepare("SELECT * FROM predictions WHERE id = ?").get(id) as any;

    // If prediction just transitioned to WON, trigger celebration push notification
    if (finalStatus === "WON" && existing.status !== "WON") {
      try {
        await broadcastPushNotification({
          title: `✅ WINNER CONFIRMED! ${existing.home_team} vs ${existing.away_team}`,
          body: `Pick "${pick}" @ ${parseFloat(odds).toFixed(2)} odds landed! Check your sports slip.`,
          url: "/history",
          tag: `win-${id}`,
        });
      } catch (err) {
        console.error("Failed to broadcast win notification:", err);
      }
    }

    return NextResponse.json({ success: true, prediction: updated });
  } catch (error: any) {
    console.error("Failed to update prediction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const info = db.prepare("DELETE FROM predictions WHERE id = ?").run(id);
    if (info.changes === 0) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Prediction deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
