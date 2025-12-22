import type { ExpressionName } from './facialExpressions';
import { type ExpressionListener } from './types';

const listeners = new Set<ExpressionListener>();

export function emitExpression(expression: ExpressionName) {
  listeners.forEach((listener) => {
    try {
      listener(expression);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Expression listener failed', error);
    }
  });
}

export function subscribeToExpressions(listener: ExpressionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
