import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activateSubscription } from "@/lib/payhero";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const phone = searchParams.get("phone");

  if (!reference && !phone) {
    return NextResponse.json({ error: "Reference or phone required" }, { status: 400 });
  }

  let sub: any = null;
  if (reference) {
    sub = db.prepare("SELECT * FROM subscriptions WHERE payhero_reference = ?").get(reference);
  } else if (phone) {
    sub = db.prepare(`
      SELECT * FROM subscriptions 
      WHERE phone LIKE ? AND status = 'ACTIVE' AND expires_at > ?
      ORDER BY expires_at DESC LIMIT 1
    `).get(`%${phone.slice(-9)}%`, new Date().toISOString());
  }

  if (!sub) {
    return NextResponse.json({ active: false, status: "NOT_FOUND" });
  }

  const isActive = sub.status === "ACTIVE" && (!sub.expires_at || new Date(sub.expires_at) > new Date());

  const response = NextResponse.json({
    active: isActive,
    status: sub.status,
    subscription: {
      id: sub.id,
      plan: sub.plan,
      amount: sub.amount,
      expires_at: sub.expires_at,
      reference: sub.payhero_reference,
    },
  });

  if (isActive) {
    response.cookies.set({
      name: "apex_vip_token",
      value: sub.id,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }

  return response;
}

// Sandbox confirmation endpoint for demonstration
export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    const activation = activateSubscription(reference);
    if (!activation.success) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      message: "VIP Subscription successfully activated!",
      expiresAt: activation.expiresAt,
    });

    response.cookies.set({
      name: "apex_vip_token",
      value: reference,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
