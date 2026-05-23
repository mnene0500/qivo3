
'use server';
/**
 * @fileOverview Biometric Verification via Native Gemini AI.
 * Now runs directly on Vercel using the GOOGLE_GENAI_API_KEY.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyIdentityInputSchema = z.object({
  profilePhotoUrl: z.string().describe('The URL of the user\'s existing profile photo.'),
  selfieDataUri: z
    .string()
    .describe(
      "A live selfie captured by the user, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VerifyIdentityInput = z.infer<typeof VerifyIdentityInputSchema>;

const VerifyIdentityOutputSchema = z.object({
  isMatch: z.boolean().describe('Whether the person in the selfie matches the profile photo.'),
  confidence: z.number().min(0).max(1).describe('The confidence score of the match (0 to 1).'),
  reasoning: z.string().describe('A brief explanation of the AI\'s determination.'),
});
export type VerifyIdentityOutput = z.infer<typeof VerifyIdentityOutputSchema>;

export async function verifyIdentity(input: VerifyIdentityInput): Promise<VerifyIdentityOutput> {
  try {
    const { output } = await verificationPrompt(input);
    return output!;
  } catch (err: any) {
    console.error("Native VerifyIdentity Flow Error:", err.message);
    throw new Error("Identity verification failed. Ensure your keys are set in Vercel.");
  }
}

const verificationPrompt = ai.definePrompt({
  name: 'verifyIdentityPrompt',
  input: { schema: VerifyIdentityInputSchema },
  output: { schema: VerifyIdentityOutputSchema },
  prompt: `You are a professional biometric security analyst.
Compare these two images:
1. Profile Photo: {{media url=profilePhotoUrl}}
2. Live Selfie: {{media url=selfieDataUri}}

Determine if they are the same person.
Set isMatch to true only if you are confident (score > 0.7).
Provide a brief reasoning for your decision.`,
});
