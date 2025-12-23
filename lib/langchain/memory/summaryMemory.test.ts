import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SummaryMemoryError,
  getSummaryMemory,
  rebuildSummaryMemory,
  resetSummaryMemory,
} from './summaryMemory';

const invokeMock = vi.fn();

vi.mock('@langchain/groq', () => ({
  ChatGroq: vi.fn(() => ({
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

  it('stores the refreshed summary returned by Groq', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    invokeMock.mockResolvedValueOnce({ content: 'New summary.' });

    await expect(
      rebuildSummaryMemory({
        userMessage: 'Hello',
        assistantReply: 'Hi friend',
      })
    ).resolves.toBe('New summary.');

    expect(getSummaryMemory()).toBe('New summary.');
  });

  it('injects the previously stored summary when not provided explicitly', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    invokeMock.mockResolvedValue({ content: 'Updated summary.' });

    await rebuildSummaryMemory({
      userMessage: 'Turn 1',
      assistantReply: 'Response 1',
    });

    await rebuildSummaryMemory({
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

  it('throws when Groq returns an empty summary', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    invokeMock.mockResolvedValueOnce({ content: '' });

    await expect(
      rebuildSummaryMemory({
        userMessage: 'hello',
        assistantReply: 'world',
      })
    ).rejects.toBeInstanceOf(SummaryMemoryError);
  });
});
