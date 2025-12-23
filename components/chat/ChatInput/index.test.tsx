import { describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ChatInput } from '.';

describe('ChatInput', () => {
  it('autogrows the textarea as text expands', async () => {
    render(<ChatInput onSend={vi.fn()} placeholder="Test" />);

    const textarea = screen.getByLabelText('Message') as HTMLTextAreaElement;
    const initialHeight = textarea.style.height;

    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      value: 120,
    });

    await act(async () => {
      fireEvent.change(textarea, {
        target: { value: 'First line\nSecond line\nThird line' },
      });
    });

    expect(textarea.style.height).toBe('120px');
    expect(textarea.style.height).not.toBe(initialHeight);
  });

  it('submits via Enter key without shift', async () => {
    const handleSend = vi.fn().mockResolvedValue(undefined);
    render(<ChatInput onSend={handleSend} />);

    const textarea = screen.getByLabelText('Message');

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Expecto Patronum' } });
    });

    await act(async () => {
      fireEvent.keyDown(textarea, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(handleSend).toHaveBeenCalledWith('Expecto Patronum');
    });
  });

  it('shows a loading spinner while sending', async () => {
    let resolveSend: (() => void) | null = null;
    const handleSend = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        })
    );

    render(<ChatInput onSend={handleSend} />);

    const textarea = screen.getByLabelText('Message');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Lumos' } });
    });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(sendButton).toBeDisabled();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();

    await act(async () => {
      resolveSend?.();
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument();
    });
  });
});
