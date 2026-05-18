'use server';
/**
 * @fileOverview A Genkit flow for summarizing chat message histories.
 *
 * - summarizeChatHistory - A function that handles the chat history summarization process.
 * - ChatHistorySummarizerInput - The input type for the summarizeChatHistory function.
 * - ChatHistorySummarizerOutput - The return type for the summarizeChatHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatHistorySummarizerInputSchema = z.object({
  chatHistory: z.string().describe('The full chat message history to be summarized.'),
});
export type ChatHistorySummarizerInput = z.infer<typeof ChatHistorySummarizerInputSchema>;

const ChatHistorySummarizerOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the chat history.'),
});
export type ChatHistorySummarizerOutput = z.infer<typeof ChatHistorySummarizerOutputSchema>;

export async function summarizeChatHistory(
  input: ChatHistorySummarizerInput
): Promise<ChatHistorySummarizerOutput> {
  return chatHistorySummarizerFlow(input);
}

const summarizeChatHistoryPrompt = ai.definePrompt({
  name: 'summarizeChatHistoryPrompt',
  input: {schema: ChatHistorySummarizerInputSchema},
  output: {schema: ChatHistorySummarizerOutputSchema},
  prompt: `You are an AI assistant designed to provide concise summaries of chat conversations.
Your goal is to extract the key points, decisions, and action items from the provided chat history.
Avoid including superfluous details. The summary should be easy to read and understand quickly.

Chat History:
{{{chatHistory}}}

Provide a concise summary of the chat history:`,
});

const chatHistorySummarizerFlow = ai.defineFlow(
  {
    name: 'chatHistorySummarizerFlow',
    inputSchema: ChatHistorySummarizerInputSchema,
    outputSchema: ChatHistorySummarizerOutputSchema,
  },
  async input => {
    const {output} = await summarizeChatHistoryPrompt(input);
    return output!;
  }
);
