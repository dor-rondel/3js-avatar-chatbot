/**
 * Ordered list of sentiment labels the LLM is allowed to emit and the avatar understands.
 */
export const SENTIMENTS = [
  'happy',
  'funny',
  'sad',
  'surprised',
  'angry',
  'crazy',
] as const;

/**
 * Union of every supported sentiment string literal.
 */
export type SentimentValue = (typeof SENTIMENTS)[number];

/**
 * Describes a set of morph target values keyed by ARKit-like blendshape names.
 */
export type FacialExpressionPreset = Readonly<Record<string, number>>;

/**
 * Hand-authored presets tuned for the Harry avatar.
 */
const facialExpressionPresets = {
  default: {},
  smile: {
    browInnerUp: 0.17,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.44,
    noseSneerLeft: 0.1700000727403593,
    noseSneerRight: 0.14000002836874015,
    mouthPressLeft: 0.61,
    mouthPressRight: 0.41000000000000003,
  },
  laugh: {
    jawLeft: 0.63,
    mouthPucker: 0.53,
    noseSneerLeft: 1,
    noseSneerRight: 0.39,
    mouthLeft: 1,
    eyeLookUpLeft: 1,
    eyeLookUpRight: 1,
    cheekPuff: 0.9999924982764238,
    mouthDimpleLeft: 0.414743888682652,
    mouthRollLower: 0.32,
    mouthSmileLeft: 0.35499733688813034,
    mouthSmileRight: 0.35499733688813034,
  },
  sad: {
    mouthFrownLeft: 1,
    mouthFrownRight: 1,
    mouthShrugLower: 0.78341,
    browInnerUp: 0.452,
    eyeSquintLeft: 0.72,
    eyeSquintRight: 0.75,
    eyeLookDownLeft: 0.5,
    eyeLookDownRight: 0.5,
    jawForward: 1,
  },
  surprised: {
    eyeWideLeft: 0.5,
    eyeWideRight: 0.5,
    jawOpen: 0.351,
    mouthFunnel: 1,
    browInnerUp: 1,
  },
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    jawForward: 1,
    jawLeft: 1,
    mouthShrugLower: 1,
    noseSneerLeft: 1,
    noseSneerRight: 0.42,
    eyeLookDownLeft: 0.16,
    eyeLookDownRight: 0.16,
    cheekSquintLeft: 1,
    cheekSquintRight: 1,
    mouthClose: 0.23,
    mouthFunnel: 0.63,
    mouthDimpleRight: 1,
  },
  crazy: {
    browInnerUp: 0.9,
    jawForward: 1,
    noseSneerLeft: 0.5700000000000001,
    noseSneerRight: 0.51,
    eyeLookDownLeft: 0.39435766259644545,
    eyeLookUpRight: 0.4039761421719682,
    eyeLookInLeft: 0.9618479575523053,
    eyeLookInRight: 0.9618479575523053,
    jawOpen: 0.9618479575523053,
    mouthDimpleLeft: 0.9618479575523053,
    mouthDimpleRight: 0.9618479575523053,
    mouthStretchLeft: 0.27893590769016857,
    mouthStretchRight: 0.2885543872656917,
    mouthSmileLeft: 0.5578718153803371,
    mouthSmileRight: 0.38473918302092225,
    tongueOut: 0.9618479575523053,
  },
} satisfies Record<string, FacialExpressionPreset>;

export const facialExpressions = facialExpressionPresets;

export type ExpressionName = keyof typeof facialExpressionPresets;

/**
 * Maps high-level sentiment decisions to the closest facial preset.
 */
const SENTIMENT_TO_EXPRESSION: Record<SentimentValue, ExpressionName> = {
  happy: 'smile',
  funny: 'laugh',
  sad: 'sad',
  surprised: 'surprised',
  angry: 'angry',
  crazy: 'crazy',
};

/**
 * Resolves the preset key that should be blended when a sentiment is received.
 *
 * @param sentiment - Sentiment label from the LLM.
 * @returns Facial expression preset name.
 */
export function resolveExpressionForSentiment(
  sentiment: SentimentValue
): ExpressionName {
  return SENTIMENT_TO_EXPRESSION[sentiment] ?? 'default';
}

/**
 * All morph targets referenced by any preset, deduplicated for efficient blending.
 */
export const expressionMorphNames = Array.from(
  new Set(
    Object.values(facialExpressions).flatMap((preset) => Object.keys(preset))
  )
);
