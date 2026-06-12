
"use client"

import { useEffect } from "react"
import { useUser } from "@/firebase/auth/use-user"
import { savePushSubscriptionAction } from "@/app/actions/matchflow-actions"

/**
 * @fileOverview Manages PWA Web Push subscriptions and permissions.
 * Optimized: Explicitly handles permission lifecycle and background registration.
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
        // 1. Check/Request Permission
        if (Notification.permission === 'default') {
          console.log("[Push Manager]: Requesting permission...");
          await Notification.requestPermission();
        }
        
        if (Notification.permission !== 'granted') {
          console.warn("[Push Manager]: Permission denied. Notifications will not show.");
          return;
        }

        // 2. Wait for Service Worker registration
        const registration = await navigator.serviceWorker.ready;
        console.log("[Push Manager]: Service Worker ready.");
        
        // 3. Get/Create Subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("[Push Manager]: NEXT_PUBLIC_VAPID_PUBLIC_KEY missing in Environment Variables.");
          return;
        }

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          console.log("[Push Manager]: Creating new subscription...");
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
        }

        // 4. Update Server
        const subJson = subscription.toJSON();
        if (subJson.endpoint) {
          await savePushSubscriptionAction(user.id, subJson.endpoint, subJson);
          console.log("[Push Manager]: Subscription synchronized with production database.");
        }
      } catch (err) {
        console.error("[Push Manager]: Registration failed:", err);
      }
    }

    initPush();
  }, [user?.id]);

  return null;
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
