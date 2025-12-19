import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ChatPanel } from './ChatPanel';

describe('ChatPanel', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders the conversational prompt and input placeholder', () => {
    render(<ChatPanel />);

    expect(
      screen.getByText('Send Harry a message and he will respond in audio.')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Ask Harry anything/)
    ).toBeInTheDocument();
  });

  it('forwards user text to the backend queue when sending', async () => {
    render(<ChatPanel />);

    const textarea = screen.getByLabelText('Message');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Wingardium Leviosa' } });
    });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Queued TTS request:',
        'Wingardium Leviosa'
      );
    });
  });
});
