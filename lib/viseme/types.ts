export type VisemeEvent = {
  /** Viseme label reported by wawa-lipsync (e.g., "viseme_PP"). */
  label: string;
  /** Seconds elapsed when the viseme fired (matches HTMLAudioElement.currentTime). */
  timestamp: number;
};

// eslint-disable-next-line no-unused-vars
export type VisemeListener = (event: VisemeEvent) => void;
