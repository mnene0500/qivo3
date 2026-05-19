# QIVO

This is a NextJS social platform built in Firebase Studio.

## Getting Started
To get started, take a look at `src/app/page.tsx`.

## Critical Setup
To enable all premium features, you must configure the following in Vercel:

1. **Firebase Keys**: Standard Firebase configuration.
2. **PesaPal**: Follow [DOCS_PESAPAL.md](./DOCS_PESAPAL.md) for mobile payments.
3. **ZegoCloud**: Follow [DOCS_ZEGO.md](./DOCS_ZEGO.md) for video calling.
4. **Gemini AI**: Add `GOOGLE_GENAI_API_KEY` as detailed in [DOCS_AI.md](./DOCS_AI.md).

## Features
- **Video Splash**: Cinematic entry with `backgroundvideo.mp4`.
- **Identity Verification**: AI-powered selfie verification using Genkit.
- **Agency System**: Recruitment and diamond withdrawal management.
- **Real-time Wallet**: Coins and Diamonds synced via Firebase Realtime Database.
- **Progressive Web App**: Offline support and home screen installation.
