import { NextRequest, NextResponse } from "next/server";
import { broadcastPushNotification } from "@/lib/pushNotifications";
import { broadcastPredictionToTelegram } from "@/lib/telegram";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bodyData = await req.json();
    const { type = "PUSH", prediction_id, title, body, url } = bodyData;

    if (type === "TELEGRAM" && prediction_id) {
      const pred = db.prepare("SELECT * FROM predictions WHERE id = ?").get(prediction_id) as any;
      if (!pred) {
        return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
      }
      const tgResult = await broadcastPredictionToTelegram({
        home_team: pred.home_team,
        away_team: pred.away_team,
        league_name: pred.league_name,
        kickoff_time: pred.kickoff_time,
        market: pred.market,
        pick: pred.pick,
        odds: pred.odds,
        confidence: pred.confidence,
        analysis: pred.analysis,
        is_banker: pred.is_banker,
        is_vip: pred.is_vip,
        booking_code: pred.booking_code,
      });
      return NextResponse.json(tgResult);
    }

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body required" }, { status: 400 });
    }

    const result = await broadcastPushNotification({
      title,
      body,
      url: url || "/",
    });

    return NextResponse.json({ success: true, result, sent: result.sent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
