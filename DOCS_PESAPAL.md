
# QIVO PesaPal Production Secrets (Vercel Native)

Add these variables to your **Vercel Dashboard > Settings > Environment Variables** to enable live payments.

| Variable | Value | Description |
| :--- | :--- | :--- |
| `PESAPAL_CONSUMER_KEY` | *Your Key* | From PesaPal Live Dashboard |
| `PESAPAL_CONSUMER_SECRET` | *Your Secret* | From PesaPal Live Dashboard |
| `PESAPAL_IPN_ID` | *Unique ID* | Retrieve from `/api/pesapal/setup` page |

## ✅ Phishing Protection
- **S2S (Server-to-Server) Verification**: We only trust PesaPal's API directly from Vercel, not user input.
- **Idempotency**: Every transaction is recorded in `processed_payments` to prevent double-awarding of coins.
- **Zero Latency**: No more cold starts from Edge Functions.
