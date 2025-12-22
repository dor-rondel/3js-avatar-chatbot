'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stage, useTexture } from '@react-three/drei';
import { SRGBColorSpace, type Texture, type Scene, type Group } from 'three';
import HarryAvatar from '../HarryAvatar';

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
  const scene = useThree((state) => state.scene);
  const sceneRef = useRef<Scene | null>(scene);
  const avatarGroupRef = useRef<Group | null>(null);
  /** Ref tracks spin state so useFrame reads latest value without re-registering. */
  const spinStateRef = useRef(shouldSpin);
  const texture = useTexture('/assets/textures/Gryffindor.jpg') as Texture;

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    spinStateRef.current = shouldSpin;
    const avatarGroup = avatarGroupRef.current;
    // Reset rotation when spin disabled so avatar faces forward.
    if (!shouldSpin && avatarGroup?.rotation) {
      // eslint-disable-next-line id-length
      avatarGroup.rotation.y = 0;
    }
  }, [shouldSpin]);

  // eslint-disable-next-line id-length
  useFrame((_, delta) => {
    const avatarGroup = avatarGroupRef.current;
    if (!avatarGroup || !avatarGroup.rotation) {
      return;
    }

    if (!spinStateRef.current) {
      return;
    }

    // Continuous Y-axis rotation anchored at origin.
    // eslint-disable-next-line id-length
    avatarGroup.rotation.y =
      (avatarGroup.rotation.y + delta * SPIN_SPEED) % (Math.PI * 2);
  });

  const preparedTexture = useMemo(() => {
    if (!texture) {
      return null;
    }

    // Clone so we can adjust color space without mutating Drei's cache.
    const cloned = texture.clone();
    cloned.colorSpace = SRGBColorSpace;
    return cloned;
  }, [texture]);

  useEffect(() => {
    const currentScene = sceneRef.current;

    if (!currentScene || !preparedTexture) {
      return undefined;
    }

    const previousBackground = currentScene.background;
    currentScene.background = preparedTexture;

    return () => {
      currentScene.background = previousBackground;
      preparedTexture.dispose();
    };
  }, [preparedTexture]);

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
