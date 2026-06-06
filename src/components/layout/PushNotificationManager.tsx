"use client"

import { useEffect } from "react"
import { useUser } from "@/firebase/auth/use-user"
import { savePushSubscriptionAction } from "@/app/actions/matchflow-actions"

/**
 * @fileOverview Manages PWA Web Push subscriptions and permissions.
 * Explicitly requests notification access on mount.
 */
export function PushNotificationManager() {
  const { user } = useUser()

  useEffect(() => {
    // Only run if user is logged in and browser supports push
    if (!user?.id || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    const initPush = async () => {
      try {
        // 1. Request Permission explicitly
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
          console.warn("[Push Manager]: Permission denied by user.");
          return;
        }

        // 2. Wait for Service Worker registration (from layout.tsx)
        const registration = await navigator.serviceWorker.ready;
        
        // 3. Get/Create Subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("[Push Manager]: Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
          return;
        }

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
        }

        // 4. Update Server
        const subJson = subscription.toJSON();
        if (subJson.endpoint) {
          await savePushSubscriptionAction(user.id, subJson.endpoint, subJson);
          console.log("[Push Manager]: Subscription synced with server.");
        }
      } catch (err) {
        console.error("[Push Manager]: Initialization failed:", err);
      }
    }

    initPush();
  }, [user?.id]);

  return null
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
