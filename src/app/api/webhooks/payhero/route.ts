import { NextRequest, NextResponse } from "next/server";
import { activateSubscription } from "@/lib/payhero";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("PayHero Webhook received:", JSON.stringify(payload));

    // PayHero payload structures can vary between v1/v2 callbacks
    const status = payload.status || payload.response?.Status || (payload.success ? "Success" : null);
    const externalRef =
      payload.external_reference ||
      payload.response?.ExternalReference ||
      payload.reference ||
      payload.CheckoutRequestID;

    if (!externalRef) {
      return NextResponse.json({ error: "No external reference in payload" }, { status: 400 });
    }

    if (status === "Success" || status === "Completed" || status === "SUCCESS") {
      const activation = activateSubscription(externalRef);
      console.log(`Activated subscription for ${externalRef}:`, activation);
      return NextResponse.json({ success: true, message: "Subscription activated" });
    } else {
      console.warn(`Payment not successful for ${externalRef}: ${status}`);
      return NextResponse.json({ success: false, message: "Payment was not successful" });
    }
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
