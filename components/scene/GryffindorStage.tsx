'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Stage, useTexture } from '@react-three/drei';
import { SRGBColorSpace, type Texture, type Scene } from 'three';
import HarryAvatar from './HarryAvatar';

/**
 * Applies the Gryffindor backdrop texture and lighting rig to the shared scene.
 */
export default function GryffindorStage() {
  const scene = useThree((state) => state.scene);
  const sceneRef = useRef<Scene | null>(scene);
  const texture = useTexture('/assets/textures/Gryffindor.jpg') as Texture;

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

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
        <HarryAvatar scale={1.05} position={[0, 0.85, 0]} />
      </Stage>
    </>
  );
}
