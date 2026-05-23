
# QIVO Production Edge Function

Only the `payment-ops` function is required as an Edge Function for PesaPal. All other social and calling features have been migrated to the application core on Vercel for maximum performance.

## 1. Function Name: `payment-ops`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const PESA_ENV = "https://pay.pesapal.com/v3"

async function getPesapalToken() {
  const res = await fetch(`${PESA_ENV}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      consumer_key: Deno.env.get("PESAPAL_CONSUMER_KEY"),
      consumer_secret: Deno.env.get("PESAPAL_CONSUMER_SECRET"),
    }),
  })
  const data = await res.json()
  return data.token
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const body = await req.json()
    const { action } = body

    if (action === "initiate") {
      const { amount, user } = body
      const token = await getPesapalToken()
      
      const order = {
        id: crypto.randomUUID(),
        currency: "KES",
        amount: Number(amount),
        description: "QIVO Coins Recharge",
        callback_url: "https://qivo-gamma.vercel.app/recharge",
        notification_id: Deno.env.get("PESAPAL_IPN_ID"),
        billing_address: { email_address: user.email || "user@qivo.app" },
      }

      const res = await fetch(`${PESA_ENV}/api/Transactions/SubmitOrderRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(order),
      })
      const data = await res.json()
      return new Response(JSON.stringify({ success: true, redirect_url: data.redirect_url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === "fulfill") {
      const { orderTrackingId, user_uid } = body
      const token = await getPesapalToken()
      
      const verifyRes = await fetch(`${PESA_ENV}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
      const statusData = await verifyRes.json()

      if (statusData.payment_status_description === "Completed") {
        const paidAmount = Number(statusData.amount)
        let coins = 0
        
        if (paidAmount === 1) coins = 200
        else if (paidAmount === 80) coins = 500
        else if (paidAmount === 120) coins = 1000
        else if (paidAmount === 230) coins = 2000
        else if (paidAmount === 550) coins = 5000
        else if (paidAmount === 1000) coins = 10000
        else if (paidAmount === 1800) coins = 20000
        else coins = Math.floor(paidAmount * 6.25)

        const { data: existing } = await supabase.from('processed_payments').select('order_tracking_id').eq('order_tracking_id', orderTrackingId).maybeSingle()
        if (existing) return new Response(JSON.stringify({ success: true, message: "Already fulfilled" }), { headers: corsHeaders })

        await supabase.rpc("increment_coins", { user_uid, amount: coins })
        await supabase.from('processed_payments').insert({ order_tracking_id: orderTrackingId, user_id: user_uid, amount: paidAmount, coins })
        
        await supabase.from("coin_history").insert({
          user_id: user_uid,
          amount: coins,
          type: "recharge",
          description: "PesaPal Recharge",
          timestamp: Date.now()
        })

        return new Response(JSON.stringify({ success: true, coins_added: coins }), { headers: corsHeaders })
      }
      return new Response(JSON.stringify({ success: false, message: "Payment not completed" }), { headers: corsHeaders })
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 200, headers: corsHeaders })
  }
})
```
