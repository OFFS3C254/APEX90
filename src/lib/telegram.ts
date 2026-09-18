import { db } from "./db";

export function getTelegramConfig() {
  const tokenRow = db.prepare("SELECT value FROM system_settings WHERE key = 'TELEGRAM_BOT_TOKEN'").get() as any;
  const chatRow = db.prepare("SELECT value FROM system_settings WHERE key = 'TELEGRAM_CHANNEL_ID'").get() as any;

  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || tokenRow?.value || "",
    channelId: process.env.TELEGRAM_CHANNEL_ID || chatRow?.value || "",
  };
}

/**
 * Broadcasts a formatted prediction to a Telegram VIP channel or chat
 */
export async function broadcastPredictionToTelegram(prediction: {
  home_team: string;
  away_team: string;
  league_name: string;
  kickoff_time: string;
  market: string;
  pick: string;
  odds: number;
  confidence: number;
  analysis: string;
  is_banker?: boolean | number;
  is_vip?: boolean | number;
  booking_code?: string;
}): Promise<{ success: boolean; message?: string }> {
  const { botToken, channelId } = getTelegramConfig();

  if (!botToken || !channelId) {
    return { success: false, message: "Telegram Bot Token or Channel ID not configured" };
  }

  const isBanker = !!prediction.is_banker;
  const isVip = !!prediction.is_vip;

  const headerBadge = isBanker
    ? "⚡ <b>BANKER OF THE DAY</b> (HIGH CONVICTION)"
    : isVip
    ? "👑 <b>VIP EXCLUSIVE PREDICTION</b>"
    : "⚽ <b>DAILY ODDS INTELLIGENCE</b>";

  const timeFormatted = new Date(prediction.kickoff_time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });

  const messageText = `
${headerBadge}

🏆 <b>${prediction.league_name}</b>
⚔️ <b>${prediction.home_team} vs ${prediction.away_team}</b>
⏰ Kickoff: ${timeFormatted}

🎯 <b>Market:</b> ${prediction.market}
💎 <b>Pick:</b> <code>${prediction.pick}</code>
📈 <b>Odds:</b> <code>${prediction.odds.toFixed(2)}</code>
📊 <b>Confidence:</b> ${prediction.confidence}%
${prediction.booking_code ? `🎟️ <b>SportyBet Code:</b> <code>${prediction.booking_code}</code>` : ""}

📝 <b>Tactical Memo:</b>
<i>${prediction.analysis}</i>

📲 <a href="https://apex90.com">Open in APEX90 PWA App</a>
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text: messageText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { success: false, message: data.description || "Telegram broadcast failed" };
    }

    return { success: true, message: "Broadcasted to Telegram successfully" };
  } catch (err: any) {
    console.error("Telegram broadcast error:", err);
    return { success: false, message: err.message };
  }
}
