import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChatInput } from './ChatInput';

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
});
