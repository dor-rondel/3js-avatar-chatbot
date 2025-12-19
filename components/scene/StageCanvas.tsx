'use client';

import { Activity, Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import GryffindorStage from './GryffindorStage';
import { CanvasLoader } from './CanvasLoader';
import { ChatPanel } from '../chat/ChatPanel';

type CameraMode = 'default' | 'wide';

/** Predefined camera positions: default for close-up, wide for overview. */
const CAMERA_POSITIONS: Record<CameraMode, [number, number, number]> = {
  default: [0, 0, 2.25],
  wide: [0, 0.15, 6],
};

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

/**
 * Hosts the full-bleed React Three Fiber canvas that the Gryffindor stage renders into.
 * Manages zoom state: default (close-up, chat visible) vs wide (panoramic, chat hidden, avatar spins).
 */
export default function StageCanvas() {
  const [cameraMode, setCameraMode] = useState<CameraMode>('default');
  const isZoomedOut = cameraMode === 'wide';
  const chatOverlayClasses = [
    'pointer-events-none absolute inset-0 flex items-end justify-center px-4 pb-8 transition-all duration-500 ease-out',
    isZoomedOut ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0',
  ].join(' ');

  const toggleZoom = () => {
    setCameraMode((prev) => (prev === 'default' ? 'wide' : 'default'));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#1c1530,#05030c_70%)]">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2.25], fov: 25 }}
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
      <Activity mode={isZoomedOut ? 'hidden' : 'visible'}>
        <div className={chatOverlayClasses}>
          <ChatPanel data-activity-state={isZoomedOut ? 'hidden' : 'visible'} />
        </div>
      </Activity>
      <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center">
        <button
          type="button"
          className="pointer-events-auto rounded-full border border-white/25 bg-slate-950/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-2xl backdrop-blur"
          onClick={toggleZoom}
        >
          {isZoomedOut ? 'Zoom In' : 'Zoom Out'}
        </button>
      </div>
    </div>
  );
}
