import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StageCanvas from './StageCanvas';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useThree: vi.fn(),
}));

vi.mock('./CanvasLoader', () => ({
  CanvasLoader: () => <div data-testid="mock-canvas-loader">loading</div>,
}));

vi.mock('./GryffindorStage', () => ({
  __esModule: true,
  default: () => <div data-testid="gryffindor-stage">stage</div>,
}));

describe('StageCanvas', () => {
  it('renders the Three.js canvas and stage content', () => {
    render(<StageCanvas />);

    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('gryffindor-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-canvas-loader')).not.toBeInTheDocument();
  });
});
