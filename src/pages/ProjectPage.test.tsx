import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProjectPage from './ProjectPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1' } })),
}));

describe('ProjectPage', () => {
  it('renders project page', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/" element={<ProjectPage />} />
          </Routes>
        </QueryClientProvider>
      </BrowserRouter>
    );
    expect(container).toBeInTheDocument();
  });
});
