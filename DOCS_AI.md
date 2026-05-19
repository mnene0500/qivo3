# QIVO AI Integration (Genkit + Gemini)

This app uses Google Genkit with the Gemini 2.5 Flash model for features like AI Identity Verification.

## 1. Setup Environment Variables
To enable AI in production, you MUST add this key to your Vercel Dashboard:

| Variable Name | Source |
| :--- | :--- |
| `GOOGLE_GENAI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |

## 2. Increasing Timeouts
AI analysis can sometimes take longer than the default 15-second Vercel function timeout. If you experience "Task Timeout" errors, add the following to your `next.config.ts` or the specific page config:

```ts
export const maxDuration = 60; // Set to 60 seconds
```

## 3. Supported Features
- **Identity Verification**: Compares profile photos with live selfies using biometric analysis.
- **Conversation Insights**: Summarizes chats and suggests contextually relevant responses.
