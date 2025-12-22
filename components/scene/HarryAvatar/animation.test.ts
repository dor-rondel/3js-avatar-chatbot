import { describe, expect, it } from 'vitest';
import {
  AnimationClip,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
} from 'three';
import {
  neutralizeRootRotation,
  normalizeTrackName,
  prepareAnimationClip,
  resolveClipForExpression,
} from './animation';
import type { AnimationClipName } from './constants';
import type { ExpressionName } from '@/lib/expressions/facialExpressions';

describe('HarryAvatar animation helpers', () => {
  it('neutralizeRootRotation aligns first keyframe to target orientation when provided', () => {
    const base = new Quaternion(0, 0, 0, 1);
    const target = new Quaternion().setFromAxisAngle(
      new Vector3(0, 1, 0),
      Math.PI / 3
    );

    const track = new QuaternionKeyframeTrack(
      'Hips.quaternion',
      [0, 1],
      [base.x, base.y, base.z, base.w, base.x, base.y, base.z, base.w]
    );

    neutralizeRootRotation(track, target);

    expect(track.values[0]).toBeCloseTo(target.x);
    expect(track.values[1]).toBeCloseTo(target.y);
    expect(track.values[2]).toBeCloseTo(target.z);
    expect(track.values[3]).toBeCloseTo(target.w);
  });

  it('neutralizeRootRotation neutralizes first keyframe to identity when no target is provided', () => {
    const base = new Quaternion().setFromAxisAngle(
      new Vector3(1, 0, 0),
      Math.PI / 4
    );

    const track = new QuaternionKeyframeTrack(
      'Hips.quaternion',
      [0],
      [base.x, base.y, base.z, base.w]
    );

    neutralizeRootRotation(track);

    expect(track.values[0]).toBeCloseTo(0);
    expect(track.values[1]).toBeCloseTo(0);
    expect(track.values[2]).toBeCloseTo(0);
    expect(track.values[3]).toBeCloseTo(1);
  });

  it('normalizeTrackName handles Mixamo/Armature prefixes', () => {
    expect(normalizeTrackName('NoDotName')).toBe('NoDotName');
    expect(normalizeTrackName('Armature.quaternion')).toBe('Hips.quaternion');
    expect(normalizeTrackName('Armature:Hips.quaternion')).toBe(
      'Hips.quaternion'
    );
    expect(normalizeTrackName('Armature:mixamorigLeftArm.quaternion')).toBe(
      'LeftArm.quaternion'
    );
    expect(normalizeTrackName('mixamorig.quaternion')).toBe('Hips.quaternion');
  });

  it('resolveClipForExpression returns null for non-clip expressions', () => {
    expect(resolveClipForExpression('smile' as ExpressionName)).toBe('smile');
    expect(resolveClipForExpression('not-real' as ExpressionName)).toBeNull();
  });

  it('prepareAnimationClip removes root position/scale and normalizes track names', () => {
    const base = new Quaternion().setFromAxisAngle(
      new Vector3(0, 1, 0),
      Math.PI / 7
    );
    const target = new Quaternion().setFromAxisAngle(
      new Vector3(0, 1, 0),
      Math.PI / 2
    );

    const rootQuat = new QuaternionKeyframeTrack(
      'Armature:mixamorigHips.quaternion',
      [0],
      [base.x, base.y, base.z, base.w]
    );
    const rootScale = new VectorKeyframeTrack('Hips.scale', [0], [1, 1, 1]);
    const rootPos = new VectorKeyframeTrack('Hips.position', [0], [0, 0, 0]);
    const spineQuat = new QuaternionKeyframeTrack(
      'Spine.quaternion',
      [0],
      [0, 0, 0, 1]
    );

    const source = new AnimationClip('source', -1, [
      rootQuat,
      rootScale,
      rootPos,
      spineQuat,
    ]);

    const prepared = prepareAnimationClip(
      source,
      'smile' as AnimationClipName,
      target
    );

    expect(prepared).not.toBeNull();
    expect(prepared?.name).toBe('smile');

    const trackNames = prepared?.tracks.map((track) => track.name) ?? [];
    expect(trackNames).toContain('Hips.quaternion');
    expect(trackNames).toContain('Spine.quaternion');
    expect(trackNames).not.toContain('Hips.scale');
    expect(trackNames).not.toContain('Hips.position');

    const preparedRoot = prepared?.tracks.find(
      (track) => track.name === 'Hips.quaternion'
    ) as QuaternionKeyframeTrack | undefined;

    expect(preparedRoot).toBeDefined();
    expect(preparedRoot?.values[0]).toBeCloseTo(target.x);
    expect(preparedRoot?.values[1]).toBeCloseTo(target.y);
    expect(preparedRoot?.values[2]).toBeCloseTo(target.z);
    expect(preparedRoot?.values[3]).toBeCloseTo(target.w);
  });

  it('prepareAnimationClip does not neutralize root quaternion for clips not in the neutralization set', () => {
    const base = new Quaternion().setFromAxisAngle(
      new Vector3(0, 1, 0),
      Math.PI / 7
    );

    const rootQuat = new QuaternionKeyframeTrack(
      'Armature:mixamorigHips.quaternion',
      [0],
      [base.x, base.y, base.z, base.w]
    );

    const source = new AnimationClip('source', -1, [rootQuat]);
    const prepared = prepareAnimationClip(
      source,
      'waving' as AnimationClipName
    );

    const preparedRoot = prepared?.tracks[0] as
      | QuaternionKeyframeTrack
      | undefined;
    expect(preparedRoot?.name).toBe('Hips.quaternion');
    expect(preparedRoot?.values[0]).toBeCloseTo(base.x);
    expect(preparedRoot?.values[1]).toBeCloseTo(base.y);
    expect(preparedRoot?.values[2]).toBeCloseTo(base.z);
    expect(preparedRoot?.values[3]).toBeCloseTo(base.w);
  });
});
