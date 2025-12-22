import { describe, expect, it } from 'vitest';
import { blendExpressionPreset } from './morphTargets';
import {
  expressionMorphNames,
  type FacialExpressionPreset,
} from '@/lib/expressions/facialExpressions';
import { EXPRESSION_INTENSITY } from './constants';
import type { SkinnedMesh } from 'three';

describe('HarryAvatar morph target helpers', () => {
  it('blends the target morph influence toward preset values', () => {
    const morphName = expressionMorphNames[0];
    expect(morphName).toBeTruthy();

    const mesh = {
      morphTargetDictionary: { [morphName]: 0 },
      morphTargetInfluences: [0],
    } as unknown as SkinnedMesh;

    const targets = { [morphName]: 0.5 } as unknown as FacialExpressionPreset;

    blendExpressionPreset(mesh, targets, 1);

    const expected = Math.min(1, Math.max(0, 0.5 * EXPRESSION_INTENSITY));
    expect(mesh.morphTargetInfluences?.[0]).toBeCloseTo(expected);
  });

  it('clamps morph values to the [0, 1] range', () => {
    const morphName = expressionMorphNames[0];
    expect(morphName).toBeTruthy();

    const mesh = {
      morphTargetDictionary: { [morphName]: 0 },
      morphTargetInfluences: [0],
    } as unknown as SkinnedMesh;

    const targets = { [morphName]: 10 } as unknown as FacialExpressionPreset;

    blendExpressionPreset(mesh, targets, 1);
    expect(mesh.morphTargetInfluences?.[0]).toBeCloseTo(1);
  });

  it('is a no-op when mesh is missing morph targets', () => {
    const mesh = {
      morphTargetDictionary: null,
      morphTargetInfluences: null,
    } as unknown as SkinnedMesh;

    const targets = {} as FacialExpressionPreset;

    expect(() => blendExpressionPreset(mesh, targets, 1)).not.toThrow();
  });
});
