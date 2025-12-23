const MAX_SUMMARY_SENTENCES = 10;

export type SummaryPromptInput = {
  userMessage: string;
  assistantReply: string;
  previousSummary?: string;
};

/**
 * System instructions for the model when rebuilding the rolling conversation summary.
 */
export function buildSummarySystemPrompt(): string {
  return 'You are a diligent note-taker who maintains a concise recap of a chat between Harry Potter and a guest.';
}

/**
 * Human-readable payload that describes the latest turn and previous summary.
 */
export function buildSummaryUserPrompt({
  previousSummary,
  userMessage,
  assistantReply,
}: SummaryPromptInput): string {
  const prior = previousSummary?.trim() || 'No prior summary available.';

  return [
    'You maintain a rolling summary of a conversation with Harry Potter.',
    `Rewrite the summary from scratch using at most ${MAX_SUMMARY_SENTENCES} sentences.`,
    'Capture the emotional tone only when it affects future turns.',
    'Avoid bullet points, numbered lists, or JSON—respond with plain sentences.',
    `Previous summary:\n${prior}`,
    `Latest guest message:\n${userMessage}`,
    `Harry's latest reply:\n${assistantReply}`,
    'Return the refreshed summary now.',
  ].join('\n\n');
}
