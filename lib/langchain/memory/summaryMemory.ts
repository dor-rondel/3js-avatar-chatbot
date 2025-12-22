import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  HumanMessage,
  SystemMessage,
  type AIMessage,
} from '@langchain/core/messages';
import { LANGSMITH_PROJECT } from '../constants';
import {
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
} from '../prompts/summary';
import { extractTextContent } from '../utils/extractTextContent';
import { type SummaryUpdateInput } from '../types';

let summaryMemory: string | undefined;

/**
 * Generic error raised when Gemini cannot produce a refreshed summary.
 */
export class SummaryMemoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SummaryMemoryError';
  }
}

/**
 * Returns the most recent summary cached in memory, if any.
 */
export function getSummaryMemory(): string | undefined {
  return summaryMemory;
}

/**
 * Clears the in-memory cache. This is primarily used inside tests.
 */
export function resetSummaryMemory(): void {
  summaryMemory = undefined;
}

/**
 * Rebuilds the rolling summary by invoking Gemini with the latest turn data.
 */
export async function rebuildSummaryMemory(
  input: SummaryUpdateInput
): Promise<string> {
  const previousSummary =
    typeof input.previousSummary === 'string'
      ? input.previousSummary
      : summaryMemory;

  const chat = new ChatGoogleGenerativeAI({
    apiKey: input.apiKey,
    model: input.model,
    temperature: 0.2,
    maxOutputTokens: 512,
  });

  const response = (await chat.invoke(
    [
      new SystemMessage(buildSummarySystemPrompt()),
      new HumanMessage(
        buildSummaryUserPrompt({
          previousSummary,
          userMessage: input.userMessage,
          assistantReply: input.assistantReply,
        })
      ),
    ],
    {
      metadata: {
        project: LANGSMITH_PROJECT,
        source: 'summaryMemory',
      },
    }
  )) as AIMessage;

  const refreshedSummary = extractTextContent(response);
  if (!refreshedSummary) {
    throw new SummaryMemoryError('Gemini returned an empty summary.');
  }

  summaryMemory = refreshedSummary.trim();
  return summaryMemory;
}
