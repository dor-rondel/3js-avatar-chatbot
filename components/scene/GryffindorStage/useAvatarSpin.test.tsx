import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Euler, type Group } from 'three';
import { useAvatarSpin } from './useAvatarSpin';

const { mockUseFrame } = vi.hoisted(() => ({
  mockUseFrame: vi.fn(),
}));

vi.mock('@react-three/fiber', () => ({
  useFrame: (fn: unknown) => {
    mockUseFrame(fn as () => void);
  },
}));

type HarnessProps = {
  groupRef: { current: Group | null };
  shouldSpin: boolean;
  spinSpeed: number;
};

function Harness({ groupRef, shouldSpin, spinSpeed }: HarnessProps) {
  useAvatarSpin({ groupRef, shouldSpin, spinSpeed });
  return null;
}

describe('useAvatarSpin', () => {
  it('rotates when enabled and resets when disabled', () => {
    const group = { rotation: new Euler(0, 0, 0) } as unknown as Group;
    const groupRef = { current: group };

    const { rerender } = render(
      <Harness groupRef={groupRef} shouldSpin spinSpeed={0.5} />
    );

    expect(mockUseFrame).toHaveBeenCalledTimes(1);
    const frameCallback = mockUseFrame.mock.calls[0]?.[0];
    expect(frameCallback).toBeInstanceOf(Function);

    if (typeof frameCallback === 'function') {
      Reflect.apply(frameCallback, null, [{}, 2]);
    }
    expect(group.rotation.toArray()[1]).toBeCloseTo(1);

    rerender(
      <Harness groupRef={groupRef} shouldSpin={false} spinSpeed={0.5} />
    );
    expect(group.rotation.toArray()[1]).toBe(0);

    if (typeof frameCallback === 'function') {
      Reflect.apply(frameCallback, null, [{}, 2]);
    }
    expect(group.rotation.toArray()[1]).toBe(0);
  });
});
