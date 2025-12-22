import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StageCanvas from '.';

const { mockUseThree, gryffindorStageMock } = vi.hoisted(() => ({
  mockUseThree: vi.fn(),
  gryffindorStageMock: vi.fn(({ shouldSpin }: { shouldSpin: boolean }) => (
    <div data-testid="gryffindor-stage" data-spin={shouldSpin}>
      stage
    </div>
  )),
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useThree: mockUseThree,
}));

vi.mock('../CanvasLoader', () => ({
  CanvasLoader: () => <div data-testid="mock-canvas-loader">loading</div>,
}));

vi.mock('../GryffindorStage', () => ({
  __esModule: true,
  default: gryffindorStageMock,
}));

describe('StageCanvas', () => {
  beforeEach(() => {
    mockUseThree.mockReset();
    const camera = {
      position: { set: vi.fn() },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
    };

    mockUseThree.mockReturnValue({ camera });
  });

  it('renders the Three.js canvas and stage content', () => {
    render(<StageCanvas />);

    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('gryffindor-stage')).toBeInTheDocument();
    expect(screen.getByTestId('gryffindor-stage')).toHaveAttribute(
      'data-spin',
      'false'
    );
    expect(screen.queryByTestId('mock-canvas-loader')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /zoom out/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Talk with Harry')).toHaveAttribute(
      'data-activity-state',
      'visible'
    );
  });

  it('toggles zoom button label and updates the camera position', async () => {
    const camera = {
      position: { set: vi.fn() },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
    };
    mockUseThree.mockReturnValue({ camera });

    render(<StageCanvas />);

    await waitFor(() => {
      expect(camera.position.set).toHaveBeenCalledWith(0, 0, 2.25);
    });
    const button = screen.getByRole('button', { name: /zoom out/i });
    fireEvent.click(button);

    expect(
      screen.getByRole('button', { name: /zoom in/i })
    ).toBeInTheDocument();
    const hiddenChatPanel = screen.getByLabelText('Talk with Harry');
    expect(hiddenChatPanel).toHaveAttribute('data-activity-state', 'hidden');
    expect(screen.getByTestId('gryffindor-stage')).toHaveAttribute(
      'data-spin',
      'true'
    );

    await waitFor(() => {
      expect(camera.position.set).toHaveBeenCalledWith(0, 0.15, 6);
    });

    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(
      screen.getByRole('button', { name: /zoom out/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Talk with Harry')).toHaveAttribute(
      'data-activity-state',
      'visible'
    );
    expect(screen.getByTestId('gryffindor-stage')).toHaveAttribute(
      'data-spin',
      'false'
    );

    await waitFor(() => {
      expect(camera.position.set).toHaveBeenCalledWith(0, 0, 2.25);
    });
  });
});
