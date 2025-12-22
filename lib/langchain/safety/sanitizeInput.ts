const MAX_MESSAGE_LENGTH = 2000;

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all|previous)\s+(?:rules|instructions)/i,
  /system\s+prompt/i,
  /forget\s+what\s+I\s+said/i,
  /pretend\s+to\s+be\s+/i,
  /you\s+are\s+no\s+longer/i,
];

export class InputSanitizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InputSanitizationError';
  }
}

/**
 * Normalizes user input and rejects common prompt-injection phrasing.
 *
 * @param input - User-provided message.
 * @returns Sanitized message string.
 * @throws {InputSanitizationError} When the message is invalid or suspicious.
 */
export function sanitizeUserMessage(input: unknown): string {
  if (typeof input !== 'string') {
    throw new InputSanitizationError('Message must be a string.');
  }

  const trimmed = input.trim();
  if (!trimmed) {
    throw new InputSanitizationError('Message cannot be empty.');
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new InputSanitizationError('Message exceeds length limit.');
  }

  const suspicious = PROMPT_INJECTION_PATTERNS.find((pattern) =>
    pattern.test(trimmed)
  );

  if (suspicious) {
    throw new InputSanitizationError(
      'Message rejected due to suspected prompt-injection attempt.'
    );
  }

  return trimmed;
}
