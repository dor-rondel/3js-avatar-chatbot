import { decodeBase64Audio } from './decodeBase64Audio';
import type { SynthesizedAudio } from '@/lib/voice/types';

type BuildAudioSrcResult = {
  /** Source URL for the audio element (either a blob URL or a data URL). */
  src: string;
  /** Blob URL that should be revoked when no longer needed (null if not used). */
  objectUrl: string | null;
};

/**
 * Builds a playable audio `src` for a base64 payload.
 *
 * Prefers a blob URL when supported (smaller strings, better perf), falling back to a
 * `data:` URL if blob URLs are unavailable.
 *
 * @param audio - Base64 audio payload and its MIME type.
 * @returns A playable `src` and (optionally) the blob URL to revoke.
 */
export function buildAudioSrcFromBase64(
  audio: SynthesizedAudio
): BuildAudioSrcResult {
  const audioBuffer = decodeBase64Audio(audio.base64);

  const canUseBlob =
    typeof Blob === 'function' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function';

  if (!canUseBlob) {
    return {
      src: `data:${audio.mimeType};base64,${audio.base64}`,
      objectUrl: null,
    };
  }

  const blob = new Blob([audioBuffer], { type: audio.mimeType });
  const objectUrl = URL.createObjectURL(blob);
  return { src: objectUrl, objectUrl };
}
