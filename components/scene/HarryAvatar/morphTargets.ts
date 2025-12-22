import {
  expressionMorphNames,
  type FacialExpressionPreset,
} from '@/lib/expressions/facialExpressions';
import type { SkinnedMesh } from 'three';
import { EXPRESSION_INTENSITY } from './constants';

/**
 * Applies the current preset to a mesh that exposes compatible morph targets.
 *
 * @param mesh - Skinned mesh to mutate.
 * @param targets - Expression preset mapping morph names to target values.
 * @param lerpAmount - Blend factor (0-1) applied per frame.
 * @returns {void}
 */
export function blendExpressionPreset(
  mesh: SkinnedMesh | undefined,
  targets: FacialExpressionPreset,
  lerpAmount: number
) {
  if (!mesh) {
    return;
  }

  const dictionary = mesh.morphTargetDictionary;
  const influences = mesh.morphTargetInfluences;
  if (!dictionary || !influences) {
    return;
  }

  for (const morphName of expressionMorphNames) {
    const targetIndex = dictionary[morphName];
    if (typeof targetIndex !== 'number') {
      continue;
    }

    const targetValue = Math.min(
      1,
      Math.max(0, (targets[morphName] ?? 0) * EXPRESSION_INTENSITY)
    );
    const currentValue = influences[targetIndex] ?? 0;
    const nextValue = currentValue + (targetValue - currentValue) * lerpAmount;
    influences[targetIndex] = nextValue;
  }
}
