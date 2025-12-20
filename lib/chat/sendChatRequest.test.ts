import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatRequestError, sendChatRequest } from './sendChatRequest';

const fetchMock = vi.fn();

describe('sendChatRequest', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('returns the reply payload when the request succeeds', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          reply: 'Hello!',
          audio: { base64: 'abc', mimeType: 'audio/mpeg' },
        }),
        {
          status: 200,
        }
      )
    );

    await expect(sendChatRequest('Hi')).resolves.toEqual({
      reply: 'Hello!',
      audio: { base64: 'abc', mimeType: 'audio/mpeg' },
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/chat', expect.any(Object));
  });

  it('throws a ChatRequestError when the server responds with an error body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Nope' }), { status: 400 })
    );

    await expect(sendChatRequest('hack')).rejects.toThrow(ChatRequestError);
  });

  it('throws a generic ChatRequestError when the body is not JSON', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('not-json'));
        controller.close();
      },
    });

    fetchMock.mockResolvedValueOnce(
      new Response(stream, { status: 500, headers: { 'Content-Type': 'text' } })
    );

    await expect(sendChatRequest('Hi')).rejects.toThrow('Chat request failed.');
  });
});
