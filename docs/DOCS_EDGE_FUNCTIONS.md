# QIVO Final Production Edge Functions

Update your Supabase Edge Functions with these finalized logic blocks for calls, gifting, and payments.

## 1. Function Name: `calling-ops`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const { action, uid, type, partnerId } = await req.json()

    if (action === "get-config") {
      return new Response(JSON.stringify({ 
        success: true, 
        appId: Number(Deno.env.get("ZEGO_APP_ID")), 
        serverSecret: Deno.env.get("ZEGO_SERVER_SECRET") 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === "check-balance") {
      const { data: bal } = await supabase.from('balances').select('coins').eq('user_id', uid).single()
      const { data: user } = await supabase.from('users').select('is_admin, is_coin_seller').eq('uid', uid).single()
      if (user?.is_admin || user?.is_coin_seller) return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      
      const cost = type === 'video' ? 150 : 70
      if ((bal?.coins || 0) < cost) throw new Error("Insufficient coins for next minute.")
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === "deduct-coins") {
      const cost = type === 'video' ? 150 : 70
      
      // 1. Deduct Caller
      const { error: callerErr } = await supabase.rpc("increment_coins", { user_uid: uid, amount: -cost })
      if (callerErr) throw callerErr

      // 2. Award Recipient (Female only gets fixed 50 diamonds if caller is male)
      const { data: caller } = await supabase.from('users').select('gender').eq('uid', uid).single()
      const { data: recipient } = await supabase.from('users').select('gender').eq('uid', partnerId).single()

      if (caller?.gender === 'male' && recipient?.gender === 'female') {
        await supabase.rpc("increment_diamonds", { user_id: partnerId, amount: 50 })
        await supabase.from("diamond_history").insert({
          user_id: partnerId,
          amount: 50,
          type: "call_earning",
          description: `Call from ${caller?.name || 'User'}`,
          timestamp: Date.now()
        })
      }

      // 3. Ledger Entry for Caller
      await supabase.from("coin_history").insert({
        user_id: uid,
        amount: -cost,
        type: "call_cost",
        description: `${type.toUpperCase()} Call Minute`,
        timestamp: Date.now()
      })

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})
```

## 2. Function Name: `economy-ops`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const { action, ...params } = await req.json()

    if (action === "daily-check-in") {
      const { uid } = params
      const { data: user } = await supabase.from("users").select("*").eq("uid", uid).maybeSingle()
      if (!user) throw new Error("Profile not found")
      
      const streak = (user.check_in_streak || 0) + 1
      const rewards = [2, 2, 5, 2, 2, 2, 10]
      const rewardAmount = rewards[(streak - 1) % 7]

      // Update User Streak and Last Checkin
      await supabase.from("users").update({ 
        last_check_in_date: new Date().toISOString(), 
        check_in_streak: streak 
      }).eq("uid", uid)

      // Award Coins
      await supabase.rpc("increment_coins", { user_uid: uid, amount: rewardAmount })
      
      // Log History
      await supabase.from("coin_history").insert({
        user_id: uid,
        amount: rewardAmount,
        type: "checkin",
        description: `Daily Reward - Day ${streak}`,
        timestamp: Date.now()
      })
      
      return new Response(JSON.stringify({ success: true, amount: rewardAmount, day: streak }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === "send-gift") {
      const { senderUid, recipientUid, coinAmount, giftName } = params
      
      // 1. Deduct Sender
      const { error: sendErr } = await supabase.rpc("increment_coins", { user_uid: senderUid, amount: -coinAmount })
      if (sendErr) throw sendErr

      // 2. Fetch Recipient Gender for Reward Rate
      const { data: rec } = await supabase.from('users').select('gender').eq('uid', recipientUid).single()
      const rate = rec?.gender === 'female' ? 0.5 : 0.4
      const diamondReward = coinAmount * rate

      // 3. Award Recipient
      await supabase.rpc("increment_diamonds", { user_id: recipientUid, amount: diamondReward })
      
      // 4. Ledger Entries
      await supabase.from("coin_history").insert({ user_id: senderUid, amount: -coinAmount, type: "gift", description: `Sent ${giftName}`, timestamp: Date.now() })
      await supabase.from("diamond_history").insert({ user_id: recipientUid, amount: diamondReward, type: "gift", description: `Received ${giftName}`, timestamp: Date.now() })

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 200, headers: corsHeaders })
  }
})
```
