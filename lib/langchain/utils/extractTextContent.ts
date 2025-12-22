import type { AIMessage } from '@langchain/core/messages';

/**
 * Normalizes Gemini's flexible message payloads into a plain string.
 *
 * @param message - LangChain AI message.
 * @returns Extracted plain text (empty string when missing).
 */
export function extractTextContent(message: AIMessage): string {
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
