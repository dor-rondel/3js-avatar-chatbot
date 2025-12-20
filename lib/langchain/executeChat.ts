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

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const LANGSMITH_PROJECT = 'harry-potter-3d-chatbot';

/**
 * Picks the preferred Gemini model, honoring an override via env variable.
 */
function resolveGeminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_GEMINI_MODEL;
}

/**
 * Normalizes Gemini's flexible message payloads into a plain string.
 */
function extractTextContent(message: AIMessage): string {
  if (typeof message.content === 'string') {
    return message.content.trim();
  }

  if (Array.isArray(message.content)) {
    const chunks = message.content as Array<string | Record<string, unknown>>;

    for (const chunk of chunks) {
      if (typeof chunk === 'string') {
        const text = chunk.trim();
        if (text) {
          return text;
        }
      }

      if (
        typeof chunk === 'object' &&
        chunk !== null &&
        'text' in chunk &&
        typeof (chunk as { text?: string }).text === 'string'
      ) {
        const text = (chunk as { text?: string }).text?.trim();
        if (text) {
          return text;
        }
      }
    }
  }

  return '';
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

  const chat = new ChatGoogleGenerativeAI({
    apiKey,
    model: resolveGeminiModel(),
    temperature: 0.4,
    maxOutputTokens: 2048,
  });

  const response = (await chat.invoke(
    [
      new SystemMessage(buildSystemPrompt()),
      new HumanMessage(
        buildUserPrompt({
          message: sanitizedMessage,
          summary,
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

  try {
    const parsed = await chatResponseParser.parse(raw);
    return { reply: parsed.text, sentiment: parsed.sentiment };
  } catch {
    throw new GeminiResponseError('Gemini returned an invalid response.');
  }
}
export { InputSanitizationError } from './safety/sanitizeInput';
