import { NextResponse } from 'next/server';
import {
  ConfigurationError,
  GroqResponseError,
  InputSanitizationError,
  SummaryMemoryError,
  executeChat,
} from '@/lib/langchain/executeChat';
import { type ChatRequestPayload } from '@/lib/chat/types';
import {
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  resolveSessionIdFromRequest,
} from '@/lib/session/sessionCookie';
import {
  ElevenLabsConfigurationError,
  ElevenLabsSynthesisError,
  synthesizeSpeech,
} from '@/lib/voice/synthesizeWithElevenLabs';

const GENERIC_ERROR_MESSAGE =
  'Unable to chat with Harry right now. Please retry.';

/**
 * Basic JSON POST handler that fans out to Groq via LangChain.
 *
 * @param request - Incoming request.
 * @returns JSON response containing reply, sentiment, and audio (or an error).
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

  const { sessionId, shouldSetCookie } = resolveSessionIdFromRequest(request);

  try {
    const result = await executeChat({
      sessionId,
      message: payload.message,
    });

    const audio = await synthesizeSpeech({ text: result.reply });

    const response = NextResponse.json({
      reply: result.reply,
      sentiment: result.sentiment,
      audio,
    });

    if (shouldSetCookie) {
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: sessionId,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      });
    }

    return response;
  } catch (error) {
    if (error instanceof InputSanitizationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (
      error instanceof ConfigurationError ||
      error instanceof ElevenLabsConfigurationError
    ) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (
      error instanceof GroqResponseError ||
      error instanceof ElevenLabsSynthesisError ||
      error instanceof SummaryMemoryError
    ) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    // eslint-disable-next-line no-console
    console.error('Chat route failed', error);
    return NextResponse.json({ error: GENERIC_ERROR_MESSAGE }, { status: 502 });
  }
}
