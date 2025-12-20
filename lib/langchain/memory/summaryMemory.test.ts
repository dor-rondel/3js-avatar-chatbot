import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SummaryMemoryError,
  getSummaryMemory,
  rebuildSummaryMemory,
  resetSummaryMemory,
} from './summaryMemory';

const invokeMock = vi.fn();

vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn(() => ({
    invoke: invokeMock,
  })),
}));

describe('summaryMemory', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    resetSummaryMemory();
  });

  it('returns undefined before any chats occur', () => {
    expect(getSummaryMemory()).toBeUndefined();
  });

  it('stores the refreshed summary returned by Gemini', async () => {
    invokeMock.mockResolvedValueOnce({ content: 'New summary.' });

    await expect(
      rebuildSummaryMemory({
        apiKey: 'key',
        model: 'model',
        userMessage: 'Hello',
        assistantReply: 'Hi friend',
      })
    ).resolves.toBe('New summary.');

    expect(getSummaryMemory()).toBe('New summary.');
  });

  it('injects the previously stored summary when not provided explicitly', async () => {
    invokeMock.mockResolvedValue({ content: 'Updated summary.' });

    await rebuildSummaryMemory({
      apiKey: 'key',
      model: 'model',
      userMessage: 'Turn 1',
      assistantReply: 'Response 1',
    });

    await rebuildSummaryMemory({
      apiKey: 'key',
      model: 'model',
      userMessage: 'Turn 2',
      assistantReply: 'Response 2',
    });

    const secondCall = invokeMock.mock.calls[1];
    const prompt = secondCall?.[0]?.[1];
    expect(prompt).toBeDefined();
    if (prompt && typeof prompt.content === 'string') {
      expect(prompt.content).toContain('Updated summary.');
    }
  });

  it('throws when Gemini returns an empty summary', async () => {
    invokeMock.mockResolvedValueOnce({ content: '' });

    await expect(
      rebuildSummaryMemory({
        apiKey: 'key',
        model: 'model',
        userMessage: 'hello',
        assistantReply: 'world',
      })
    ).rejects.toBeInstanceOf(SummaryMemoryError);
  });
});
