import { NextResponse } from "next/server";
import { getVapidKeys } from "@/lib/pushNotifications";

export async function GET() {
  const { publicKey } = getVapidKeys();
  return NextResponse.json({ publicKey });
}
