import { Html } from '@react-three/drei';

/**
 * Fullscreen Drei `Html` overlay used as the Three.js loading fallback.
 *
 * @returns The loading overlay.
 */
export function CanvasLoader() {
  return (
    <Html fullscreen>
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(5,3,12,0.8)] text-[0.85rem] uppercase tracking-[0.08em] text-[#cbd5f5]"
        data-testid="canvas-loader"
      >
        <div
          className="h-12 w-12 rounded-full border-[3px] border-white/20 border-t-amber-300 animate-spin"
          aria-hidden
        />
        <p>Conjuring scene...</p>
      </div>
    </Html>
  );
}
