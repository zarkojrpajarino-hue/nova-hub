import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OBVValidationList } from './OBVValidationList';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

// Mock supabase - never resolve to keep loading state
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => new Promise(() => {})), // never resolves → keeps isLoading true
        })),
        in: vi.fn(() => new Promise(() => {})),
      })),
    })),
  },
}));

describe('OBVValidationList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <OBVValidationList />
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    const { container } = renderComponent();
    // Loading state renders SkeletonCard components with animate-pulse
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
  });

  it('renders component container', () => {
    const { container } = renderComponent();
    expect(container).toBeTruthy();
  });
});
