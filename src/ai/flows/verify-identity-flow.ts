'use server';
/**
 * @fileOverview A Genkit flow for identity verification via face comparison.
 *
 * - verifyIdentity - A function that compares a profile photo with a live selfie.
 * - VerifyIdentityInput - The input type (profile URL and selfie data URI).
 * - VerifyIdentityOutput - The verification result (match status and confidence).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return verifyIdentityFlow(input);
}

const verifyIdentityPrompt = ai.definePrompt({
  name: 'verifyIdentityPrompt',
  input: {schema: VerifyIdentityInputSchema},
  output: {schema: VerifyIdentityOutputSchema},
  prompt: `You are an expert biometric security analyst. 

Compare the person in these two images:
1. Profile Photo: {{media url=profilePhotoUrl}}
2. Live Selfie: {{media url=selfieDataUri}}

Determine if they are the same person. Consider facial features, structure, and identifying characteristics. 
Ignore differences in lighting, background, or minor clothing changes.

Provide your result as JSON with:
- isMatch: true/false
- confidence: a value between 0 and 1 (0.8+ usually indicates a strong match)
- reasoning: a short sentence explaining your conclusion.`,
});

const verifyIdentityFlow = ai.defineFlow(
  {
    name: 'verifyIdentityFlow',
    inputSchema: VerifyIdentityInputSchema,
    outputSchema: VerifyIdentityOutputSchema,
  },
  async input => {
    const {output} = await verifyIdentityPrompt(input);
    return output!;
  }
);
