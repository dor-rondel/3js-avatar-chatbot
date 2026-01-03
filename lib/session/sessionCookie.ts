import { randomUUID } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'harry_session';
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60;

export type ResolvedSessionId = {
  sessionId: string;
  shouldSetCookie: boolean;
};

function safeDecodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Parses the `Cookie` header into a key/value map.
 *
 * This deliberately implements only what we need (simple `name=value` parsing)
 * so the session handling stays framework-agnostic and easy to unit test.
 */
export function parseCookieHeader(
  header: string | null
): Record<string, string> {
  if (!header) {
    return {};
  }

  const cookies: Record<string, string> = {};
  const parts = header.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex <= 0) {
      continue;
    }

    const name = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (name.length === 0 || value.length === 0) {
      continue;
    }

    cookies[name] = safeDecodeCookieValue(value);
  }

  return cookies;
}

/**
 * Accepts only UUID v1-v5 values.
 *
 * This prevents unbounded cookie values from being used as Map keys and helps
 * ensure session ids are opaque, unguessable identifiers.
 */
export function isValidSessionId(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/**
 * Resolves the session id for an incoming request.
 *
 * - If the request includes a valid session cookie, reuse it.
 * - Otherwise, generate a new UUID session id and signal that the caller should
 *   set the cookie on the response.
 */
export function resolveSessionIdFromRequest(
  request: Request,
  generateSessionId: () => string = randomUUID
): ResolvedSessionId {
  const cookies = parseCookieHeader(request.headers.get('cookie'));
  const existing = cookies[SESSION_COOKIE_NAME];

  if (isValidSessionId(existing)) {
    return { sessionId: existing, shouldSetCookie: false };
  }

  return { sessionId: generateSessionId(), shouldSetCookie: true };
}
