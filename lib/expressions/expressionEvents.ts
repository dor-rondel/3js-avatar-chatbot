import type { ExpressionName } from './facialExpressions';
import { type ExpressionListener } from './types';

const listeners = new Set<ExpressionListener>();

/**
 * Broadcasts an expression change to every subscribed listener.
 *
 * @param expression - Expression preset name to activate.
 * @returns Nothing.
 */
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

/**
 * Subscribes a listener to expression change events.
 *
 * @param listener - Callback invoked whenever an expression is emitted.
 * @returns Unsubscribe function.
 */
export function subscribeToExpressions(listener: ExpressionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
