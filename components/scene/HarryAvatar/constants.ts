import { MathUtils } from 'three';

export const GLB_PATH = '/assets/meshes/harry.glb';
export const EXPRESSION_INTENSITY = 1.25;

export const ANIMATION_FILES = {
  smile: '/assets/animations/smile.fbx',
  laugh: '/assets/animations/laugh.fbx',
  sad: '/assets/animations/sad.fbx',
  surprised: '/assets/animations/surprised.fbx',
  angry: '/assets/animations/angry.fbx',
  crazy: '/assets/animations/crazy.fbx',
  waving: '/assets/animations/waving.fbx',
} as const;

export const TRACK_PATH_DELIMITERS = /[:|]/;

/**
 * Manual orientation offsets so all animations face the user
 */
export const ORIENTATION_OFFSETS = Object.freeze({
  leanForwardDeg: 75,
  twistTowardViewerDeg: 0,
});

export const FORWARD_LEAN_RADIANS = MathUtils.degToRad(
  ORIENTATION_OFFSETS.leanForwardDeg
);
export const VIEWER_TWIST_RADIANS = MathUtils.degToRad(
  ORIENTATION_OFFSETS.twistTowardViewerDeg
);

export type AnimationClipName = keyof typeof ANIMATION_FILES;

export const CLIPS_REQUIRING_ROOT_NEUTRALIZATION: ReadonlySet<AnimationClipName> =
  new Set(['smile', 'laugh', 'sad', 'surprised', 'angry', 'crazy']);
