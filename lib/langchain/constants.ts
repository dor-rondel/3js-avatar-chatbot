export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
export const LANGSMITH_PROJECT = 'harry-potter-3d-chatbot';

export function resolveLangSmithProject(): string {
  const configuredLangchain = process.env.LANGCHAIN_PROJECT?.trim();
  if (configuredLangchain) {
    return configuredLangchain;
  }

  const configuredLangsmith = process.env.LANGSMITH_PROJECT?.trim();
  if (configuredLangsmith) {
    return configuredLangsmith;
  }

  return LANGSMITH_PROJECT;
}
