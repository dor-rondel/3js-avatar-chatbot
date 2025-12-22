import { Activity } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';

type ChatOverlayProps = {
  /** True when the scene is zoomed out and the chat should be hidden. */
  isHidden: boolean;
};

/**
 * Renders the chat UI overlay on top of the stage canvas.
 *
 * The overlay is hidden while zoomed out (wide mode) to emphasize the stage.
 *
 * @param props - Component props.
 * @param props.isHidden - Whether to visually hide the chat overlay.
 * @returns The chat overlay layer.
 */
export default function ChatOverlay({ isHidden }: ChatOverlayProps) {
  const chatOverlayClasses = [
    'pointer-events-none absolute inset-0 flex items-end justify-center px-4 pb-8 transition-all duration-500 ease-out',
    isHidden ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0',
  ].join(' ');

  return (
    <Activity mode={isHidden ? 'hidden' : 'visible'}>
      <div className={chatOverlayClasses}>
        <ChatPanel data-activity-state={isHidden ? 'hidden' : 'visible'} />
      </div>
    </Activity>
  );
}
