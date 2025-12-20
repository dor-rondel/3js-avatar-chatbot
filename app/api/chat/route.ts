import { NextResponse } from 'next/server';
import {
  ConfigurationError,
  GeminiResponseError,
  InputSanitizationError,
  executeChat,
} from '../../../lib/langchain/executeChat';

const GENERIC_ERROR_MESSAGE =
  'Unable to chat with Harry right now. Please retry.';

type ChatRequestPayload = {
  message?: unknown;
  summary?: string;
};

/**
 * Basic JSON POST handler that fans out to Gemini via LangChain.
 */
export async function POST(request: Request) {
  let payload: ChatRequestPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  if (typeof payload.message !== 'string') {
    return NextResponse.json(
      { error: 'Message is required.' },
      { status: 400 }
    );
  }

  try {
    const result = await executeChat({
      message: payload.message,
      summary: payload.summary,
    });

    return NextResponse.json({ reply: result.reply });
  } catch (error) {
    if (error instanceof InputSanitizationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof GeminiResponseError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    // eslint-disable-next-line no-console
    console.error('Chat route failed', error);
    return NextResponse.json({ error: GENERIC_ERROR_MESSAGE }, { status: 502 });
  }
}
