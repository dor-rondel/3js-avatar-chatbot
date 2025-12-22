import { describe, expect, it } from 'vitest';
import type { AIMessage } from '@langchain/core/messages';
import { extractTextContent } from './extractTextContent';

const buildMessage = (content: unknown): AIMessage =>
  ({ content }) as AIMessage;

describe('extractTextContent', () => {
  it('returns trimmed text when the message content is a string', () => {
    const message = buildMessage('  Hello there  ');
    expect(extractTextContent(message)).toBe('Hello there');
  });

  it('returns the first non-empty string chunk when content is an array', () => {
    const message = buildMessage(['   ', ' First chunk ', 'Second']);
    expect(extractTextContent(message)).toBe('First chunk');
  });

  it('falls back to object chunks that expose text fields', () => {
    const message = buildMessage([
      {},
      { text: '  from object  ' },
      ' trailing ',
    ]);
    expect(extractTextContent(message)).toBe('from object');
  });

  it('returns an empty string when no chunks contain text', () => {
    const message = buildMessage([{ text: '   ' }, 42 as never]);
    expect(extractTextContent(message)).toBe('');
  });
});
