import { Buffer } from 'node:buffer';

const DEFAULT_MODEL_ID = 'eleven_monolingual_v1';
const DEFAULT_MIME_TYPE = 'audio/mpeg';

export type SynthesizedAudio = {
  base64: string;
  mimeType: string;
};

export class ElevenLabsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsConfigurationError';
  }
}

export class ElevenLabsSynthesisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsSynthesisError';
  }
}

/**
 * Minimal payload accepted by ElevenLabs synthesis helper.
 */
type SynthesizeSpeechInput = {
  /** Assistant text to convert into audio. */
  text: string;
};

function ensureEnv(value: string | undefined, message: string): string {
  if (value && value.trim().length > 0) {
    return value.trim();
  }

  throw new ElevenLabsConfigurationError(message);
}

async function buildSynthesisError(
  response: Response
): Promise<ElevenLabsSynthesisError> {
  const baseMessage = `ElevenLabs synthesis failed (${response.status})`;

  try {
    const body = await response.json();
    const detail =
      (typeof body?.detail === 'string' && body.detail.trim()) ||
      (typeof body?.message === 'string' && body.message.trim()) ||
      (typeof body?.error === 'string' && body.error.trim());

    if (detail) {
      return new ElevenLabsSynthesisError(`${baseMessage}: ${detail}`);
    }
  } catch {
    try {
      const fallback = await response.text();
      if (fallback.trim().length > 0) {
        return new ElevenLabsSynthesisError(
          `${baseMessage}: ${fallback.trim()}`
        );
      }
    } catch {
      // Ignore secondary parsing issues and fall through to the default message
    }
  }

  return new ElevenLabsSynthesisError(baseMessage);
}

/**
 * Calls the ElevenLabs streaming endpoint and returns the audio as a base64 string.
 *
 * @param {SynthesizeSpeechInput} input - The synthesis payload containing the assistant text.
 * @returns {Promise<SynthesizedAudio>} Base64-encoded audio data and its MIME type.
 * @throws {ElevenLabsConfigurationError} When required ElevenLabs env vars are missing.
 * @throws {ElevenLabsSynthesisError} When ElevenLabs rejects the request or returns no audio.
 */
export async function synthesizeSpeech({
  text,
}: SynthesizeSpeechInput): Promise<SynthesizedAudio> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new ElevenLabsSynthesisError('Cannot synthesize an empty response.');
  }

  const apiKey = ensureEnv(
    process.env.ELEVENLABS_API_KEY,
    'ELEVENLABS_API_KEY must be configured.'
  );
  const voiceId = ensureEnv(
    process.env.ELEVENLABS_VOICE_ID,
    'ELEVENLABS_VOICE_ID must be configured.'
  );
  const modelId =
    process.env.ELEVENLABS_MODEL_ID?.trim() &&
    process.env.ELEVENLABS_MODEL_ID.trim().length > 0
      ? process.env.ELEVENLABS_MODEL_ID.trim()
      : DEFAULT_MODEL_ID;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: DEFAULT_MIME_TYPE,
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: trimmedText,
        model_id: modelId,
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.85,
        },
      }),
    }
  );

  if (!response.ok) {
    throw await buildSynthesisError(response);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get('content-type') ?? DEFAULT_MIME_TYPE;

  return {
    base64: audioBuffer.toString('base64'),
    mimeType,
  };
}
