'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import GryffindorStage from './GryffindorStage';
import { CanvasLoader } from './CanvasLoader';

/**
 * Hosts the full-bleed React Three Fiber canvas that the Gryffindor stage renders into.
 */
export default function StageCanvas() {
  return (
    <div className="gryffindor-stage">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2.25], fov: 25 }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={[0x05030c]} />
        <Suspense fallback={<CanvasLoader />}>
          <GryffindorStage />
        </Suspense>
      </Canvas>
    </div>
  );
}
