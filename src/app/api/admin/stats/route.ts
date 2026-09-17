import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalPredictions = (db.prepare("SELECT count(*) as c FROM predictions").get() as any)?.c || 0;
    const pendingGrading = (db.prepare("SELECT count(*) as c FROM predictions WHERE status = 'PENDING'").get() as any)?.c || 0;
    const wonCount = (db.prepare("SELECT count(*) as c FROM predictions WHERE status = 'WON'").get() as any)?.c || 0;
    const lostCount = (db.prepare("SELECT count(*) as c FROM predictions WHERE status = 'LOST'").get() as any)?.c || 0;

    const decisive = wonCount + lostCount;
    const winRate = decisive > 0 ? Math.round((wonCount / decisive) * 1000) / 10 : 0;

    const activeSubs = (db.prepare(`
      SELECT count(*) as c FROM subscriptions 
      WHERE status = 'ACTIVE' AND (expires_at IS NULL OR expires_at > ?)
    `).get(new Date().toISOString()) as any)?.c || 0;

    const totalRevenue = (db.prepare("SELECT sum(amount) as s FROM subscriptions WHERE status = 'ACTIVE'").get() as any)?.s || 0;

    const recentSubs = db.prepare("SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 10").all();

    // Check system settings
    const sportsApiKey = db.prepare("SELECT value FROM system_settings WHERE key = 'FOOTBALL_DATA_API_KEY'").get() as any;
    const payheroChannel = db.prepare("SELECT value FROM system_settings WHERE key = 'PAYHERO_CHANNEL_ID'").get() as any;

    return NextResponse.json({
      success: true,
      stats: {
        totalPredictions,
        pendingGrading,
        wonCount,
        lostCount,
        winRate,
        activeSubs,
        totalRevenueKes: totalRevenue,
        totalRevenueUsd: Math.round(totalRevenue / 130),
      },
      recentSubs,
      integrations: {
        sportsApiConfigured: !!(process.env.FOOTBALL_DATA_API_KEY || sportsApiKey?.value),
        payheroConfigured: !!(process.env.PAYHERO_CHANNEL_ID || payheroChannel?.value),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
