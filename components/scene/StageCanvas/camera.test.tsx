import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import {
  CAMERA_POSITIONS,
  CameraZoomController,
  DEFAULT_CAMERA_POSITION,
} from './camera';

const { mockUseThree } = vi.hoisted(() => ({
  mockUseThree: vi.fn(),
}));

vi.mock('@react-three/fiber', () => ({
  useThree: mockUseThree,
}));

function renderWithStrictMode(ui: ReactNode) {
  return render(ui);
}

describe('StageCanvas camera helpers', () => {
  it('exports a default camera position that matches the default mode', () => {
    expect(DEFAULT_CAMERA_POSITION).toEqual(CAMERA_POSITIONS.default);
  });

  it('moves the camera when mode changes', async () => {
    const camera = {
      position: { set: vi.fn() },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
    };
    mockUseThree.mockReturnValue({ camera });

    const { rerender } = renderWithStrictMode(
      <CameraZoomController mode="default" />
    );

    await waitFor(() => {
      expect(camera.position.set).toHaveBeenCalledWith(0, 0, 2.25);
    });

    rerender(<CameraZoomController mode="wide" />);

    await waitFor(() => {
      expect(camera.position.set).toHaveBeenCalledWith(0, 0.15, 6);
    });
    expect(camera.lookAt).toHaveBeenCalledWith(0, 0, 0);
    expect(camera.updateProjectionMatrix).toHaveBeenCalled();
  });
});
