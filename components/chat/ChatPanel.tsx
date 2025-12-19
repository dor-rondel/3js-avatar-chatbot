'use client';

import { useCallback } from 'react';
import { ChatInput } from './ChatInput';

export function ChatPanel() {
  const handleSend = useCallback(async (text: string) => {
    // Backend wiring will store and process the full transcript.
    // eslint-disable-next-line no-console
    console.info('Queued TTS request:', text);
  }, []);

  return (
    <section
      className="pointer-events-auto w-full max-w-xl rounded-3xl border border-white/15 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-3xl"
      aria-label="Talk with Harry"
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
