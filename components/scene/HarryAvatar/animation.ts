import { Quaternion, QuaternionKeyframeTrack, type AnimationClip } from 'three';
import type { ExpressionName } from '@/lib/expressions/facialExpressions';
import {
  ANIMATION_FILES,
  CLIPS_REQUIRING_ROOT_NEUTRALIZATION,
  TRACK_PATH_DELIMITERS,
  type AnimationClipName,
} from './constants';

/**
 * Rewrites a quaternion track in-place so its root orientation is neutralized.
 *
 * When `targetOrientation` is provided, the first keyframe is reoriented to match it.
 * When omitted, the first keyframe is neutralized to identity.
 *
 * @param track - Quaternion track to mutate.
 * @param targetOrientation - Optional quaternion to align the first keyframe to.
 * @returns {void}
 */
export function neutralizeRootRotation(
  track: QuaternionKeyframeTrack,
  targetOrientation?: Quaternion
) {
  const { values } = track;
  if (values.length < 4) {
    return;
  }

  const baseOrientation = new Quaternion(
    values[0],
    values[1],
    values[2],
    values[3]
  ).normalize();
  const inverseBase = baseOrientation.clone().invert();
  const neutralizer = targetOrientation
    ? targetOrientation.clone().multiply(inverseBase)
    : inverseBase;

  for (let index = 0; index < values.length; index += 4) {
    const rotation = new Quaternion(
      values[index],
      values[index + 1],
      values[index + 2],
      values[index + 3]
    );
    rotation.premultiply(neutralizer).normalize();
    values[index] = rotation.x;
    values[index + 1] = rotation.y;
    values[index + 2] = rotation.z;
    values[index + 3] = rotation.w;
  }
}

/**
 * Normalizes Mixamo-style track names so they match the GLB skeleton (strip Armature/mixamorig prefixes).
 *
 * @param originalName - Original track name (e.g. Mixamo or FBX source naming).
 * @returns Normalized track name matching the GLB skeleton.
 */
export function normalizeTrackName(originalName: string): string {
  const dotIndex = originalName.indexOf('.');
  if (dotIndex === -1) {
    return originalName;
  }

  const rawNodePath = originalName.slice(0, dotIndex);
  const propertyPath = originalName.slice(dotIndex + 1);

  const pathSegments = rawNodePath
    .split(TRACK_PATH_DELIMITERS)
    .map((segment) => segment.trim())
    .filter(Boolean);

  let normalizedNode = pathSegments[pathSegments.length - 1] ?? rawNodePath;

  if (normalizedNode.toLowerCase() === 'armature') {
    normalizedNode = 'Hips';
  }

  normalizedNode = normalizedNode.replace(/^mixamorig/i, '');
  if (!normalizedNode) {
    normalizedNode = 'Hips';
  }

  return `${normalizedNode}.${propertyPath}`;
}

/**
 * Maps a facial expression name into the corresponding animation clip name (when one exists).
 *
 * @param expression - Expression label (sentiment-derived).
 * @returns Clip name to play, or `null` when no clip is associated.
 */
export function resolveClipForExpression(
  expression: ExpressionName
): AnimationClipName | null {
  return expression in ANIMATION_FILES
    ? (expression as AnimationClipName)
    : null;
}

/**
 * Creates a prepared copy of an FBX clip so we can safely mix it with the GLB skeleton.
 * Removes root transforms that would teleport/scale the avatar, then updates track names.
 *
 * @param source - Source clip from FBX.
 * @param name - Clip name to assign.
 * @param targetRootQuaternion - Optional root quaternion to normalize against.
 * @returns A cloned, prepared clip or `null` when source is missing.
 */
export function prepareAnimationClip(
  source: AnimationClip | undefined,
  name: AnimationClipName,
  targetRootQuaternion?: Quaternion
): AnimationClip | null {
  if (!source) {
    return null;
  }

  const preparedClip = source.clone();
  preparedClip.name = name;
  preparedClip.tracks = preparedClip.tracks
    .filter((track) => {
      const property = track.name.split('.').pop();
      const isRoot = track.name.includes('Hips');
      if (!isRoot) {
        return true;
      }

      return property !== 'scale' && property !== 'position';
    })
    .map((track) => {
      const property = track.name.split('.').pop();
      const isRoot = track.name.includes('Hips');
      if (
        CLIPS_REQUIRING_ROOT_NEUTRALIZATION.has(name) &&
        isRoot &&
        property === 'quaternion' &&
        track instanceof QuaternionKeyframeTrack
      ) {
        neutralizeRootRotation(track, targetRootQuaternion);
      }

      track.name = normalizeTrackName(track.name);
      return track;
    });

  return preparedClip;
}
