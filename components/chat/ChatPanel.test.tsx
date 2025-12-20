import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ChatPanel } from './ChatPanel';

const { sendChatRequestMock } = vi.hoisted(() => ({
  sendChatRequestMock: vi.fn(),
}));

vi.mock('../../lib/chat/sendChatRequest', () => ({
  sendChatRequest: sendChatRequestMock,
}));

describe('ChatPanel', () => {
  beforeEach(() => {
    sendChatRequestMock.mockReset();
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

  it('posts user text to the chat endpoint when sending', async () => {
    sendChatRequestMock.mockResolvedValueOnce('Hi!');
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
      expect(sendChatRequestMock).toHaveBeenCalledWith('Wingardium Leviosa');
    });
  });
});
