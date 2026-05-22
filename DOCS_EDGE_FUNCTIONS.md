
# QIVO Edge Function Blueprints

Click **"Open Editor"** in the Supabase Edge Functions dashboard. For each folder below, create a file named `index.ts` and paste the code.

## 1. `payment-ops/index.ts`
Handles PesaPal communication and coin fulfillment.
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { action, ...params } = await req.json()

    if (action === 'initiate') {
      // 1. Get Token from PesaPal
      // 2. Register Order
      // 3. Return redirect_url
      return new Response(JSON.stringify({ success: true, redirect_url: '...' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'fulfill') {
      const { orderTrackingId, merchantReference } = params
      // 1. Check if already processed
      const { data: existing } = await supabase.from('processed_payments').select('*').eq('order_tracking_id', orderTrackingId).maybeSingle()
      if (existing) return new Response(JSON.stringify({ success: true, message: 'Already processed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      // 2. Call RPC to increment coins
      // Get user_id from merchantReference (which we formatted as user_id|coins)
      const [uid, coins] = merchantReference.split('|')
      await supabase.rpc('increment_coins', { user_uid: uid, amount: parseInt(coins) })
      await supabase.from('processed_payments').insert({ order_tracking_id: orderTrackingId, user_id: uid, coins: parseInt(coins), amount: 0 })
      
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

## 2. `calling-ops/index.ts`
Handles ZegoCloud config and secure per-minute billing.
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { action, ...params } = await req.json()

  if (action === 'get-config') {
    return new Response(JSON.stringify({ 
      success: true, 
      appId: parseInt(Deno.env.get('ZEGO_APP_ID')!), 
      serverSecret: Deno.env.get('ZEGO_SERVER_SECRET') 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (action === 'deduct-coins') {
    const { uid, type, partnerId } = params
    const cost = type === 'video' ? 150 : 70
    
    // 1. Deduct from caller
    const { data: bal } = await supabase.from('balances').select('coins').eq('user_id', uid).single()
    if (!bal || bal.coins < cost) throw new Error('Insufficient balance')
    
    await supabase.rpc('increment_coins', { user_uid: uid, amount: -cost })
    
    // 2. Award Diamonds to recipient
    const { data: recipient } = await supabase.from('users').select('gender').eq('uid', partnerId).single()
    const rate = recipient?.gender === 'female' ? 0.5 : 0.4
    await supabase.rpc('increment_diamonds', { user_id: partnerId, amount: cost * rate })
    
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

## 3. `economy-ops/index.ts`
Handles gifts, daily check-ins, and roles.
```typescript
// Similar structure as above. 
// Handle action 'daily-check-in', 'send-gift', 'toggle-role' etc.
```

## 4. `ai-ops/index.ts`
Handles biometric verification with Gemini 2.5 Flash.
```typescript
// Action 'verify-identity'
// Use Deno.env.get('GOOGLE_GENAI_API_KEY')
```
