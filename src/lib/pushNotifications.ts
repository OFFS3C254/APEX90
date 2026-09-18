import webpush from "web-push";
import { db } from "./db";

/**
 * Initializes and retrieves VAPID keys from system_settings or env
 */
export function getVapidKeys(): { publicKey: string; privateKey: string } {
  let pubRow = db.prepare("SELECT value FROM system_settings WHERE key = 'VAPID_PUBLIC_KEY'").get() as any;
  let privRow = db.prepare("SELECT value FROM system_settings WHERE key = 'VAPID_PRIVATE_KEY'").get() as any;

  if (!pubRow || !privRow) {
    // Generate new VAPID keypair once
    const vapidKeys = webpush.generateVAPIDKeys();
    const now = new Date().toISOString();

    db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)").run(
      "VAPID_PUBLIC_KEY", vapidKeys.publicKey, now
    );
    db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)").run(
      "VAPID_PRIVATE_KEY", vapidKeys.privateKey, now
    );

    pubRow = { value: vapidKeys.publicKey };
    privRow = { value: vapidKeys.privateKey };
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY || pubRow.value;
  const privateKey = process.env.VAPID_PRIVATE_KEY || privRow.value;

  webpush.setVapidDetails(
    "mailto:alerts@apex90.com",
    publicKey,
    privateKey
  );

  return { publicKey, privateKey };
}

/**
 * Saves a browser push subscription to SQLite
 */
export function savePushSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT OR REPLACE INTO push_subscriptions (id, endpoint, keys_p256dh, keys_auth, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    sub.endpoint,
    sub.keys.p256dh,
    sub.keys.auth,
    new Date().toISOString()
  );
  return { success: true, id };
}

/**
 * Broadcasts a push notification to all subscribed users
 */
export async function broadcastPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}) {
  const { publicKey, privateKey } = getVapidKeys();
  const subs = db.prepare("SELECT * FROM push_subscriptions").all() as any[];

  if (subs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: payload.tag,
    data: {
      url: payload.url || "/",
    },
  });

  let sent = 0;
  let failed = 0;

  for (const s of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: {
            p256dh: s.keys_p256dh,
            auth: s.keys_auth,
          },
        },
        notificationPayload
      );
      sent++;
    } catch (err: any) {
      failed++;
      // If endpoint is expired/unregistered (404 or 410), prune it
      if (err.statusCode === 404 || err.statusCode === 410) {
        db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(s.endpoint);
      }
    }
  }

  return { sent, failed };
}
