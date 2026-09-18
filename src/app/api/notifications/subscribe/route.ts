import { NextRequest, NextResponse } from "next/server";
import { savePushSubscription } from "@/lib/pushNotifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.endpoint || !body.keys) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const res = savePushSubscription(body);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
