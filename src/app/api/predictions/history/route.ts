import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedInitialData } from "@/lib/seed";

export async function GET(req: NextRequest) {
  try {
    await seedInitialData();

    const { searchParams } = new URL(req.url);
    const selectedDate = searchParams.get("date");
    const market = searchParams.get("market");
    const status = searchParams.get("status");

    // 1. Fetch historical completed predictions to compute rolling stats
    const allGraded = db.prepare(`
      SELECT * FROM predictions 
      WHERE published = 1 AND status IN ('WON', 'LOST', 'VOID')
      ORDER BY date DESC, kickoff_time DESC
    `).all() as any[];

    const now = new Date();
    const d7Ago = new Date(now); d7Ago.setDate(now.getDate() - 7);
    const d30Ago = new Date(now); d30Ago.setDate(now.getDate() - 30);

    const d7Str = d7Ago.toISOString().split("T")[0];
    const d30Str = d30Ago.toISOString().split("T")[0];

    // Compute win-rates
    const calcWinRate = (items: any[]) => {
      const decisive = items.filter(i => i.status === "WON" || i.status === "LOST");
      if (decisive.length === 0) return 0;
      const won = decisive.filter(i => i.status === "WON").length;
      return Math.round((won / decisive.length) * 1000) / 10; // e.g. 84.5
    };

    const overallAccuracy = calcWinRate(allGraded);

    const last7Items = allGraded.filter(i => i.date >= d7Str);
    const winRateLast7Days = calcWinRate(last7Items);

    const last30Items = allGraded.filter(i => i.date >= d30Str);
    const winRateLast30Days = calcWinRate(last30Items);

    // Compute current win streak
    let currentStreak = 0;
    for (const p of allGraded) {
      if (p.status === "WON") {
        currentStreak++;
      } else if (p.status === "LOST") {
        break; // streak ends
      }
      // VOID does not break the streak
    }

    // Distinct dates available in history
    const distinctDates = db.prepare(`
      SELECT DISTINCT date FROM predictions 
      WHERE published = 1 
      ORDER BY date DESC
    `).all().map((r: any) => r.date);

    // Filter predictions for the requested date or default to yesterday/latest date
    const todayStr = new Date().toISOString().split("T")[0];
    const targetDate = selectedDate || (distinctDates.length > 1 ? distinctDates[1] : (distinctDates[0] || todayStr));

    let query = "SELECT * FROM predictions WHERE published = 1 AND date = ?";
    const params: any[] = [targetDate];

    if (market && market !== "ALL") {
      query += " AND market = ?";
      params.push(market);
    }

    if (status && status !== "ALL") {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY is_banker DESC, kickoff_time ASC";

    const dayPredictions = db.prepare(query).all(...params) as any[];

    // Calculate day summary
    const dayWon = dayPredictions.filter(p => p.status === "WON").length;
    const dayLost = dayPredictions.filter(p => p.status === "LOST").length;
    const dayPending = dayPredictions.filter(p => p.status === "PENDING").length;
    const dayVoid = dayPredictions.filter(p => p.status === "VOID").length;

    return NextResponse.json({
      success: true,
      selectedDate: targetDate,
      availableDates: distinctDates,
      stats: {
        overallAccuracy,
        winRateLast7Days,
        winRateLast30Days,
        currentStreak,
        totalGraded: allGraded.length,
        totalWins: allGraded.filter(i => i.status === "WON").length,
        totalLosses: allGraded.filter(i => i.status === "LOST").length,
      },
      daySummary: {
        total: dayPredictions.length,
        won: dayWon,
        lost: dayLost,
        pending: dayPending,
        void: dayVoid,
        accuracy: calcWinRate(dayPredictions),
      },
      predictions: dayPredictions,
    });
  } catch (error: any) {
    console.error("Error fetching prediction history:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
