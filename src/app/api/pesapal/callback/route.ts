import { NextResponse } from 'next/server';
import { getTransactionStatus } from '@/app/actions/payment-actions';
import { initializeFirebase } from '@/firebase';
import { ref, update, increment, push, set, get } from 'firebase/database';

/**
 * @fileOverview Webhook for PesaPal payment notifications.
 * Automatically fulfills coin orders upon successful payment verification.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // PesaPal v3 can use mixed casing or specific casing depending on configuration
  const orderTrackingId = searchParams.get('OrderTrackingId') || searchParams.get('orderTrackingId');
  const merchantReference = searchParams.get('OrderMerchantReference') || searchParams.get('orderMerchantReference');

  console.log(`[PesaPal IPN] Received notification. Tracking ID: ${orderTrackingId}, Reference: ${merchantReference}`);

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.json({ status: 'Invalid Request', message: 'Missing parameters' }, { status: 400 });
  }

  try {
    const status = await getTransactionStatus(orderTrackingId);
    
    // Status Code 1 = Completed/Success
    if (status && (Number(status.status_code) === 1)) {
      const { database: rtdb } = initializeFirebase();
      
      // Reference format: QV_{uid}_{timestamp}
      const parts = merchantReference.split('_');
      const uid = parts[1];
      const amount = Number(status.amount); // Ensure numeric comparison

      if (!uid) {
        console.error(`[PesaPal IPN] Failed to extract UID from reference: ${merchantReference}`);
        throw new Error("Could not extract UID from reference");
      }

      const processedRef = ref(rtdb, `processed_payments/${orderTrackingId}`);
      const alreadyProcessed = await get(processedRef);
      
      if (alreadyProcessed.exists()) {
        console.log(`[PesaPal IPN] Transaction ${orderTrackingId} already processed. Skipping.`);
        return NextResponse.json({ OrderTrackingId: orderTrackingId, status: 'Already Processed' });
      }

      // Coin Award Thresholds (Matching Recharge Page Packages)
      let coinsToAward = 0;
      if (amount >= 1800) coinsToAward = 20000;
      else if (amount >= 1000) coinsToAward = 10000;
      else if (amount >= 550) coinsToAward = 5000;
      else if (amount >= 230) coinsToAward = 2000;
      else if (amount >= 120) coinsToAward = 1000;
      else if (amount >= 80) coinsToAward = 500;
      else if (amount >= 1) coinsToAward = 200; // Test Package (KES 1)

      if (coinsToAward > 0) {
        const timestamp = Date.now();
        
        // Atomically update user balance
        await update(ref(rtdb, `balances/${uid}`), {
          coins: increment(coinsToAward),
          updatedAt: timestamp
        });

        // Log to user's coin history
        await set(push(ref(rtdb, `coin_history/${uid}`)), {
          amount: coinsToAward,
          type: 'recharge',
          description: `PesaPal: KES ${amount}`,
          timestamp
        });

        // Mark as processed to prevent double-spend
        await set(processedRef, {
          uid,
          amount,
          coins: coinsToAward,
          timestamp,
          payment_method: status.payment_method || 'unknown'
        });

        console.log(`[PesaPal IPN] SUCCESS: Fulfilled ${coinsToAward} coins for user ${uid}`);
      } else {
        console.warn(`[PesaPal IPN] Transaction status was success but amount ${amount} did not meet any coin package threshold.`);
      }
    } else {
      console.log(`[PesaPal IPN] Transaction ${orderTrackingId} status is not completed (Status: ${status?.status_code})`);
    }

    // Always respond with 200 OK to PesaPal to acknowledge receipt
    return NextResponse.json({
      OrderTrackingId: orderTrackingId,
      status: 'OK'
    });
  } catch (error: any) {
    console.error("[PesaPal IPN Error]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
