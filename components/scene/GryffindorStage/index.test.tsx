import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SRGBColorSpace, type Scene, type Texture } from 'three';
import GryffindorStage from '.';
import { useTexture } from '@react-three/drei';

const mockScene = { background: null } as unknown as Scene;

const { mockUseFrame } = vi.hoisted(() => ({
  mockUseFrame: vi.fn(),
}));

vi.mock('@react-three/fiber', () => ({
  // eslint-disable-next-line no-unused-vars
  useThree: (selector?: (state: { scene: Scene }) => unknown) => {
    const state = { scene: mockScene };
    return selector ? selector(state) : state;
  },
  useFrame: (fn: () => void) => {
    mockUseFrame(fn);
  },
}));

vi.mock('@react-three/drei', () => ({
  useTexture: vi.fn(),
  Stage: ({ children }: { children: ReactNode }) => (
    <div data-testid="drei-stage">{children}</div>
  ),
}));

vi.mock('../HarryAvatar', () => ({
  __esModule: true,
  default: () => <div data-testid="harry-avatar">avatar</div>,
}));

describe('GryffindorStage', () => {
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

    const { unmount } = render(<GryffindorStage />);

    expect(sourceTexture.clone).toHaveBeenCalledTimes(1);
    expect(preparedTexture.colorSpace).toBe(SRGBColorSpace);
    expect(mockScene.background).toBe(preparedTexture);
    expect(screen.getByTestId('drei-stage')).toBeInTheDocument();
    expect(screen.getByTestId('harry-avatar')).toBeInTheDocument();
    expect(mockUseFrame).toHaveBeenCalledTimes(1);
    expect(mockUseFrame.mock.calls[0]?.[0]).toBeInstanceOf(Function);

    unmount();

    expect(mockScene.background).toBeNull();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
