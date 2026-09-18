"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Check, Loader2, Volume2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationBell() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      // Check existing subscription
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            setIsSubscribed(true);
          }
        } catch (e) {
          console.error("Failed to check subscription", e);
        }
      });
    }
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) {
      showToast("Web push is not supported in this browser.");
      return;
    }

    if (Notification.permission === "denied") {
      showToast("Notifications are blocked in your browser settings. Please enable them.");
      return;
    }

    if (isSubscribed) {
      showToast("Push notifications are active! You will get alerts for Bankers, Kickoffs, and Big Wins.");
      return;
    }

    setLoading(true);
    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Notification permission was not granted.");
        setLoading(false);
        return;
      }

      // 2. Fetch VAPID public key
      const vapidRes = await fetch("/api/notifications/vapid-key");
      const vapidData = await vapidRes.json();
      if (!vapidData.publicKey) {
        throw new Error("Could not retrieve VAPID key");
      }

      // 3. Register service worker if not already
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // 4. Subscribe
      const convertedKey = urlBase64ToUint8Array(vapidData.publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      // 5. Send subscription to server
      const saveRes = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (saveRes.ok) {
        setIsSubscribed(true);
        showToast("✅ Push alerts activated! You'll receive instant Banker & Kickoff notifications.");
      } else {
        throw new Error("Failed to store subscription on server");
      }
    } catch (err: any) {
      console.error("Subscription failed:", err);
      showToast(err.message || "Failed to subscribe to push alerts.");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="relative">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isSubscribed
            ? "bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
            : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
        }`}
        title={isSubscribed ? "Push Notifications Active" : "Enable Push Notifications"}
        aria-label="Toggle Push Notifications"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
        ) : isSubscribed ? (
          <>
            <BellRing className="w-4 h-4 text-purple-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#090A0F] animate-pulse" />
          </>
        ) : (
          <Bell className="w-4 h-4" />
        )}
      </button>

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="absolute top-12 right-0 z-50 w-72 p-3 rounded-xl bg-[#12141f] border border-purple-500/50 text-xs text-slate-200 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="font-medium leading-snug">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
