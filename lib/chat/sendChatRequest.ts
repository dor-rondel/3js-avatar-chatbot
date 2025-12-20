import { z } from 'zod';

const replySchema = z.object({
  reply: z.string(),
  audio: z.object({
    base64: z.string(),
    mimeType: z.string(),
  }),
});
const errorSchema = z.object({ error: z.string() });

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
export type ChatResponse = z.infer<typeof replySchema>;

export async function sendChatRequest(message: string): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorBody = await safeParseJson(response);
    const parsed = errorBody && errorSchema.safeParse(errorBody);
    const errorMessage = parsed?.success
      ? parsed.data.error
      : 'Chat request failed.';

    throw new ChatRequestError(errorMessage, response.status);
  }

  const payload = await response.json();
  return replySchema.parse(payload);
}
