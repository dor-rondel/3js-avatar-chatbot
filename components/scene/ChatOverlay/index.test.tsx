import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatOverlay from '.';

vi.mock('@/components/chat/ChatPanel', () => ({
  ChatPanel: ({ ...props }: { [key: string]: unknown }) => (
    <div aria-label="Talk with Harry" {...props} />
  ),
}));

describe('ChatOverlay', () => {
  it('marks the chat panel as visible when not hidden', () => {
    render(<ChatOverlay isHidden={false} />);
    expect(screen.getByLabelText('Talk with Harry')).toHaveAttribute(
      'data-activity-state',
      'visible'
    );
  });

  it('marks the chat panel as hidden when hidden', () => {
    render(<ChatOverlay isHidden />);
    expect(screen.getByLabelText('Talk with Harry')).toHaveAttribute(
      'data-activity-state',
      'hidden'
    );
  });
});
