import { useEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { SRGBColorSpace, type Scene, type Texture } from 'three';

/**
 * Applies a texture as `scene.background` and restores the previous background on cleanup.
 *
 * The texture is cloned and configured with sRGB color space so we do not mutate
 * Drei's internal texture cache.
 *
 * @param url - Texture URL to load.
 * @returns The prepared background texture (or null if unavailable).
 */
export function useSceneBackgroundTexture(url: string) {
  const scene = useThree((state) => state.scene) as Scene;
  const sceneRef = useRef<Scene | null>(scene);
  const texture = useTexture(url) as Texture;

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const preparedTexture = useMemo(() => {
    if (!texture) {
      return null;
    }

    const cloned = texture.clone();
    cloned.colorSpace = SRGBColorSpace;
    return cloned;
  }, [texture]);

  useEffect(() => {
    const currentScene = sceneRef.current;
    if (!preparedTexture) {
      return undefined;
    }

    if (!currentScene) {
      return undefined;
    }

    const previousBackground = currentScene.background;
    currentScene.background = preparedTexture;

    return () => {
      currentScene.background = previousBackground;
      preparedTexture.dispose();
    };
  }, [preparedTexture]);

  return preparedTexture;
}
