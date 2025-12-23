'use client';

import { useCallback, type HTMLAttributes } from 'react';
import { ChatInput } from '../ChatInput';
import { sendChatRequest } from '@/lib/chat/sendChatRequest';
import { useChatAudioPlayback } from './useChatAudioPlayback';

type ChatPanelProps = Omit<HTMLAttributes<HTMLElement>, 'children'>;

/**
 * Renders the floating chat panel overlay that collects user prompts for Harry.
 * Currently front-end only; it forwards messages to the eventual TTS pipeline via `handleSend`.
 *
 * @param sectionProps - Optional props forwarded to the wrapping `section` element.
 * @returns The chat panel UI.
 */
export function ChatPanel(sectionProps: ChatPanelProps = {}) {
  const { playResponseAudio } = useChatAudioPlayback();

  /**
   * Sends the prompt to the chat API, converts the returned base64 audio into a playable source,
   * and hands the element to the lipsync pipeline.
   *
   * @param text - User prompt text.
   * @returns Resolves when playback has been started.
   */
  const handleSend = useCallback(
    async (text: string) => {
      try {
        const { audio, sentiment } = await sendChatRequest(text);
        await playResponseAudio({ audio, sentiment });
      } catch (error) {
        if (
          typeof window !== 'undefined' &&
          typeof window.alert === 'function'
        ) {
          window.alert('Something went wrong. Please try again.');
        }

        throw error;
      }
    },
    [playResponseAudio]
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
