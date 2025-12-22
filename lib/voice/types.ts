export type SynthesizedAudio = {
  base64: string;
  mimeType: string;
};

export type SynthesizeSpeechInput = {
  /** Assistant text to convert into audio. */
  text: string;
};
