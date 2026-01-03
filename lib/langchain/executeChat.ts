import { ChatGroq } from '@langchain/groq';
import {
  HumanMessage,
  SystemMessage,
  type AIMessage,
} from '@langchain/core/messages';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { buildSystemPrompt } from './prompts/system';
import { buildUserPrompt } from './prompts/user';
import { sanitizeUserMessage } from './safety/sanitizeInput';
import { SENTIMENTS } from '../expressions/facialExpressions';
import { DEFAULT_GROQ_MODEL, resolveLangSmithProject } from './constants';
import { extractTextContent } from './utils/extractTextContent';
import { getSummaryMemory, rebuildSummaryMemory } from './memory/summaryMemory';
import { type ExecuteChatInput, type ExecuteChatResult } from './types';

/**
 * Picks the preferred Groq model, honoring an override via env variable.
 *
 * @returns Groq model id.
 */
function resolveGroqModel(): string {
  const configured = process.env.GROQ_MODEL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_GROQ_MODEL;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class GroqResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroqResponseError';
  }
}

/**
 * Structured format sent to the LLM so it emits both reply text and sentiment label.
 */
const chatResponseSchema = z.object({
  text: z.string().describe('Conversational response as Harry Potter'),
  sentiment: z
    .enum(SENTIMENTS)
    .describe('Emotional tone that best matches the reply'),
});

/**
 * LangChain parser that converts the LLM response into the strict schema.
 */
const chatResponseParser =
  StructuredOutputParser.fromZodSchema(chatResponseSchema);

/**
 * Calls Groq through LangChain after performing local safeguards.
 *
 * @param input - Chat execution inputs.
 * @returns Assistant reply text and sentiment label.
 */
export async function executeChat({
  sessionId,
  message,
  summary,
}: ExecuteChatInput): Promise<ExecuteChatResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ConfigurationError('GROQ_API_KEY must be configured.');
  }

  if (!sessionId || sessionId.trim().length === 0) {
    throw new ConfigurationError('Session id must be configured.');
  }

  const resolvedProject = resolveLangSmithProject();
  if (!process.env.LANGCHAIN_PROJECT) {
    process.env.LANGCHAIN_PROJECT = resolvedProject;
  }
  if (!process.env.LANGSMITH_PROJECT) {
    process.env.LANGSMITH_PROJECT = resolvedProject;
  }

  const sanitizedMessage = sanitizeUserMessage(message);
  const model = resolveGroqModel();
  const summaryContext = summary ?? getSummaryMemory(sessionId);

  const chat = new ChatGroq({
    apiKey,
    model,
    temperature: 0.4,
    maxTokens: 2048,
  });

  const response = (await chat.invoke(
    [
      new SystemMessage(buildSystemPrompt()),
      new HumanMessage(
        buildUserPrompt({
          message: sanitizedMessage,
          summary: summaryContext,
          formatInstructions: chatResponseParser.getFormatInstructions(),
        })
      ),
    ],
    {
      metadata: {
        project: resolvedProject,
        source: 'executeChat',
      },
    }
  )) as AIMessage;

  const raw = extractTextContent(response);
  if (!raw) {
    throw new GroqResponseError('Groq returned an empty response.');
  }

  let parsed: z.infer<typeof chatResponseSchema>;
  try {
    parsed = await chatResponseParser.parse(raw);
  } catch {
    throw new GroqResponseError('Groq returned an invalid response.');
  }

  await rebuildSummaryMemory({
    sessionId,
    userMessage: sanitizedMessage,
    assistantReply: parsed.text,
    previousSummary: summaryContext,
  });

  return { reply: parsed.text, sentiment: parsed.sentiment };
}
export { InputSanitizationError } from './safety/sanitizeInput';
export { SummaryMemoryError } from './memory/summaryMemory';
