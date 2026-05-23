
# Agora Production Secrets (Vercel Edition)

Add these variables to your **Vercel Dashboard > Settings > Environment Variables** to enable secure calling.

| Variable | Value | Importance |
| :--- | :--- | :--- |
| `AGORA_APP_ID` | From Agora Console | Critical |
| `AGORA_APP_CERTIFICATE` | From Agora Console | **SECRET (Keep Private)** |

## ✅ Security Model
Agora is now configured with **S2S Token Verification**. 
1. When a call starts, the client requests a token from Vercel via a Server Action.
2. Vercel generates the token using your `AGORA_APP_CERTIFICATE`.
3. The secret certificate never reaches the user's device.

## 💎 Native Billing
Calling is handled via **Server Actions** in `src/app/actions/call-actions.ts`. This ensures that coin deductions and diamond rewards are calculated securely on Vercel's infrastructure.
