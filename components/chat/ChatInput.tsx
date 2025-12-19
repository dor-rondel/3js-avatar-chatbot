'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

type ChatInputProps = {
  placeholder?: string;
  // eslint-disable-next-line no-unused-vars
  onSend: (message: string) => Promise<void> | void;
};

/**
 * Autogrowing textarea with send button + Enter shortcut.
 */
export function ChatInput({ placeholder, onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [message, resizeTextarea]);

  const sendMessage = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) {
      return;
    }

    try {
      setIsSending(true);
      await onSend(trimmed);
      setMessage('');
    } finally {
      setIsSending(false);
    }
  }, [isSending, message, onSend]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="flex items-end gap-3">
      <textarea
        ref={textareaRef}
        className="min-h-[42px] max-h-40 flex-1 resize-none rounded-2xl border border-white/20 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner outline-none transition focus:border-amber-300 focus:shadow-[0_0_0_1px_rgba(251,191,36,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
        placeholder={placeholder}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={isSending}
        aria-label="Message"
      />
      <button
        className="rounded-full bg-gradient-to-br from-amber-300 to-pink-400 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        type="button"
        onClick={() => void sendMessage()}
        disabled={!message.trim() || isSending}
      >
        Send
      </button>
    </div>
  );
}
