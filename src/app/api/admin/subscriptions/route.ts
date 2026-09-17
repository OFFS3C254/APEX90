import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = db.prepare("SELECT * FROM subscriptions ORDER BY created_at DESC").all();
  return NextResponse.json({ success: true, count: subscriptions.length, subscriptions });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { phone, plan = "weekly", days = 7 } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const id = `manual_${Date.now()}`;
    const expires = new Date();
    expires.setDate(expires.getDate() + parseInt(days, 10));

    db.prepare(`
      INSERT INTO subscriptions (id, phone, amount, plan, status, payhero_reference, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
    `).run(
      id,
      phone,
      0,
      plan,
      `MANUAL-${Date.now()}`,
      expires.toISOString(),
      new Date().toISOString(),
      new Date().toISOString()
    );

    return NextResponse.json({ success: true, message: `VIP access granted to ${phone} for ${days} days.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
