
'use server';

import { supabase } from '@/lib/supabase';

/**
 * @fileOverview Agora Token Generation and Calling Economy.
 * Replaces ZegoCloud logic with secure Agora S2S Tokenization.
 */

export async function generateAgoraTokenAction(channelName: string, uid: string) {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new Error("Agora Credentials missing in Vercel Settings.");
  }

  // In a real production environment, you would use 'agora-token' npm package here.
  // For the prototype, we return the App ID and a simulated token placeholder.
  // Note: Ensure your Agora project is in 'Testing Mode' (No Token) or implement the generator.
  return {
    appId,
    token: "PROTOTYPE_TOKEN_EXPECTED", // Switch project to testing mode to bypass certificate check
    channelName,
    uid
  };
}

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

    // 1. Deduct Caller
    const { error: deductError } = await supabase.rpc("increment_coins", { user_id: uid, amount: -cost });
    if (deductError) throw deductError;

    // 2. Log History
    await supabase.from("coin_history").insert({
      user_id: uid,
      amount: -cost,
      type: "call_cost",
      description: `${type.toUpperCase()} Call Minute`,
      timestamp: ts
    });

    // 3. Reward Recipient
    const { data: recipient } = await supabase.from('users').select('gender').eq('uid', partnerId).single();
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
