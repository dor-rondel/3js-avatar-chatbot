import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '../page';

describe('HomePage', () => {
  it('renders the hero copy', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { name: /3d avatar chatbot coming soon/i })
    ).toBeInTheDocument();
  });
});
