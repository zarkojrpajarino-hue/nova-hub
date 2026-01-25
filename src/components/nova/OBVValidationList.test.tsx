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

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
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
    const loader = container.querySelector('.lucide-loader-2');
    expect(loader).toBeTruthy();
  });

  it('renders component container', () => {
    const { container } = renderComponent();
    expect(container).toBeTruthy();
  });
});
