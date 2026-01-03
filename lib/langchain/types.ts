import { type SentimentValue } from '../expressions/facialExpressions';
import { type SummaryPromptInput } from './prompts/summary';

export type ExecuteChatInput = {
  sessionId: string;
  message: string;
  summary?: string;
};

export type ExecuteChatResult = {
  reply: string;
  sentiment: SentimentValue;
};

export type SummaryUpdateInput = SummaryPromptInput & {
  sessionId: string;
};
