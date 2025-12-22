type ZoomButtonProps = {
  /** True when the camera is in wide mode (zoomed out). */
  isZoomedOut: boolean;
  /** Called when the user clicks the zoom toggle button. */
  onToggle: () => void;
};

/**
 * Renders the floating zoom toggle button used by the stage view.
 *
 * @param props - Component props.
 * @param props.isZoomedOut - Whether the scene is currently zoomed out.
 * @param props.onToggle - Click handler that toggles camera mode.
 * @returns The zoom toggle button UI.
 */
export default function ZoomButton({ isZoomedOut, onToggle }: ZoomButtonProps) {
  return (
    <div className="pointer-events-none absolute right-6 top-[10vh]">
      <button
        type="button"
        className="pointer-events-auto rounded-full border border-white/25 bg-slate-950/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-2xl backdrop-blur"
        onClick={onToggle}
      >
        {isZoomedOut ? 'Zoom In' : 'Zoom Out'}
      </button>
    </div>
  );
}
