import { Buffer } from 'node:buffer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ElevenLabsConfigurationError,
  ElevenLabsSynthesisError,
  synthesizeSpeech,
} from './synthesizeWithElevenLabs';

const fetchMock = vi.fn();

describe('synthesizeWithElevenLabs', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('throws when the API key is missing', async () => {
    await expect(synthesizeSpeech({ text: 'hello' })).rejects.toThrow(
      ElevenLabsConfigurationError
    );
  });

  it('throws when the voice ID is missing', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', 'secret');

    await expect(synthesizeSpeech({ text: 'hello' })).rejects.toThrow(
      ElevenLabsConfigurationError
    );
  });

  it('returns base64 audio when synthesis succeeds', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', 'secret');
    vi.stubEnv('ELEVENLABS_VOICE_ID', 'voice');
    vi.stubEnv('ELEVENLABS_MODEL_ID', 'test-model');

    const audioData = new Uint8Array([0, 1, 2, 3]);
    fetchMock.mockResolvedValueOnce(
      new Response(audioData, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      })
    );

    const result = await synthesizeSpeech({ text: 'Hello friend' });

    expect(result.mimeType).toBe('audio/mpeg');
    expect(result.base64).toBe(Buffer.from(audioData).toString('base64'));
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/text-to-speech/voice/stream',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws a synthesis error when ElevenLabs responds with an error payload', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', 'secret');
    vi.stubEnv('ELEVENLABS_VOICE_ID', 'voice');

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'quota exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(synthesizeSpeech({ text: 'Hello' })).rejects.toThrow(
      ElevenLabsSynthesisError
    );
  });
});
