import { describe, expect, it, vi } from 'vitest';
import { buildAudioSrcFromBase64 } from './buildAudioSrcFromBase64';

describe('buildAudioSrcFromBase64', () => {
  it('prefers a blob URL when available', () => {
    const originalCreateObjectURL = globalThis.URL?.createObjectURL;
    const createObjectURLMock = vi.fn(() => 'blob:mock-audio');

    Object.defineProperty(globalThis.URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURLMock,
    });

    const result = buildAudioSrcFromBase64({
      base64: 'YWJj',
      mimeType: 'audio/mpeg',
    });

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      src: 'blob:mock-audio',
      objectUrl: 'blob:mock-audio',
    });

    if (originalCreateObjectURL) {
      Object.defineProperty(globalThis.URL, 'createObjectURL', {
        configurable: true,
        value: originalCreateObjectURL,
      });
    } else {
      Reflect.deleteProperty(globalThis.URL, 'createObjectURL');
    }
  });

  it('falls back to a data URL when blob URLs are unavailable', () => {
    const originalCreateObjectURL = globalThis.URL?.createObjectURL;

    Reflect.deleteProperty(globalThis.URL, 'createObjectURL');

    const result = buildAudioSrcFromBase64({
      base64: 'YWJj',
      mimeType: 'audio/mpeg',
    });

    expect(result.src).toBe('data:audio/mpeg;base64,YWJj');
    expect(result.objectUrl).toBeNull();

    if (originalCreateObjectURL) {
      Object.defineProperty(globalThis.URL, 'createObjectURL', {
        configurable: true,
        value: originalCreateObjectURL,
      });
    }
  });
});
