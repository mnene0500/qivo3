
import { supabase } from '@/lib/supabase';

/**
 * @fileOverview Shared Business Logic for PesaPal fulfillment.
 * Direct PesaPal status verification via Edge Function.
 */

export async function processFulfillment(orderTrackingId: string, user_uid: string) {
  try {
    console.log(`[PaymentService] Verifying order ${orderTrackingId} for user ${user_uid}`);
    
    const { data, error } = await supabase.functions.invoke('payment-ops', {
      body: { 
        action: 'fulfill',
        orderTrackingId,
        user_uid
      }
    });

    if (error) {
      console.error(`[PaymentService Error] Verification failed:`, error.message);
      return { success: false, error: error.message };
    }
    
    return data || { success: false, error: "Verification response empty." };
  } catch (err: any) { 
    console.error(`[PaymentService Crash] Order ${orderTrackingId}:`, err);
    return { success: false, error: err.message || "Critical verification failure." }; 
  }
}
