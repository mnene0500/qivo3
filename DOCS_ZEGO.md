
# ZegoCloud Production (Vercel Edition)

Add these variables to your **Vercel Dashboard > Settings > Environment Variables**:

| Variable | Value | Importance |
| :--- | :--- | :--- |
| `ZEGO_APP_ID` | Your App ID | Critical |
| `ZEGO_SERVER_SECRET` | Your Server Secret | **SECRET (Keep Private)** |

## ✅ Native Billing
Calling is now handled via **Server Actions** in `src/app/actions/call-actions.ts`. This ensures that coin deductions and diamond rewards are calculated securely on Vercel's infrastructure.
