import { ChatGroq } from '@langchain/groq';
import {
  HumanMessage,
  SystemMessage,
  type AIMessage,
} from '@langchain/core/messages';
import { DEFAULT_GROQ_MODEL, LANGSMITH_PROJECT } from '../constants';
import {
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
} from '../prompts/summary';
import { extractTextContent } from '../utils/extractTextContent';
import { type SummaryUpdateInput } from '../types';

let summaryMemory: string | undefined;

/**
 * Generic error raised when the LLM cannot produce a refreshed summary.
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
 * Rebuilds the rolling summary by invoking Groq with the latest turn data.
 */
export async function rebuildSummaryMemory(
  input: SummaryUpdateInput
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new SummaryMemoryError('GROQ_API_KEY must be configured.');
  }

  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;

  const previousSummary =
    typeof input.previousSummary === 'string'
      ? input.previousSummary
      : summaryMemory;

  const chat = new ChatGroq({
    apiKey,
    model,
    temperature: 0.2,
    maxTokens: 512,
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
    throw new SummaryMemoryError('Groq returned an empty summary.');
  }

  summaryMemory = refreshedSummary.trim();
  return summaryMemory;
}
