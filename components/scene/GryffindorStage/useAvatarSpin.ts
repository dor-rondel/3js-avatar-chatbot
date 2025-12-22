import { useEffect, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

type UseAvatarSpinInput = {
  /** Ref to the group that should spin (typically the avatar container). */
  groupRef: RefObject<Group | null>;
  /** Whether the avatar should currently be spinning. */
  shouldSpin: boolean;
  /** Rotation speed in radians/second. */
  spinSpeed: number;
};

/**
 * Drives continuous Y-axis rotation on a Three.js `Group` when enabled.
 *
 * Uses a ref-backed flag so the `useFrame` callback always reads the latest value
 * without needing to re-register on every render.
 *
 * @param input - Hook inputs.
 * @param input.groupRef - Target group to rotate.
 * @param input.shouldSpin - Whether rotation is enabled.
 * @param input.spinSpeed - Rotation speed in radians/second.
 * @returns Nothing.
 */
export function useAvatarSpin({
  groupRef,
  shouldSpin,
  spinSpeed,
}: UseAvatarSpinInput) {
  const spinStateRef = useRef(shouldSpin);

  useEffect(() => {
    spinStateRef.current = shouldSpin;

    const avatarGroup = groupRef.current;
    if (!shouldSpin && avatarGroup?.rotation) {
      // eslint-disable-next-line id-length
      avatarGroup.rotation.y = 0;
    }
  }, [groupRef, shouldSpin]);

  useFrame((_state, deltaSeconds) => {
    const avatarGroup = groupRef.current;
    if (!avatarGroup?.rotation) {
      return;
    }

    if (!spinStateRef.current) {
      return;
    }

    const nextY =
      (avatarGroup.rotation.y + deltaSeconds * spinSpeed) % (Math.PI * 2);
    // eslint-disable-next-line id-length
    avatarGroup.rotation.y = nextY;
  });
}
