import { describe, expect, it, vi } from 'vitest';

import {
  SESSION_COOKIE_NAME,
  isValidSessionId,
  parseCookieHeader,
  resolveSessionIdFromRequest,
} from './sessionCookie';

describe('sessionCookie', () => {
  it('parses cookie headers into a map', () => {
    expect(parseCookieHeader('first=one; second=two')).toEqual({
      first: 'one',
      second: 'two',
    });
  });

  it('treats invalid percent-encoding as raw value', () => {
    expect(parseCookieHeader('first=%E0%A4%A')).toEqual({
      first: '%E0%A4%A',
    });
  });

  it('validates UUIDs and rejects non-UUID values', () => {
    expect(isValidSessionId('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isValidSessionId('not-a-uuid')).toBe(false);
  });

  it('generates a new session id when cookie is missing', () => {
    const generateSessionId = vi.fn(() => 'generated-session');

    const { sessionId, shouldSetCookie } = resolveSessionIdFromRequest(
      new Request('http://localhost/api/chat', {
        headers: {},
      }),
      generateSessionId
    );

    expect(sessionId).toBe('generated-session');
    expect(shouldSetCookie).toBe(true);
    expect(generateSessionId).toHaveBeenCalledOnce();
  });

  it('reuses existing session id when cookie is valid', () => {
    const existing = '123e4567-e89b-12d3-a456-426614174000';
    const generateSessionId = vi.fn(() => 'should-not-be-used');

    const { sessionId, shouldSetCookie } = resolveSessionIdFromRequest(
      new Request('http://localhost/api/chat', {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${existing}`,
        },
      }),
      generateSessionId
    );

    expect(sessionId).toBe(existing);
    expect(shouldSetCookie).toBe(false);
    expect(generateSessionId).not.toHaveBeenCalled();
  });

  it('rotates session id when cookie value is invalid', () => {
    const generateSessionId = vi.fn(() => 'new-session');

    const { sessionId, shouldSetCookie } = resolveSessionIdFromRequest(
      new Request('http://localhost/api/chat', {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=not-a-uuid`,
        },
      }),
      generateSessionId
    );

    expect(sessionId).toBe('new-session');
    expect(shouldSetCookie).toBe(true);
    expect(generateSessionId).toHaveBeenCalledOnce();
  });
});
