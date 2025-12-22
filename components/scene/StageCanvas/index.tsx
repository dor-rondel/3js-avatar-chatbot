'use client';

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GryffindorStage from '../GryffindorStage';
import { CanvasLoader } from '../CanvasLoader';
import {
  CameraZoomController,
  type CameraMode,
  DEFAULT_CAMERA_POSITION,
} from './camera';
import ChatOverlay from '../ChatOverlay';
import ZoomButton from '../ZoomButton';

/**
 * Hosts the full-bleed React Three Fiber canvas that the Gryffindor stage renders into.
 * Manages zoom state: default (close-up, chat visible) vs wide (panoramic, chat hidden, avatar spins).
 */
export default function StageCanvas() {
  const [cameraMode, setCameraMode] = useState<CameraMode>('default');
  const isZoomedOut = cameraMode === 'wide';

  const toggleZoom = () => {
    setCameraMode((prev) => (prev === 'default' ? 'wide' : 'default'));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#1c1530,#05030c_70%)]">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: DEFAULT_CAMERA_POSITION, fov: 35 }}
        shadows
        className="block h-full w-full"
        style={{ width: '100%', height: '100%' }}
      >
        <CameraZoomController mode={cameraMode} />
        <color attach="background" args={[0x05030c]} />
        <Suspense fallback={<CanvasLoader />}>
          <GryffindorStage shouldSpin={isZoomedOut} />
        </Suspense>
      </Canvas>
      <ChatOverlay isHidden={isZoomedOut} />
      <ZoomButton isZoomedOut={isZoomedOut} onToggle={toggleZoom} />
    </div>
  );
}
