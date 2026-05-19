import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit AI configuration for QIVO.
 * The googleAI() plugin automatically reads GOOGLE_GENAI_API_KEY from environment variables.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
