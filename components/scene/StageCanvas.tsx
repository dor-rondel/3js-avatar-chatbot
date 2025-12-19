'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import GryffindorStage from './GryffindorStage';
import { CanvasLoader } from './CanvasLoader';
import { ChatPanel } from '../chat/ChatPanel';

/**
 * Hosts the full-bleed React Three Fiber canvas that the Gryffindor stage renders into.
 */
export default function StageCanvas() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#1c1530,#05030c_70%)]">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2.25], fov: 25 }}
        shadows
        className="block h-full w-full"
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={[0x05030c]} />
        <Suspense fallback={<CanvasLoader />}>
          <GryffindorStage />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center px-4 pb-8">
        <ChatPanel />
      </div>
    </div>
  );
}
