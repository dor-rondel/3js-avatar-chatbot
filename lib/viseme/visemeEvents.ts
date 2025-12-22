import { type VisemeEvent, type VisemeListener } from './types';

const listeners = new Set<VisemeListener>();

export function emitViseme(event: VisemeEvent) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Viseme listener failed', error);
    }
  });
}

export function subscribeToVisemes(listener: VisemeListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
