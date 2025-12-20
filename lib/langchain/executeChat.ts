import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  HumanMessage,
  SystemMessage,
  type AIMessage,
} from '@langchain/core/messages';
import { buildSystemPrompt } from './prompts/system';
import { buildUserPrompt } from './prompts/user';
import { sanitizeUserMessage } from './safety/sanitizeInput';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const LANGSMITH_PROJECT = 'harry-potter-3d-chatbot';

function resolveGeminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_GEMINI_MODEL;
}

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
      new HumanMessage(buildUserPrompt({ message: sanitizedMessage, summary })),
    ],
    {
      metadata: {
        project: LANGSMITH_PROJECT,
        source: 'executeChat',
      },
    }
  )) as AIMessage;

  const reply = extractTextContent(response);
  if (!reply) {
    throw new GeminiResponseError('Gemini returned an empty response.');
  }

  return { reply };
}
export { InputSanitizationError } from './safety/sanitizeInput';
