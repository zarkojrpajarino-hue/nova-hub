import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Index from './Index';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1' } })),
}));

describe('Index', () => {
  it('renders dashboard', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Index />
        </QueryClientProvider>
      </BrowserRouter>
    );
    expect(container).toBeInTheDocument();
  });
});
