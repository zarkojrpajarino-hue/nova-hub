import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Auth from './Auth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: null })),
}));

describe('Auth', () => {
  it('renders auth page', () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
