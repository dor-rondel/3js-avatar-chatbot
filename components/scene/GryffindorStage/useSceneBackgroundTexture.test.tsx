import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SRGBColorSpace, type Scene, type Texture } from 'three';
import { useSceneBackgroundTexture } from './useSceneBackgroundTexture';
import { useTexture } from '@react-three/drei';

function TestHarness() {
  useSceneBackgroundTexture('/assets/textures/Gryffindor.jpg');
  return null;
}

vi.mock('@react-three/drei', () => ({
  useTexture: vi.fn(),
}));

const mockScene = { background: null } as unknown as Scene;

vi.mock('@react-three/fiber', () => ({
  // eslint-disable-next-line no-unused-vars
  useThree: (selector?: (state: { scene: Scene }) => unknown) => {
    const state = { scene: mockScene };
    return selector ? selector(state) : state;
  },
}));

describe('useSceneBackgroundTexture', () => {
  it('applies the prepared texture and restores the previous background on cleanup', () => {
    const dispose = vi.fn();
    const preparedTexture = {
      dispose,
      colorSpace: undefined,
    } as unknown as Texture;

    const sourceTexture = {
      clone: vi.fn(() => preparedTexture),
    } as unknown as Texture;

    vi.mocked(useTexture).mockReturnValue(sourceTexture);

    mockScene.background = null;

    const { unmount } = render(<TestHarness />);

    expect(sourceTexture.clone).toHaveBeenCalledTimes(1);
    expect(preparedTexture.colorSpace).toBe(SRGBColorSpace);
    expect(mockScene.background).toBe(preparedTexture);

    unmount();

    expect(mockScene.background).toBeNull();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
