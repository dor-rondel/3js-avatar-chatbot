'use client';

import { useCallback, type HTMLAttributes } from 'react';
import { ChatInput } from './ChatInput';
import { sendChatRequest } from '../../lib/chat/sendChatRequest';

type ChatPanelProps = Omit<HTMLAttributes<HTMLElement>, 'children'>;

/**
 * Renders the floating chat panel overlay that collects user prompts for Harry.
 * Currently front-end only; it forwards messages to the eventual TTS pipeline via `handleSend`.
 */
export function ChatPanel(sectionProps: ChatPanelProps = {}) {
  const handleSend = useCallback(async (text: string) => {
    try {
      const { reply, audio } = await sendChatRequest(text);
      const audioSrc = `data:${audio.mimeType};base64,${audio.base64}`;

      // eslint-disable-next-line no-console
      console.info('Harry replied:', reply, 'Audio ready:', audioSrc.length);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Chat request failed:', error);
    }
  }, []);

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
