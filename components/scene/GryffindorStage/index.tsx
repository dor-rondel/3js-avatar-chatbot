'use client';

import { useRef } from 'react';
import { Stage } from '@react-three/drei';
import type { Group } from 'three';
import HarryAvatar from '../HarryAvatar';
import { useAvatarSpin } from './useAvatarSpin';
import { useSceneBackgroundTexture } from './useSceneBackgroundTexture';

/**
 * Applies the Gryffindor backdrop texture and lighting rig to the shared scene.
 * Controls avatar auto-rotation via shouldSpin prop (enabled when zoomed out).
 */
type GryffindorStageProps = {
  /** When true, avatar spins continuously around Y-axis at origin. */
  shouldSpin?: boolean;
};

/**
 * Avatar rotation speed (radians/second) when `shouldSpin` is enabled.
 */
const SPIN_SPEED = 0.35;

/**
 * Applies the Gryffindor backdrop texture and lighting rig to the shared scene.
 *
 * @param props - Component props.
 * @param props.shouldSpin - When true, the avatar rotates around the Y axis.
 * @returns Scene lighting + stage content.
 */
export default function GryffindorStage({
  shouldSpin = false,
}: GryffindorStageProps) {
  const avatarGroupRef = useRef<Group | null>(null);

  useSceneBackgroundTexture('/assets/textures/Gryffindor.jpg');

  useAvatarSpin({
    groupRef: avatarGroupRef,
    shouldSpin,
    spinSpeed: SPIN_SPEED,
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        color="#f6c667"
        intensity={1.2}
        position={[4, 6, 2]}
        castShadow
      />
      <Stage
        environment="city"
        preset="rembrandt"
        intensity={0.9}
        adjustCamera={false}
        contactShadow
      >
        <group ref={avatarGroupRef} position={[0, 0, 0]}>
          <HarryAvatar scale={1.05} position={[0, 0.75, 0]} />
        </group>
      </Stage>
    </>
  );
}
