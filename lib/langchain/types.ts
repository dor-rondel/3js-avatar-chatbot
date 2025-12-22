import { type SentimentValue } from '../expressions/facialExpressions';
import { type SummaryPromptInput } from './prompts/summary';

export type ExecuteChatInput = {
  message: string;
  summary?: string;
};

export type ExecuteChatResult = {
  reply: string;
  sentiment: SentimentValue;
};

export type SummaryUpdateInput = SummaryPromptInput & {
  apiKey: string;
  model: string;
};
