export type VisemeEvent = {
  /**
   * The viseme label reported by wawa-lipsync (e.g. "viseme_PP").
   */
  label: string;
  /**
   * Seconds elapsed (according to `HTMLAudioElement.currentTime`) when the viseme fired.
   */
  timestamp: number;
};

// eslint-disable-next-line no-unused-vars
export type VisemeListener = (event: VisemeEvent) => void;

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
