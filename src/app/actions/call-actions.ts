
'use server';

import { supabase } from '@/lib/supabase';

/**
 * @fileOverview Native Calling Actions.
 * These handle balance validation and per-minute billing directly on Vercel.
 */

export async function checkCallBalanceAction(uid: string, type: 'video' | 'voice') {
  try {
    // Admins and Coin Sellers call for free
    const { data: user } = await supabase.from('users').select('is_admin, is_coin_seller').eq('uid', uid).single();
    if (user?.is_admin || user?.is_coin_seller) return { success: true };

    const { data: bal } = await supabase.from('balances').select('coins').eq('user_id', uid).single();
    const cost = type === 'video' ? 150 : 70;

    if ((bal?.coins || 0) < cost) {
      return { success: false, error: "Insufficient coins for next minute." };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Balance service error." };
  }
}

export async function deductCallCoinsAction(uid: string, type: 'video' | 'voice', partnerId: string, partnerName: string) {
  try {
    const { data: user } = await supabase.from('users').select('is_admin, is_coin_seller, gender, name').eq('uid', uid).single();
    
    // Waiver for Admins/Merchants
    if (user?.is_admin || user?.is_coin_seller) return { success: true };

    const cost = type === 'video' ? 150 : 70;
    const ts = Date.now();

    // 1. Deduct Caller
    const { error: deductError } = await supabase.rpc("increment_coins", { user_uid: uid, amount: -cost });
    if (deductError) throw deductError;

    // 2. Log Caller History
    await supabase.from("coin_history").insert({
      user_id: uid,
      amount: -cost,
      type: "call_cost",
      description: `${type.toUpperCase()} Call Minute`,
      timestamp: ts
    });

    // 3. Handle Recipient Earning (Male calls Female -> Female earns 50 Diamonds)
    const { data: recipient } = await supabase.from('users').select('gender').eq('uid', partnerId).single();

    if (user?.gender === 'male' && recipient?.gender === 'female') {
      await supabase.rpc("increment_diamonds", { user_id: partnerId, amount: 50 });
      await supabase.from("diamond_history").insert({
        user_id: partnerId,
        amount: 50,
        type: "call_earning",
        description: `Call from ${user?.name || 'User'}`,
        timestamp: ts
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Call Billing Error]", error.message);
    return { success: false, error: error.message };
  }
}
