'use client';

import { useCallback, useEffect, useMemo, useRef, type JSX } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useFBX, useAnimations } from '@react-three/drei';
import type { GLTF } from 'three-stdlib';
import {
  Euler,
  LoopOnce,
  MathUtils,
  Quaternion,
  QuaternionKeyframeTrack,
  type AnimationClip,
  type AnimationAction,
  type Group,
  type MeshStandardMaterial,
  type SkinnedMesh,
} from 'three';
import { subscribeToVisemes } from '@/lib/viseme/visemeEvents';
import {
  expressionMorphNames,
  facialExpressions,
  type ExpressionName,
  type FacialExpressionPreset,
} from '@/lib/expressions/facialExpressions';
import { subscribeToExpressions } from '@/lib/expressions/expressionEvents';

type GLTFResult = GLTF & {
  nodes: {
    Hips: Group;
    EyeLeft: SkinnedMesh;
    EyeRight: SkinnedMesh;
    Wolf3D_Head: SkinnedMesh;
    Wolf3D_Teeth: SkinnedMesh;
    Wolf3D_Hair: SkinnedMesh;
    Wolf3D_Glasses: SkinnedMesh;
    Wolf3D_Outfit_Top: SkinnedMesh;
    Wolf3D_Outfit_Bottom: SkinnedMesh;
    Wolf3D_Outfit_Footwear: SkinnedMesh;
    Wolf3D_Body: SkinnedMesh;
  };
  materials: {
    Wolf3D_Eye: MeshStandardMaterial;
    Wolf3D_Skin: MeshStandardMaterial;
    Wolf3D_Teeth: MeshStandardMaterial;
    Wolf3D_Hair: MeshStandardMaterial;
    Wolf3D_Glasses: MeshStandardMaterial;
    Wolf3D_Outfit_Top: MeshStandardMaterial;
    Wolf3D_Outfit_Bottom: MeshStandardMaterial;
    Wolf3D_Outfit_Footwear: MeshStandardMaterial;
    Wolf3D_Body: MeshStandardMaterial;
  };
};

/**
 * Renders the Harry Potter GLB avatar with its rigged meshes.
 */
type GroupProps = JSX.IntrinsicElements['group'];

const GLB_PATH = '/assets/meshes/harry.glb';
const EXPRESSION_INTENSITY = 1.25;

const ANIMATION_FILES = {
  smile: '/assets/animations/smile.fbx',
  laugh: '/assets/animations/laugh.fbx',
  sad: '/assets/animations/sad.fbx',
  surprised: '/assets/animations/surprised.fbx',
  angry: '/assets/animations/angry.fbx',
  crazy: '/assets/animations/crazy.fbx',
  waving: '/assets/animations/waving.fbx',
} as const;

const TRACK_PATH_DELIMITERS = /[:|]/;

/**
 * Manual orientation offsets tuned by eye so expression clips face the user cleanly.
 * Adjust these values whenever the scene camera or avatar pose changes.
 */
const ORIENTATION_OFFSETS = Object.freeze({
  leanForwardDeg: 75,
  twistTowardViewerDeg: 0,
});

const FORWARD_LEAN_RADIANS = MathUtils.degToRad(
  ORIENTATION_OFFSETS.leanForwardDeg
);
const VIEWER_TWIST_RADIANS = MathUtils.degToRad(
  ORIENTATION_OFFSETS.twistTowardViewerDeg
);

function neutralizeRootRotation(
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
 */
function normalizeTrackName(originalName: string): string {
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

type AnimationClipName = keyof typeof ANIMATION_FILES;

const CLIPS_REQUIRING_ROOT_NEUTRALIZATION: ReadonlySet<AnimationClipName> =
  new Set(['smile', 'laugh', 'sad', 'surprised', 'angry', 'crazy']);

function resolveClipForExpression(
  expression: ExpressionName
): AnimationClipName | null {
  return expression in ANIMATION_FILES
    ? (expression as AnimationClipName)
    : null;
}

/**
 * Creates a sanitized copy of an FBX clip so we can safely mix it with the GLB skeleton.
 * Removes root transforms that would teleport/scale the avatar, then updates track names.
 */
function prepareAnimationClip(
  source: AnimationClip | undefined,
  name: AnimationClipName,
  targetRootQuaternion?: Quaternion
): AnimationClip | null {
  if (!source) {
    return null;
  }

  const sanitized = source.clone();
  sanitized.name = name;
  sanitized.tracks = sanitized.tracks
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

  return sanitized;
}

/**
 * Applies the current preset to a mesh that exposes compatible morph targets.
 */
function blendExpressionPreset(
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

/**
 * Loads the rigged GLB avatar, surfaces its morph target dictionary for debugging,
 * and animates mouth visemes in sync with the shared `visemeEvents` bus.
 */
export default function HarryAvatar(props: GroupProps) {
  const { nodes, materials } = useGLTF(GLB_PATH) as unknown as GLTFResult;
  const groupRef = useRef<Group | null>(null);
  const activeVisemeRef = useRef<string | null>(null);
  const snapToSilenceRef = useRef(false);
  const expressionPresetRef = useRef<FacialExpressionPreset>(
    facialExpressions.default
  );
  const introTimeoutIdRef = useRef<number | null>(null);
  const introReadyRef = useRef(false);
  const activeActionRef = useRef<AnimationAction | null>(null);
  const introHasStartedRef = useRef(false);
  const introCompletedRef = useRef(false);
  const pendingClipRef = useRef<AnimationClipName | null | undefined>(
    undefined
  );

  const smileFbx = useFBX(ANIMATION_FILES.smile);
  const laughFbx = useFBX(ANIMATION_FILES.laugh);
  const sadFbx = useFBX(ANIMATION_FILES.sad);
  const surprisedFbx = useFBX(ANIMATION_FILES.surprised);
  const angryFbx = useFBX(ANIMATION_FILES.angry);
  const crazyFbx = useFBX(ANIMATION_FILES.crazy);
  const wavingFbx = useFBX(ANIMATION_FILES.waving);

  const baseRigQuaternion = useMemo(
    () => nodes.Hips.quaternion.clone(),
    [nodes.Hips]
  );

  const forwardTiltQuaternion = useMemo(() => {
    const quaternion = new Quaternion();
    quaternion.setFromEuler(new Euler(FORWARD_LEAN_RADIANS, 0, 0));
    return quaternion;
  }, []);

  const viewerTwistQuaternion = useMemo(() => {
    const quaternion = new Quaternion();
    quaternion.setFromEuler(new Euler(0, VIEWER_TWIST_RADIANS, 0));
    return quaternion;
  }, []);

  /**
   * Anchor every sanitized clip to the same forward-leaning, viewer-facing pose so they blend cleanly
   * with the GLB rig regardless of how Mixamo authored the root.
   */
  const targetRootQuaternion = useMemo(() => {
    const adjusted = baseRigQuaternion.clone();
    adjusted.premultiply(viewerTwistQuaternion);
    adjusted.premultiply(forwardTiltQuaternion);
    return adjusted;
  }, [baseRigQuaternion, forwardTiltQuaternion, viewerTwistQuaternion]);

  const animationClips = useMemo(() => {
    const entries: Array<[AnimationClipName, AnimationClip | undefined]> = [
      ['smile', smileFbx.animations[0]],
      ['laugh', laughFbx.animations[0]],
      ['sad', sadFbx.animations[0]],
      ['surprised', surprisedFbx.animations[0]],
      ['angry', angryFbx.animations[0]],
      ['crazy', crazyFbx.animations[0]],
      ['waving', wavingFbx.animations[0]],
    ];

    return entries.reduce<AnimationClip[]>((clips, [name, clip]) => {
      const sanitized = prepareAnimationClip(clip, name, targetRootQuaternion);
      if (sanitized) {
        clips.push(sanitized);
      }
      return clips;
    }, []);
  }, [
    targetRootQuaternion,
    smileFbx,
    laughFbx,
    sadFbx,
    surprisedFbx,
    angryFbx,
    crazyFbx,
    wavingFbx,
  ]);

  const { actions, mixer } = useAnimations(animationClips, groupRef);

  /** Stops and clears the currently playing animation action if one exists. */
  const stopCurrentAction = useCallback(() => {
    if (!activeActionRef.current) {
      return;
    }

    activeActionRef.current.stop();
    activeActionRef.current.reset();
    activeActionRef.current = null;
  }, []);

  /**
   * Resets and plays the requested clip once, interrupting any existing action.
   * Passing `null` smoothly returns the rig to its baseline pose.
   */
  const playAnimation = useCallback(
    (clipName: AnimationClipName | null) => {
      if (!actions) {
        return;
      }

      if (!clipName) {
        stopCurrentAction();
        return;
      }

      const nextAction = actions[clipName];
      if (!nextAction) {
        stopCurrentAction();
        return;
      }

      if (activeActionRef.current && activeActionRef.current !== nextAction) {
        activeActionRef.current.stop();
      }

      activeActionRef.current = nextAction;
      /* eslint-disable react-hooks/immutability */
      nextAction.enabled = true;
      nextAction.weight = 1;
      nextAction.reset();
      nextAction.setLoop(LoopOnce, 1);
      nextAction.clampWhenFinished = true;
      nextAction.play();
      /* eslint-enable react-hooks/immutability */
    },
    [actions, stopCurrentAction]
  );

  /** Plays any queued clip once the intro waving animation completes. */
  const flushPendingClip = useCallback(() => {
    const pendingClip = pendingClipRef.current;
    pendingClipRef.current = undefined;
    if (pendingClip === undefined) {
      return;
    }

    playAnimation(pendingClip);
  }, [playAnimation]);

  /** Queues clips during the intro wave; otherwise plays the clip immediately. */
  const queueOrPlayClip = useCallback(
    (clipName: AnimationClipName | null) => {
      if (!introCompletedRef.current) {
        pendingClipRef.current = clipName;
        return;
      }

      pendingClipRef.current = undefined;
      playAnimation(clipName);
    },
    [playAnimation]
  );

  useEffect(() => {
    if (!mixer) {
      return;
    }

    const handleFinished = (event: { action?: AnimationAction }) => {
      const finishedAction = event.action;
      if (!finishedAction || finishedAction !== activeActionRef.current) {
        return;
      }

      const clipName = finishedAction.getClip()?.name as
        | AnimationClipName
        | undefined;
      stopCurrentAction();

      if (clipName === 'waving') {
        introCompletedRef.current = true;
        flushPendingClip();
      }
    };

    mixer.addEventListener('finished', handleFinished);
    return () => {
      mixer.removeEventListener('finished', handleFinished);
    };
  }, [flushPendingClip, mixer, stopCurrentAction]);

  /**
   * Delays the intro waving animation until the corresponding FBX action is available,
   * then schedules it to run once before other clips play.
   */
  useEffect(() => {
    const wavingAction = actions?.waving;
    if (!wavingAction) {
      return;
    }

    if (!introReadyRef.current) {
      introReadyRef.current = true;
    }

    if (introHasStartedRef.current) {
      return;
    }

    introHasStartedRef.current = true;
    introCompletedRef.current = false;

    if (pendingClipRef.current === undefined) {
      pendingClipRef.current = null;
    }

    introTimeoutIdRef.current = window.setTimeout(() => {
      playAnimation('waving');
      introTimeoutIdRef.current = null;
    }, 500);

    return () => {
      if (introTimeoutIdRef.current !== null) {
        window.clearTimeout(introTimeoutIdRef.current);
        introTimeoutIdRef.current = null;
        introHasStartedRef.current = false;
      }
    };
  }, [actions, playAnimation]);

  /**
   * Start listening for viseme events so the Three.js render loop can react in real time.
   */
  useEffect(() => {
    const unsubscribe = subscribeToVisemes(({ label }) => {
      if (label === 'viseme_sil') {
        snapToSilenceRef.current = true;
        activeVisemeRef.current = null;
        return;
      }

      activeVisemeRef.current = label;
    });

    return unsubscribe;
  }, []);

  /**
   * Mirror sentiment events by storing the current facial expression preset.
   */
  useEffect(() => {
    const unsubscribe = subscribeToExpressions((expression) => {
      expressionPresetRef.current =
        facialExpressions[expression] ?? facialExpressions.default;

      queueOrPlayClip(resolveClipForExpression(expression));
    });

    return unsubscribe;
  }, [queueOrPlayClip]);

  /**
   * Every frame: decay all morph influences toward zero, optionally snap to silence,
   * then boost the morph target matching the most recent viseme tag.
   */
  /* eslint-disable react-hooks/immutability */
  useFrame((_state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }

    const headMesh = nodes.Wolf3D_Head;
    const dictionary = headMesh.morphTargetDictionary;
    const influences = headMesh.morphTargetInfluences;
    if (!dictionary || !influences) {
      return;
    }

    const damping = Math.exp(-delta * 18);
    for (let index = 0; index < influences.length; index += 1) {
      if (snapToSilenceRef.current) {
        influences[index] = 0;
      } else {
        influences[index] *= damping;
      }
    }

    const snappedToSilence = snapToSilenceRef.current;
    if (snappedToSilence) {
      snapToSilenceRef.current = false;
    } else {
      const nextViseme = activeVisemeRef.current;
      if (nextViseme) {
        const targetIndex = dictionary[nextViseme];
        if (typeof targetIndex === 'number') {
          const boost = 1 - damping;
          const nextValue = influences[targetIndex] + boost;
          influences[targetIndex] = nextValue > 1 ? 1 : nextValue;
        }
      }
    }

    const expressionTargets = expressionPresetRef.current;
    const expressionLerp = 1 - Math.exp(-delta * 6);
    blendExpressionPreset(headMesh, expressionTargets, expressionLerp);
    blendExpressionPreset(
      nodes.Wolf3D_Teeth,
      expressionTargets,
      expressionLerp
    );
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Glasses.geometry}
        material={materials.Wolf3D_Glasses}
        skeleton={nodes.Wolf3D_Glasses.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
    </group>
  );
}

useGLTF.preload(GLB_PATH);
useFBX.preload(ANIMATION_FILES.smile);
useFBX.preload(ANIMATION_FILES.laugh);
useFBX.preload(ANIMATION_FILES.sad);
useFBX.preload(ANIMATION_FILES.surprised);
useFBX.preload(ANIMATION_FILES.angry);
useFBX.preload(ANIMATION_FILES.crazy);
useFBX.preload(ANIMATION_FILES.waving);
