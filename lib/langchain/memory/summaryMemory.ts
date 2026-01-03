import { ChatGroq } from '@langchain/groq';
import {
  HumanMessage,
  SystemMessage,
  type AIMessage,
} from '@langchain/core/messages';
import { DEFAULT_GROQ_MODEL, resolveLangSmithProject } from '../constants';
import {
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
} from '../prompts/summary';
import { extractTextContent } from '../utils/extractTextContent';
import { type SummaryUpdateInput } from '../types';

const SESSION_TTL_MS = 60 * 60 * 1000;

type SessionMemoryEntry = {
  summary?: string;
  expiresAt: number;
};

const sessionSummaryMemory = new Map<string, SessionMemoryEntry>();

function pruneExpiredSessions(now = Date.now()): void {
  for (const [sessionId, entry] of sessionSummaryMemory.entries()) {
    if (entry.expiresAt <= now) {
      sessionSummaryMemory.delete(sessionId);
    }
  }
}

function resolveSessionEntry(
  sessionId: string,
  now = Date.now()
): SessionMemoryEntry {
  pruneExpiredSessions(now);

  const existing = sessionSummaryMemory.get(sessionId);
  if (existing && existing.expiresAt > now) {
    return existing;
  }

  const created: SessionMemoryEntry = {
    expiresAt: now + SESSION_TTL_MS,
  };
  sessionSummaryMemory.set(sessionId, created);
  return created;
}

/**
 * Generic error raised when the LLM cannot produce a refreshed summary.
 */
export class SummaryMemoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SummaryMemoryError';
  }
}

/**
 * Returns the most recent conversation summary cached for a given session.
 *
 * The cache is kept in-memory on the server and expires after one hour from the
 * time the session entry is created. When the entry expires, this returns
 * `undefined`.
 *
 * @param sessionId - Opaque, server-issued session identifier.
 */
export function getSummaryMemory(sessionId: string): string | undefined {
  if (!sessionId) {
    return undefined;
  }

  return resolveSessionEntry(sessionId).summary;
}

/**
 * Clears cached summary memory.
 *
 * - When `sessionId` is provided, clears only that session.
 * - When omitted, clears all sessions (primarily used by tests).
 *
 * @param sessionId - Optional session identifier.
 */
export function resetSummaryMemory(sessionId?: string): void {
  if (typeof sessionId === 'string') {
    sessionSummaryMemory.delete(sessionId);
    return;
  }

  sessionSummaryMemory.clear();
}

/**
 * Rebuilds the rolling summary by invoking Groq with the latest turn data.
 *
 * The refreshed summary is stored for the provided `sessionId` and will be
 * evicted automatically after one hour.
 *
 * @param input - Turn data plus the associated session id.
 */
export async function rebuildSummaryMemory(
  input: SummaryUpdateInput
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new SummaryMemoryError('GROQ_API_KEY must be configured.');
  }

  const resolvedProject = resolveLangSmithProject();
  if (!process.env.LANGCHAIN_PROJECT) {
    process.env.LANGCHAIN_PROJECT = resolvedProject;
  }
  if (!process.env.LANGSMITH_PROJECT) {
    process.env.LANGSMITH_PROJECT = resolvedProject;
  }

  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;

  const now = Date.now();
  const sessionEntry = resolveSessionEntry(input.sessionId, now);

  const previousSummary =
    typeof input.previousSummary === 'string'
      ? input.previousSummary
      : sessionEntry.summary;

  const chat = new ChatGroq({
    apiKey,
    model,
    temperature: 0.2,
    maxTokens: 512,
  });

  const response = (await chat.invoke(
    [
      new SystemMessage(buildSummarySystemPrompt()),
      new HumanMessage(
        buildSummaryUserPrompt({
          previousSummary,
          userMessage: input.userMessage,
          assistantReply: input.assistantReply,
        })
      ),
    ],
    {
      metadata: {
        project: resolvedProject,
        source: 'summaryMemory',
      },
    }
  )) as AIMessage;

  const refreshedSummary = extractTextContent(response);
  if (!refreshedSummary) {
    throw new SummaryMemoryError('Groq returned an empty summary.');
  }

  sessionEntry.summary = refreshedSummary.trim();
  sessionSummaryMemory.set(input.sessionId, sessionEntry);
  return sessionEntry.summary;
}
