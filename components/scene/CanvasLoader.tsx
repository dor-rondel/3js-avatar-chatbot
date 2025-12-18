import { Html } from '@react-three/drei';

/**
 * Fullscreen Drei `Html` overlay used as the Three.js loading fallback.
 */
export function CanvasLoader() {
  return (
    <Html fullscreen>
      <div className="loading-indicator" data-testid="canvas-loader">
        <div className="loading-ring" />
        <p>Conjuring scene...</p>
      </div>
    </Html>
  );
}
