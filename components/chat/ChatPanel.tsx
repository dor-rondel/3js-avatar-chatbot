'use client';

import { useCallback, useEffect, useRef, type HTMLAttributes } from 'react';
import { Lipsync } from 'wawa-lipsync';
import { ChatInput } from './ChatInput';
import { sendChatRequest } from '../../lib/chat/sendChatRequest';
import { decodeBase64Audio } from '../../lib/audio/decodeBase64Audio';
import { emitViseme } from '../../lib/viseme/visemeEvents';

type ChatPanelProps = Omit<HTMLAttributes<HTMLElement>, 'children'>;

/**
 * Renders the floating chat panel overlay that collects user prompts for Harry.
 * Currently front-end only; it forwards messages to the eventual TTS pipeline via `handleSend`.
 */
export function ChatPanel(sectionProps: ChatPanelProps = {}) {
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
   * Kicks off a `requestAnimationFrame` loop that polls lipsync visemes
   * while audio is playing and logs transitions for debugging.
   */
  const startVisemeLoop = useCallback(
    (audioElement: HTMLAudioElement) => {
      const manager = ensureLipsync();
      if (!manager || typeof window === 'undefined') {
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
          const timestamp = audioElement.currentTime?.toFixed(2) ?? '0.00';
          // eslint-disable-next-line no-console
          console.info('[viseme]', currentViseme, '@', `${timestamp}s`);
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
    [ensureLipsync]
  );

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

  /**
   * Sends the prompt to the chat API, converts the returned base64 audio into a playable source,
   * and hands the element to the lipsync pipeline.
   */
  const handleSend = useCallback(
    async (text: string) => {
      try {
        const { reply, audio } = await sendChatRequest(text);
        const element = getAudioElement();

        if (!element) {
          // eslint-disable-next-line no-console
          console.warn('Audio playback is not supported in this browser.');
          return;
        }

        const audioBuffer = decodeBase64Audio(audio.base64);
        const blob = new Blob([audioBuffer], { type: audio.mimeType });

        cleanupAudioResources();

        const canUseBlobUrl =
          typeof URL !== 'undefined' &&
          typeof URL.createObjectURL === 'function';
        const nextSrc = canUseBlobUrl
          ? URL.createObjectURL(blob)
          : `data:${audio.mimeType};base64,${audio.base64}`;

        if (canUseBlobUrl) {
          objectUrlRef.current = nextSrc;
        }

        element.src = nextSrc;

        const lipsyncManager = ensureLipsync();
        if (lipsyncManager) {
          lipsyncManager.connectAudio(element);
          startVisemeLoop(element);
        }

        element.onended = () => {
          cleanupAudioResources();
        };

        await element.play();

        // eslint-disable-next-line no-console
        console.info('Harry replied:', reply);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Chat request failed:', error);
      }
    },
    [cleanupAudioResources, ensureLipsync, getAudioElement, startVisemeLoop]
  );

  return (
    <section
      {...sectionProps}
      aria-label="Talk with Harry"
      className="pointer-events-auto w-full max-w-xl rounded-3xl border border-white/15 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-3xl"
    >
      <header className="mb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/80">
          Conversation
        </p>
        <h2 className="mt-2 text-base font-medium text-white">
          Send Harry a message and he will respond in audio.
        </h2>
      </header>
      <ChatInput placeholder="Ask Harry anything…" onSend={handleSend} />
    </section>
  );
}
