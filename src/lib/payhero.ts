import { db } from "./db";

export interface VIPPlan {
  id: "daily" | "weekly" | "monthly";
  name: string;
  durationDays: number;
  priceKes: number;
  priceUsd: number;
  badge?: string;
  features: string[];
}

export const VIP_PLANS: Record<string, VIPPlan> = {
  daily: {
    id: "daily",
    name: "Daily VIP Pass",
    durationDays: 1,
    priceKes: 350,
    priceUsd: 3.5,
    features: [
      "Full access to all VIP picks today",
      "Banker of the Day pro breakdown",
      "High odds accumulators (10.0+ odds)",
      "Instant push notification alerts",
    ],
  },
  weekly: {
    id: "weekly",
    name: "7-Day Pro Access",
    durationDays: 7,
    priceKes: 1500,
    priceUsd: 14.0,
    badge: "Most Popular",
    features: [
      "7 days unrestricted VIP access",
      "Daily Banker of the Day (90%+ win rate)",
      "Weekend Mega-Odds specials",
      "Exclusive Telegram/WhatsApp VIP channel",
      "Bankroll management guide",
    ],
  },
  monthly: {
    id: "monthly",
    name: "Monthly Elite Club",
    durationDays: 30,
    priceKes: 4500,
    priceUsd: 40.0,
    badge: "Best Value",
    features: [
      "30 days full premium privileges",
      "All daily markets & high-yield bankers",
      "Priority VIP auto-grading alerts",
      "1-on-1 betting strategist consultation",
      "Save over 55% compared to daily",
    ],
  },
};

/**
 * Normalizes Kenyan phone numbers to format 254XXXXXXXXX
 */
export function normalizeKenyanPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("+254")) {
    cleaned = cleaned.slice(1);
  } else if (!cleaned.startsWith("254") && cleaned.length === 9) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

export interface InitiatePaymentParams {
  phone: string;
  planId: "daily" | "weekly" | "monthly";
  callbackUrl?: string;
}

export async function initiatePayHeroPayment(params: InitiatePaymentParams) {
  const { phone, planId } = params;
  const plan = VIP_PLANS[planId];
  if (!plan) throw new Error("Invalid VIP plan selected");

  const normalizedPhone = normalizeKenyanPhone(phone);
  const reference = `VIP-${planId.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date();

  // Create pending subscription record in DB
  const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  db.prepare(`
    INSERT INTO subscriptions (id, phone, amount, plan, status, payhero_reference, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?)
  `).run(
    subId,
    normalizedPhone,
    plan.priceKes,
    plan.id,
    reference,
    now.toISOString(),
    now.toISOString()
  );

  // Retrieve PayHero settings from DB or env
  const channelSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'PAYHERO_CHANNEL_ID'").get() as any;
  const authSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'PAYHERO_API_KEY'").get() as any;

  const channelId = process.env.PAYHERO_CHANNEL_ID || channelSetting?.value;
  const apiKey = process.env.PAYHERO_API_KEY || authSetting?.value;

  // Real PayHero API integration if credentials are configured
  if (channelId && apiKey) {
    try {
      const payload = {
        amount: plan.priceKes,
        phone_number: normalizedPhone,
        channel_id: parseInt(channelId, 10),
        provider: "m-pesa",
        external_reference: reference,
        callback_url: params.callbackUrl || "https://apex90.com/api/webhooks/payhero",
      };

      const res = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey.startsWith("Basic") ? apiKey : `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        db.prepare(`UPDATE subscriptions SET checkout_request_id = ? WHERE id = ?`).run(
          data.CheckoutRequestID || data.reference || reference,
          subId
        );
        return {
          success: true,
          mode: "live",
          reference,
          subId,
          message: "M-Pesa STK push dispatched to your phone. Enter PIN to complete.",
        };
      }
    } catch (err) {
      console.error("PayHero API request failed:", err);
    }
  }

  // Sandbox / Simulation Mode (fully functional for testing without live M-Pesa debit)
  return {
    success: true,
    mode: "sandbox",
    reference,
    subId,
    message: "Test Mode: STK push simulated. You can confirm instantly.",
  };
}

/**
 * Activates a subscription upon successful payment
 */
export function activateSubscription(reference: string): { success: boolean; expiresAt?: string } {
  const sub = db.prepare("SELECT * FROM subscriptions WHERE payhero_reference = ?").get(reference) as any;
  if (!sub) {
    return { success: false };
  }

  const plan = VIP_PLANS[sub.plan] || VIP_PLANS.daily;
  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + plan.durationDays);
  const expiresAt = expiresDate.toISOString();

  db.prepare(`
    UPDATE subscriptions
    SET status = 'ACTIVE', expires_at = ?, updated_at = ?
    WHERE payhero_reference = ?
  `).run(expiresAt, new Date().toISOString(), reference);

  return { success: true, expiresAt };
}

/**
 * Checks if a phone number or session has active VIP access
 */
export function checkVIPAccess(phoneOrId?: string | null): boolean {
  if (!phoneOrId) return false;
  const normalized = normalizeKenyanPhone(phoneOrId);
  const sub = db.prepare(`
    SELECT * FROM subscriptions 
    WHERE (phone = ? OR id = ? OR payhero_reference = ?) 
      AND status = 'ACTIVE' 
      AND expires_at > ?
    ORDER BY expires_at DESC 
    LIMIT 1
  `).get(normalized, phoneOrId, phoneOrId, new Date().toISOString()) as any;

  return !!sub;
}
