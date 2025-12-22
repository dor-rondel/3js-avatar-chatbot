import {
  chatErrorSchema,
  chatResponseSchema,
  type ChatResponsePayload,
} from './types';

async function safeParseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export class ChatRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ChatRequestError';
    this.status = status;
  }
}

/**
 * Sends a minimal POST request to the chat endpoint and returns the reply text.
 */
export async function sendChatRequest(
  message: string
): Promise<ChatResponsePayload> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorBody = await safeParseJson(response);
    const parsed = errorBody && chatErrorSchema.safeParse(errorBody);
    const errorMessage = parsed?.success
      ? parsed.data.error
      : 'Chat request failed.';

    throw new ChatRequestError(errorMessage, response.status);
  }

  const payload = await response.json();
  return chatResponseSchema.parse(payload);
}
