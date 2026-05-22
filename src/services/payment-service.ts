import { supabase } from '@/lib/supabase';

/**
 * @fileOverview Fulfillment logic standardized to call 'verify' on payment-ops.
 */

export async function processFulfillment(orderTrackingId: string, user_uid: string) {
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
    
    return data || { success: false, error: "Verification failed." };
  } catch (err: any) { 
    return { success: false, error: err.message }; 
  }
}
