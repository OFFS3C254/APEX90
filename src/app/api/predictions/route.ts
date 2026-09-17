import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedInitialData } from "@/lib/seed";

export async function GET(req: NextRequest) {
  try {
    await seedInitialData();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const market = searchParams.get("market");
    const isVip = searchParams.get("is_vip");

    let query = "SELECT * FROM predictions WHERE published = 1 AND date = ?";
    const params: any[] = [date];

    if (market && market !== "ALL") {
      query += " AND market = ?";
      params.push(market);
    }

    if (isVip !== null && isVip !== undefined && isVip !== "") {
      query += " AND is_vip = ?";
      params.push(parseInt(isVip, 10));
    }

    query += " ORDER BY is_banker DESC, kickoff_time ASC";

    const rows = db.prepare(query).all(...params) as any[];

    // Banker pick of the day (if any)
    const banker = rows.find((p) => p.is_banker === 1) || null;

    return NextResponse.json({
      success: true,
      date,
      count: rows.length,
      banker,
      predictions: rows,
    });
  } catch (error: any) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
