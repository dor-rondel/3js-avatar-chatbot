import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

type CameraMode = 'default' | 'wide';

/** Predefined camera positions: default for close-up, wide for overview. */
const CAMERA_POSITIONS: Record<CameraMode, [number, number, number]> = {
  default: [0, 0, 2.25],
  wide: [0, 0.15, 6],
};

/** Default (close-up) camera position used on initial Canvas mount. */
const DEFAULT_CAMERA_POSITION = CAMERA_POSITIONS.default;

/**
 * Syncs R3F camera position to current zoom mode.
 * Updates on every mode change to keep camera aligned with user intent.
 */
function CameraZoomController({ mode }: { mode: CameraMode }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...CAMERA_POSITIONS[mode]);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, mode]);

  return null;
}

export {
  CAMERA_POSITIONS,
  CameraZoomController,
  type CameraMode,
  DEFAULT_CAMERA_POSITION,
};
