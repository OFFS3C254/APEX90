import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const row = db.prepare("SELECT value, updated_at FROM system_settings WHERE key = 'SPORTYBET_DAILY_CODE'").get() as any;
  const descRow = db.prepare("SELECT value FROM system_settings WHERE key = 'SPORTYBET_DAILY_DESC'").get() as any;

  return NextResponse.json({
    success: true,
    code: row?.value || "BC94X2",
    description: descRow?.value || "Today's High-Yield Multi-Bet Accumulator (12.40 Odds)",
    updatedAt: row?.updated_at || new Date().toISOString(),
    bookmaker: "SportyBet",
    directUrl: "https://www.sportybet.com",
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code, description } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Booking code required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('SPORTYBET_DAILY_CODE', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(code.trim().toUpperCase(), now);

    if (description) {
      db.prepare(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('SPORTYBET_DAILY_DESC', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(description.trim(), now);
    }

    return NextResponse.json({ success: true, code: code.trim().toUpperCase() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
