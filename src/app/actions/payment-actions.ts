
'use server';

import { supabase } from '@/lib/supabase';

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
 * Server Action to verify transaction status via Edge Function.
 */
export async function verifyPaymentAction(orderTrackingId: string, user_uid: string) {
  try {
    const { data, error } = await supabase.functions.invoke('payment-ops', {
      body: { 
        action: 'verify',
        orderTrackingId,
        user_uid
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }
    
    return data || { success: false, error: "Verification response empty." };
  } catch (err: any) { 
    return { success: false, error: err.message || "Critical verification failure." }; 
  }
}
