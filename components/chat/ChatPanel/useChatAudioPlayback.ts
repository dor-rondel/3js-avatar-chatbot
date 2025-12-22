import { useCallback, useEffect, useRef } from 'react';
import { Lipsync } from 'wawa-lipsync';
import { emitViseme } from '@/lib/viseme/visemeEvents';
import { emitExpression } from '@/lib/expressions/expressionEvents';
import {
  resolveExpressionForSentiment,
  type SentimentValue,
} from '@/lib/expressions/facialExpressions';
import { buildAudioSrcFromBase64 } from '@/lib/audio/buildAudioSrcFromBase64';
import type { SynthesizedAudio } from '@/lib/voice/types';

type PlayAudioInput = {
  audio: SynthesizedAudio;
  sentiment: SentimentValue;
};

type UseChatAudioPlaybackResult = {
  /** Plays assistant audio and starts the lipsync/viseme loop. */
  // eslint-disable-next-line no-unused-vars
  playResponseAudio: (...args: [PlayAudioInput]) => Promise<void>;
};

/**
 * Manages audio playback + lipsync forwarding for the chat UI.
 *
 * Responsible for:
 * - Reusing a single `HTMLAudioElement`
 * - Converting base64 audio into a playable source
 * - Driving `wawa-lipsync` polling via `requestAnimationFrame`
 * - Emitting viseme + expression events for the 3D avatar
 * - Cleaning up blob URLs and RAF loops
 *
 * @returns A small API for playing assistant audio.
 */
export function useChatAudioPlayback(): UseChatAudioPlaybackResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lipsyncRef = useRef<Lipsync | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVisemeRef = useRef<string | null>(null);

  /**
   * Stops lipsync polling, tears down the audio element, and releases any blob URLs.
   * Called before new playback and again on component unmount.
   */
  const cleanupAudioResources = useCallback(() => {
    if (rafRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    lastVisemeRef.current = null;
    emitViseme({ label: 'viseme_sil', timestamp: 0 });
    emitExpression('default');

    if (
      objectUrlRef.current &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.src = '';
    }
  }, []);

  useEffect(
    () => () => {
      cleanupAudioResources();
      audioRef.current = null;
      lipsyncRef.current = null;
    },
    [cleanupAudioResources]
  );

  /**
   * Lazily constructs a `Lipsync` instance once the code is running in the browser.
   */
  const ensureLipsync = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!lipsyncRef.current) {
      lipsyncRef.current = new Lipsync();
    }

    return lipsyncRef.current;
  }, []);

  /**
   * Reuses a single `HTMLAudioElement`, creating it lazily the first time we need playback.
   */
  const getAudioElement = useCallback(() => {
    if (typeof Audio === 'undefined') {
      return null;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    return audioRef.current;
  }, []);

  const startVisemeLoop = useCallback(
    (audioElement: HTMLAudioElement, manager: Lipsync) => {
      if (typeof window === 'undefined') {
        return;
      }

      if (typeof window.requestAnimationFrame !== 'function') {
        return;
      }

      const tick = () => {
        manager.processAudio();

        const currentViseme = manager.viseme;
        if (currentViseme && currentViseme !== lastVisemeRef.current) {
          lastVisemeRef.current = currentViseme;
          emitViseme({
            label: currentViseme,
            timestamp: audioElement.currentTime ?? 0,
          });
        }

        rafRef.current = window.requestAnimationFrame(tick);
      };

      if (
        rafRef.current !== null &&
        typeof cancelAnimationFrame === 'function'
      ) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = window.requestAnimationFrame(tick);
    },
    []
  );

  const playResponseAudio = useCallback(
    async ({ audio, sentiment }: PlayAudioInput) => {
      const element = getAudioElement();
      if (!element) {
        return;
      }

      cleanupAudioResources();
      emitExpression(resolveExpressionForSentiment(sentiment));

      const { src, objectUrl } = buildAudioSrcFromBase64(audio);
      if (objectUrl) {
        objectUrlRef.current = objectUrl;
      }

      element.src = src;

      const lipsyncManager = ensureLipsync();
      if (lipsyncManager) {
        lipsyncManager.connectAudio(element);
        startVisemeLoop(element, lipsyncManager);
      }

      element.onended = () => {
        cleanupAudioResources();
      };

      await element.play();
    },
    [cleanupAudioResources, ensureLipsync, getAudioElement, startVisemeLoop]
  );

  return { playResponseAudio };
}
