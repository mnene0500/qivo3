'use server';

import { supabase } from '@/lib/supabase';

/**
 * @fileOverview Production Payment Actions.
 * Matches the Edge Function logic provided by the user (initiate / fulfill).
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
      console.error("[Payment Error] Edge Function:", error);
      return { success: false, error: "Network error calling payment service." };
    }

    if (!data.success) {
      return { success: false, error: data.error || "Payment provider rejected request." };
    }

    return data;
  } catch (err: any) { 
    console.error("[Payment Crash] Exception:", err);
    return { success: false, error: "Payment system critical failure." }; 
  }
}

export async function verifyPaymentAction(orderTrackingId: string, user_uid: string) {
  try {
    // Note: Calling 'fulfill' to match the user's Edge Function code
    const { data, error } = await supabase.functions.invoke('payment-ops', {
      body: { 
        action: 'fulfill',
        orderTrackingId,
        user_uid
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }
    
    return data || { success: false, error: "Empty verification response." };
  } catch (err: any) { 
    return { success: false, error: "Internal verification crash." }; 
  }
}
