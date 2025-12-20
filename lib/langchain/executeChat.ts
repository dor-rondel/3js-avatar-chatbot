import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
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
import {
  SENTIMENTS,
  type SentimentValue,
} from '../expressions/facialExpressions';
import { DEFAULT_GEMINI_MODEL, LANGSMITH_PROJECT } from './constants';
import { extractTextContent } from './utils/extractTextContent';
import { getSummaryMemory, rebuildSummaryMemory } from './memory/summaryMemory';

/**
 * Picks the preferred Gemini model, honoring an override via env variable.
 */
function resolveGeminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_GEMINI_MODEL;
}

export type ExecuteChatInput = {
  message: string;
  summary?: string;
};

export type ExecuteChatResult = {
  reply: string;
  sentiment: SentimentValue;
};

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class GeminiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiResponseError';
  }
}

/**
 * Structured format sent to Gemini so it emits both reply text and sentiment label.
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
 * Calls Gemini Flash 2.5 through LangChain after performing local safeguards.
 */
export async function executeChat({
  message,
  summary,
}: ExecuteChatInput): Promise<ExecuteChatResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ConfigurationError('GEMINI_API_KEY must be configured.');
  }

  if (!process.env.LANGSMITH_PROJECT) {
    process.env.LANGSMITH_PROJECT = LANGSMITH_PROJECT;
  }

  const sanitizedMessage = sanitizeUserMessage(message);
  const model = resolveGeminiModel();
  const summaryContext = summary ?? getSummaryMemory();

  const chat = new ChatGoogleGenerativeAI({
    apiKey,
    model,
    temperature: 0.4,
    maxOutputTokens: 2048,
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
        project: LANGSMITH_PROJECT,
        source: 'executeChat',
      },
    }
  )) as AIMessage;

  const raw = extractTextContent(response);
  if (!raw) {
    throw new GeminiResponseError('Gemini returned an empty response.');
  }

  let parsed: z.infer<typeof chatResponseSchema>;
  try {
    parsed = await chatResponseParser.parse(raw);
  } catch {
    throw new GeminiResponseError('Gemini returned an invalid response.');
  }

  await rebuildSummaryMemory({
    apiKey,
    model,
    userMessage: sanitizedMessage,
    assistantReply: parsed.text,
    previousSummary: summaryContext,
  });

  return { reply: parsed.text, sentiment: parsed.sentiment };
}
export { InputSanitizationError } from './safety/sanitizeInput';
export { SummaryMemoryError } from './memory/summaryMemory';
