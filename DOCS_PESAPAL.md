# QIVO PesaPal Production Secrets

Add these variables to your **Supabase Edge Functions > Secrets** to enable live payments.

| Variable | Value | Description |
| :--- | :--- | :--- |
| `PESAPAL_CONSUMER_KEY` | *Your Key* | From PesaPal Live Dashboard |
| `PESAPAL_CONSUMER_SECRET` | *Your Secret* | From PesaPal Live Dashboard |
| `PESAPAL_IPN_ID` | *Unique ID* | Retrieve from `/pesapal-admin` page |
| `PESAPAL_CALLBACK_URL` | `https://qivo-gamma.vercel.app/recharge` | The page users return to after paying |

## ✅ Payment Flow Architecture
1. **Initiate**: App calls `payment-ops` with `action: "initiate"`. Returns a redirect URL.
2. **Redirect**: User pays on PesaPal's secure site.
3. **Verify**: User returns to `/recharge`. App calls `payment-ops` with `action: "fulfill"`.
4. **Fulfill**: Backend confirms status with PesaPal and uses `increment_coins` RPC to update balance.
