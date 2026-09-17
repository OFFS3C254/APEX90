import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = db.prepare("SELECT * FROM system_settings").all() as any[];
  const settings: Record<string, string> = {};
  for (const r of rows) {
    // Mask sensitive keys
    if (r.key.includes("SECRET") || r.key.includes("KEY")) {
      settings[r.key] = r.value ? `${r.value.substring(0, 4)}...${r.value.slice(-4)}` : "";
    } else {
      settings[r.key] = r.value;
    }
  }

  return NextResponse.json({
    success: true,
    settings,
    envStatus: {
      hasFootballApiKey: !!process.env.FOOTBALL_DATA_API_KEY,
      hasPayHeroChannel: !!process.env.PAYHERO_CHANNEL_ID,
      hasPayHeroKey: !!process.env.PAYHERO_API_KEY,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const upsert = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "string" && v.trim() !== "") {
        upsert.run(k, v.trim(), new Date().toISOString());
      }
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
