import { Suspense } from 'react';
import StageCanvas from '@/components/scene/StageCanvas';

export default function HomePage() {
  return (
    <main className="min-h-screen w-screen">
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#1c1530,#05030c_70%)] text-sm text-slate-400">
            Summoning the Gryffindor stage...
          </div>
        }
      >
        <StageCanvas />
      </Suspense>
    </main>
  );
}
