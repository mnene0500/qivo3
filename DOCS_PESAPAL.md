
# QIVO PesaPal Production Secrets (Vercel Edition)

Add these variables to your **Vercel Dashboard > Settings > Environment Variables** to enable live payments.

| Variable | Value | Description |
| :--- | :--- | :--- |
| `PESAPAL_CONSUMER_KEY` | *Your Key* | From PesaPal Live Dashboard |
| `PESAPAL_CONSUMER_SECRET` | *Your Secret* | From PesaPal Live Dashboard |
| `PESAPAL_IPN_ID` | *Unique ID* | Retrieve from `/api/pesapal/setup` page |

## ✅ Security Features
- **Zero-Latency**: No more cold starts from edge functions.
- **Phishing Protection**: S2S (Server-to-Server) verification ensures we only trust PesaPal's API, not user input.
- **Idempotency**: Every transaction is recorded in `processed_payments` to prevent double-awarding of coins.
