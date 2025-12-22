/* eslint-disable new-cap */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const {
  executeChatMock,
  InputSanitizationError,
  ConfigurationError,
  GeminiResponseError,
  SummaryMemoryError,
  synthesizeSpeechMock,
  ElevenLabsConfigurationError,
  ElevenLabsSynthesisError,
} = vi.hoisted(() => {
  class InputSanitizationError extends Error {}
  class ConfigurationError extends Error {}
  class GeminiResponseError extends Error {}
  class SummaryMemoryError extends Error {}
  class ElevenLabsConfigurationError extends Error {}
  class ElevenLabsSynthesisError extends Error {}

  return {
    executeChatMock: vi.fn(),
    synthesizeSpeechMock: vi.fn(),
    InputSanitizationError,
    ConfigurationError,
    GeminiResponseError,
    SummaryMemoryError,
    ElevenLabsConfigurationError,
    ElevenLabsSynthesisError,
  };
});

vi.mock('@/lib/langchain/executeChat', () => ({
  executeChat: executeChatMock,
  InputSanitizationError,
  ConfigurationError,
  GeminiResponseError,
  SummaryMemoryError,
}));

vi.mock('@/lib/voice/synthesizeWithElevenLabs', () => ({
  synthesizeSpeech: synthesizeSpeechMock,
  ElevenLabsConfigurationError,
  ElevenLabsSynthesisError,
}));

describe('POST /api/chat', () => {
  beforeEach(() => {
    executeChatMock.mockReset();
    synthesizeSpeechMock.mockReset();
  });

  it('returns the Gemini reply when the payload is valid', async () => {
    executeChatMock.mockResolvedValueOnce({
      reply: 'Hi there',
      sentiment: 'happy',
    });
    synthesizeSpeechMock.mockResolvedValueOnce({
      base64: 'abc',
      mimeType: 'audio/mpeg',
    });

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello!' }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reply: 'Hi there',
      sentiment: 'happy',
      audio: { base64: 'abc', mimeType: 'audio/mpeg' },
    });
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

  it('surfaces ElevenLabs configuration problems', async () => {
    executeChatMock.mockResolvedValueOnce({
      reply: 'Hi there',
      sentiment: 'happy',
    });
    synthesizeSpeechMock.mockRejectedValueOnce(
      new ElevenLabsConfigurationError('Missing ElevenLabs key')
    );

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hello' }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Missing ElevenLabs key',
    });
  });

  it('maps ElevenLabs synthesis issues to 502', async () => {
    executeChatMock.mockResolvedValueOnce({
      reply: 'Hi there',
      sentiment: 'happy',
    });
    synthesizeSpeechMock.mockRejectedValueOnce(
      new ElevenLabsSynthesisError('Quota exceeded')
    );

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hello' }),
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'Quota exceeded' });
  });

  it('maps summary memory issues to 502', async () => {
    executeChatMock.mockRejectedValueOnce(
      new SummaryMemoryError('Summary failed')
    );

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'hello' }),
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'Summary failed' });
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
