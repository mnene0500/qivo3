'use server';
/**
 * @fileOverview An AI agent that suggests contextually relevant and high-fidelity responses
 * based on the ongoing chat conversation.
 *
 * - suggestChatResponses - A function that handles the chat response suggestion process.
 * - SuggestedChatResponsesInput - The input type for the suggestChatResponses function.
 * - SuggestedChatResponsesOutput - The return type for the suggestChatResponses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestedChatResponsesInputSchema = z.object({
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'model']).describe('The role of the message sender.'),
        content: z.string().describe('The content of the message.'),
      })
    )
    .describe('The history of the chat conversation.'),
  currentInput: z
    .string()
    .optional()
    .describe('Optional: The current partial input from the user.'),
});
export type SuggestedChatResponsesInput = z.infer<
  typeof SuggestedChatResponsesInputSchema
>;

const SuggestedChatResponsesOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of suggested chat responses.'),
});
export type SuggestedChatResponsesOutput = z.infer<
  typeof SuggestedChatResponsesOutputSchema
>;

export async function suggestChatResponses(
  input: SuggestedChatResponsesInput
): Promise<SuggestedChatResponsesOutput> {
  return suggestedChatResponsesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestChatResponsesPrompt',
  input: {schema: SuggestedChatResponsesInputSchema},
  output: {schema: SuggestedChatResponsesOutputSchema},
  prompt: `You are an AI assistant tasked with suggesting contextually relevant and high-fidelity responses for an ongoing chat conversation.
Analyze the chat history provided and generate a list of 3 concise and helpful responses that the user could use.
If there is a current partial input from the user, take that into account to refine your suggestions.

Chat History:
{{#each chatHistory}}
  {{this.role}}: {{this.content}}
{{/each}}

{{#if currentInput}}
Current Partial Input: {{{currentInput}}}
{{/if}}

Please provide your suggestions as a JSON array of strings, conforming to the output schema.`, 
});

const suggestedChatResponsesFlow = ai.defineFlow(
  {
    name: 'suggestedChatResponsesFlow',
    inputSchema: SuggestedChatResponsesInputSchema,
    outputSchema: SuggestedChatResponsesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
