
'use server';

import { supabase } from '@/lib/supabase';

/**
 * @fileOverview Native Calling Economy Logic on Vercel.
 * Handles secure per-minute billing for voice and video calls.
 */

export async function checkCallBalanceAction(uid: string, type: 'video' | 'voice') {
  try {
    const { data: user } = await supabase.from('users').select('is_admin, is_coin_seller').eq('uid', uid).single();
    if (user?.is_admin || user?.is_coin_seller) return { success: true };

    const { data: bal } = await supabase.from('balances').select('coins').eq('user_id', uid).single();
    const cost = type === 'video' ? 150 : 70;

    if ((Number(bal?.coins) || 0) < cost) {
      return { success: false, error: "Insufficient coins for call." };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Balance check failed." };
  }
}

export async function deductCallCoinsAction(uid: string, type: 'video' | 'voice', partnerId: string) {
  try {
    const { data: user } = await supabase.from('users').select('is_admin, is_coin_seller, gender, name').eq('uid', uid).single();
    if (user?.is_admin || user?.is_coin_seller) return { success: true };

    const cost = type === 'video' ? 150 : 70;
    const ts = Date.now();

    // 1. Deduct Caller (Atomic)
    const { error: deductError } = await supabase.rpc("increment_coins", { user_id: uid, amount: -cost });
    if (deductError) throw deductError;

    // 2. Log Caller History
    await supabase.from("coin_history").insert({
      user_id: uid,
      amount: -cost,
      type: "call_cost",
      description: `${type.toUpperCase()} Call Minute`,
      timestamp: ts
    });

    // 3. Reward Recipient (Earning Diamonds)
    const { data: recipient } = await supabase.from('users').select('gender').eq('uid', partnerId).single();
    
    // Logic: Male calls Female -> Female earns diamonds
    if (user?.gender === 'male' && recipient?.gender === 'female') {
      const reward = 50; 
      await supabase.rpc("increment_diamonds", { user_id: partnerId, amount: reward });
      await supabase.from("diamond_history").insert({
        user_id: partnerId,
        amount: reward,
        type: "call_earning",
        description: `Call from ${user?.name || 'User'}`,
        timestamp: ts
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Call Billing Error]:", error.message);
    return { success: false, error: error.message };
  }
}
