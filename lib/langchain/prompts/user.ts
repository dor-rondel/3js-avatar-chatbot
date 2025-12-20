export type UserPromptInput = {
  /**
   * Most recent user utterance after local sanitization.
   */
  message: string;
  /**
   * Optional rolling summary representing prior turns.
   * Future PRs will populate this to keep prompts lightweight.
   */
  summary?: string;
};

/**
 * Builds the human-readable payload forwarded to Gemini.
 */
export function buildUserPrompt({ message, summary }: UserPromptInput): string {
  const summaryBlock = summary?.trim()
    ? `Conversation summary so far:\n${summary.trim()}\n`
    : 'Conversation summary so far: (no prior turns)\n';

  return [
    summaryBlock,
    'Latest guest message:',
    message,
    '\nRespond as Harry and keep the reply under 120 words.',
  ].join('\n');
}
