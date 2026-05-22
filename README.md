
# QIVO

This is a NextJS social platform built in Firebase Studio, optimized for Supabase high-performance backend.

## Getting Started
To get started, take a look at `src/app/page.tsx`.

## Critical Setup
To enable all premium features, you must configure the following:

1. **Supabase Database**: You MUST run the SQL initialization script found in [DOCS_SUPABASE_SQL.md](./DOCS_SUPABASE_SQL.md) in your Supabase SQL Editor. This is required for the wallet, gifting, and reporting systems to function.
2. **PesaPal**: Follow [DOCS_PESAPAL.md](./DOCS_PESAPAL.md) for mobile payments.
3. **ZegoCloud**: Follow [DOCS_ZEGO.md](./DOCS_ZEGO.md) for video calling.
4. **Gemini AI**: Add `GOOGLE_GENAI_API_KEY` as detailed in [DOCS_AI.md](./DOCS_AI.md).

## Features
- **Real-time Economy**: Coins and Diamonds synced via Supabase Realtime.
- **Gender-Based Gifting**: Rewards recipients (50% for females, 40% for males).
- **Violation Reporting**: Submit formal complaints with statement and photo proof.
- **Cinematic Discovery**: Modern hero headers and sticky navigation for smooth browsing.
- **Identity Verification**: AI-powered selfie verification using Genkit.
- **Agency System**: Recruitment and diamond withdrawal management.
- **Strict Blocking**: Secure communication gates to prevent harassment.
- **Progressive Web App**: Offline support and home screen installation.
