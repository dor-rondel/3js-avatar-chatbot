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
  const sessionA = '123e4567-e89b-12d3-a456-426614174000';
  const sessionB = '123e4567-e89b-12d3-a456-426614174001';

  beforeEach(() => {
    invokeMock.mockReset();
    resetSummaryMemory();
  });

  it('returns undefined before any chats occur', () => {
    expect(getSummaryMemory(sessionA)).toBeUndefined();
  });

  it('stores the refreshed summary returned by Groq', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    invokeMock.mockResolvedValueOnce({ content: 'New summary.' });

    await expect(
      rebuildSummaryMemory({
        sessionId: sessionA,
        userMessage: 'Hello',
        assistantReply: 'Hi friend',
      })
    ).resolves.toBe('New summary.');

    expect(getSummaryMemory(sessionA)).toBe('New summary.');
  });

  it('injects the previously stored summary when not provided explicitly', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    invokeMock.mockResolvedValue({ content: 'Updated summary.' });

    await rebuildSummaryMemory({
      sessionId: sessionA,
      userMessage: 'Turn 1',
      assistantReply: 'Response 1',
    });

    await rebuildSummaryMemory({
      sessionId: sessionA,
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
        sessionId: sessionA,
        userMessage: 'hello',
        assistantReply: 'world',
      })
    ).rejects.toBeInstanceOf(SummaryMemoryError);
  });

  it('keeps summaries isolated across sessions', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    invokeMock.mockResolvedValueOnce({ content: 'Session A summary.' });

    await rebuildSummaryMemory({
      sessionId: sessionA,
      userMessage: 'Hello',
      assistantReply: 'Hi',
    });

    expect(getSummaryMemory(sessionA)).toBe('Session A summary.');
    expect(getSummaryMemory(sessionB)).toBeUndefined();
  });

  it('expires a session summary after one hour', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'));
      vi.stubEnv('GROQ_API_KEY', 'test-key');
      invokeMock.mockResolvedValueOnce({ content: 'Short summary.' });

      await rebuildSummaryMemory({
        sessionId: sessionA,
        userMessage: 'Hello',
        assistantReply: 'Hi',
      });

      expect(getSummaryMemory(sessionA)).toBe('Short summary.');

      vi.setSystemTime(new Date('2026-01-03T01:00:00.001Z'));

      expect(getSummaryMemory(sessionA)).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
