/* eslint-disable new-cap */
import { describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const {
  executeChatMock,
  InputSanitizationError,
  ConfigurationError,
  GeminiResponseError,
} = vi.hoisted(() => {
  class InputSanitizationError extends Error {}
  class ConfigurationError extends Error {}
  class GeminiResponseError extends Error {}

  return {
    executeChatMock: vi.fn(),
    InputSanitizationError,
    ConfigurationError,
    GeminiResponseError,
  };
});

vi.mock('../../../lib/langchain/executeChat', () => ({
  executeChat: executeChatMock,
  InputSanitizationError,
  ConfigurationError,
  GeminiResponseError,
}));

describe('POST /api/chat', () => {
  it('returns the Gemini reply when the payload is valid', async () => {
    executeChatMock.mockResolvedValueOnce({ reply: 'Hi there' });

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello!' }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ reply: 'Hi there' });
  });

  it('rejects malformed JSON payloads', async () => {
    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: '-- not json --',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Request body must be valid JSON.',
    });
  });

  it('validates that message is present', async () => {
    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Message is required.',
    });
  });

  it('maps sanitization errors to 400 responses', async () => {
    executeChatMock.mockRejectedValueOnce(
      new InputSanitizationError('Bad input')
    );

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hack' }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Bad input' });
  });

  it('surfaces configuration problems', async () => {
    executeChatMock.mockRejectedValueOnce(
      new ConfigurationError('Missing key')
    );

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hello' }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Missing key' });
  });

  it('maps Gemini response issues to 502', async () => {
    executeChatMock.mockRejectedValueOnce(
      new GeminiResponseError('Empty response')
    );

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hello' }),
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'Empty response' });
  });

  it('falls back to a generic message on unexpected errors', async () => {
    executeChatMock.mockRejectedValueOnce(new Error('network down'));

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hello' }),
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to chat with Harry right now. Please retry.',
    });
  });
});
