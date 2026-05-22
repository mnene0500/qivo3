
'use server';

import { supabase } from '@/lib/supabase';
import { processFulfillment } from '@/services/payment-service';

/**
 * @fileOverview Secure PesaPal Proxies via Supabase Edge Functions.
 */

export async function initiatePesaPalPayment(amount: number, user: { uid: string, email: string, name: string }) {
  try {
    const { data, error } = await supabase.functions.invoke('payment-ops', {
      body: { 
        action: 'initiate',
        amount,
        user
      }
    });

    if (error) {
      console.error("[Payment Error] Edge Function fail:", error);
      return { success: false, error: "Payment gateway connection timeout." };
    }

    return data || { success: false, error: "Empty response from server." };
  } catch (err: any) { 
    console.error("[Payment Crash] Proxy exception:", err);
    return { success: false, error: "Critical payment service failure." }; 
  }
}

/**
 * Server Action wrapper for fulfillment.
 */
export async function fulfillPaymentAction(orderTrackingId: string, user_uid: string) {
  return processFulfillment(orderTrackingId, user_uid);
}
