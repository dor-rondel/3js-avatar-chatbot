import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ZoomButton from '.';

describe('ZoomButton', () => {
  it('renders Zoom Out when not zoomed out', () => {
    render(<ZoomButton isZoomedOut={false} onToggle={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /zoom out/i })
    ).toBeInTheDocument();
  });

  it('renders Zoom In when zoomed out', () => {
    render(<ZoomButton isZoomedOut onToggle={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /zoom in/i })
    ).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<ZoomButton isZoomedOut={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
