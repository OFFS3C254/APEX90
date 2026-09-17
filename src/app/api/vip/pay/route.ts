import { NextRequest, NextResponse } from "next/server";
import { initiatePayHeroPayment } from "@/lib/payhero";

export async function POST(req: NextRequest) {
  try {
    const { phone, planId } = await req.json();

    if (!phone || !planId) {
      return NextResponse.json(
        { success: false, error: "Phone number and VIP plan are required." },
        { status: 400 }
      );
    }

    const result = await initiatePayHeroPayment({
      phone,
      planId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Payment initiation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
