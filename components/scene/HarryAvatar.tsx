'use client';

import { useEffect, useRef, type JSX } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { GLTF } from 'three-stdlib';
import type { Group, MeshStandardMaterial, SkinnedMesh } from 'three';
import { subscribeToVisemes } from '../../lib/viseme/visemeEvents';

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

/**
 * Loads the rigged GLB avatar, surfaces its morph target dictionary for debugging,
 * and animates mouth visemes in sync with the shared `visemeEvents` bus.
 */
export default function HarryAvatar(props: GroupProps) {
  const { nodes, materials } = useGLTF(GLB_PATH) as unknown as GLTFResult;
  const activeVisemeRef = useRef<string | null>(null);
  const snapToSilenceRef = useRef(false);

  /**
   * Developer helper: log every mesh's morph targets so we know which viseme names are available.
   */
  useEffect(() => {
    const meshes: Array<[string, SkinnedMesh | undefined]> = [
      ['Wolf3D_Head', nodes.Wolf3D_Head],
      ['Wolf3D_Teeth', nodes.Wolf3D_Teeth],
    ];

    meshes.forEach(([label, mesh]) => {
      const dict = mesh?.morphTargetDictionary;
      const influences = mesh?.morphTargetInfluences;
      if (!dict || !influences) {
        return;
      }

      const rows = Object.entries(dict).map(([target, index]) => ({
        target,
        index,
        influence: influences[index] ?? 0,
      }));

      if (!rows.length) {
        return;
      }

      // eslint-disable-next-line no-console
      console.groupCollapsed(`[morphTargets] ${label}`);
      // eslint-disable-next-line no-console
      console.table(rows);
      // eslint-disable-next-line no-console
      console.groupEnd();
    });
  }, [nodes]);

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
   * Every frame: decay all morph influences toward zero, optionally snap to silence,
   * then boost the morph target matching the most recent viseme tag.
   */
  useFrame((_state, delta) => {
    const headMesh = nodes.Wolf3D_Head;
    const dictionary = headMesh.morphTargetDictionary;
    const influences = headMesh.morphTargetInfluences;
    if (!dictionary || !influences) {
      return;
    }

    /* eslint-disable react-hooks/immutability */
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
    /* eslint-enable react-hooks/immutability */

    if (snappedToSilence) {
      return;
    }
  });

  return (
    <group {...props} dispose={null}>
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
