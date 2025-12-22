import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CanvasLoader } from '.';

vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="html-overlay">{children}</div>
  ),
}));

describe('CanvasLoader', () => {
  it('renders the loading indicator text and structure', () => {
    render(<CanvasLoader />);

    expect(screen.getByTestId('html-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-loader')).toBeInTheDocument();
    expect(screen.getByText(/Conjuring scene/i)).toBeInTheDocument();
  });
});
