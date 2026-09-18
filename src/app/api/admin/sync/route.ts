import { NextRequest, NextResponse } from "next/server";
import { syncScoresAndAutoGrade } from "@/lib/sportsApi";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { gradePrediction } from "@/lib/grading";
import { broadcastPushNotification } from "@/lib/pushNotifications";

export async function POST(req: NextRequest) {
  // Check either Admin session OR Cron Secret in Authorization header
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "apex90-cron-secret";
  const isCron = authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncScoresAndAutoGrade();

    // Also check if any pending fixture can be graded with cached score
    const pending = db.prepare("SELECT * FROM predictions WHERE status = 'PENDING'").all() as any[];
    const now = new Date().toISOString();

    for (const p of pending) {
      // If fixture is simulated or has score in fixtures_cache
      const fix = db.prepare("SELECT * FROM fixtures_cache WHERE id = ?").get(p.fixture_id) as any;
      if (fix && fix.status === "FT" && fix.home_score !== null && fix.away_score !== null) {
        const grading = gradePrediction({
          market: p.market,
          pick: p.pick,
          homeScore: fix.home_score,
          awayScore: fix.away_score,
          matchStatus: fix.status,
        });

          if (grading.status !== "PENDING") {
          db.prepare(`
            UPDATE predictions 
            SET status = ?, home_score = ?, away_score = ?, match_status = ?, updated_at = ?
            WHERE id = ?
          `).run(grading.status, fix.home_score, fix.away_score, fix.status, now, p.id);
          
          result.graded++;
          result.details.push({
            id: p.id,
            match: `${p.home_team} vs ${p.away_team}`,
            outcome: grading.status,
            reason: grading.reason,
          });

          if (grading.status === "WON") {
            try {
              await broadcastPushNotification({
                title: `✅ MATCH WON! ${p.home_team} vs ${p.away_team}`,
                body: `Pick "${p.pick}" @ ${parseFloat(p.odds).toFixed(2)} landed! Status: FT ${fix.home_score}-${fix.away_score}`,
                url: "/history",
                tag: `win-${p.id}`,
              });
            } catch (err) {
              console.error("Auto-grade push notification failed:", err);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed. Scanned ${result.scanned} pending predictions, automatically graded ${result.graded}.`,
      result,
    });
  } catch (error: any) {
    console.error("Auto-grading sync failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
