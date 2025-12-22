import { z } from 'zod';
import { SENTIMENTS } from '../expressions/facialExpressions';

export type ChatRequestPayload = {
  message?: unknown;
};

const audioPayloadSchema = z.object({
  base64: z.string(),
  mimeType: z.string(),
});

export const chatResponseSchema = z.object({
  reply: z.string(),
  sentiment: z.enum(SENTIMENTS),
  audio: audioPayloadSchema,
});

export const chatErrorSchema = z.object({ error: z.string() });

export type ChatResponsePayload = z.infer<typeof chatResponseSchema>;
export type ChatErrorPayload = z.infer<typeof chatErrorSchema>;
