import { Suspense } from 'react';
import StageCanvas from '@/components/scene/StageCanvas';

export default function HomePage() {
  return (
    <main className="min-h-screen w-screen">
      <Suspense
        fallback={
          <div className="gryffindor-stage flex items-center justify-center text-sm text-slate-400">
            Summoning the Gryffindor stage...
          </div>
        }
      >
        <StageCanvas />
      </Suspense>
    </main>
  );
}
