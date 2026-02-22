import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplicationsList } from './ApplicationsList';
import type { MasterApplication } from '@/hooks/useMasters';

// Mock hooks
vi.mock('@/hooks/useMasters', () => ({
  useVoteOnApplication: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useMasterVotes: vi.fn(() => ({ data: [] })),
}));

// Mock ROLE_CONFIG
vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    comercial: { label: 'Comercial', color: '#6366F1', icon: () => null },
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 días',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockProfiles = [
  { id: 'user1', nombre: 'Juan Pérez', avatar: null, color: '#6366F1' },
];

const _mockApplications: MasterApplication[] = [
  {
    id: 'app1',
    user_id: 'user1',
    role_name: 'comercial',
    project_id: null,
    status: 'voting',
    motivation: 'Test motivation',
    achievements: [],
    votes_for: 3,
    votes_against: 1,
    votes_required: 8,
    voting_deadline: new Date().toISOString(),
    reviewed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('ApplicationsList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders empty state when no applications', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ApplicationsList
          applications={[]}
          profiles={mockProfiles}
        />
      </QueryClientProvider>
    );
    expect(screen.getByText('Sin aplicaciones pendientes')).toBeInTheDocument();
  });

  it('renders empty state message', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ApplicationsList
          applications={[]}
          profiles={mockProfiles}
        />
      </QueryClientProvider>
    );
    expect(screen.getByText('No hay aplicaciones en votación actualmente')).toBeInTheDocument();
  });

  it('renders Clock icon in empty state', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ApplicationsList
          applications={[]}
          profiles={mockProfiles}
        />
      </QueryClientProvider>
    );
    const clockIcon = container.querySelector('.lucide-clock');
    expect(clockIcon).toBeInTheDocument();
  });
});
