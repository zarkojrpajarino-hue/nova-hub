import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplicationsList } from './ApplicationsList';

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

const mockProfiles = [
  { id: 'user1', nombre: 'Juan Pérez', avatar: null, color: '#6366F1' },
];

const mockApplications: any[] = [
  {
    id: 'app1',
    user_id: 'user1',
    role_name: 'comercial',
    status: 'voting',
    motivation: 'Test motivation',
    achievements: [],
    votes_for: 3,
    votes_against: 1,
    votes_required: 8,
    voting_deadline: new Date().toISOString(),
    created_at: new Date().toISOString(),
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

  const renderComponent = (props: any = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ApplicationsList
          applications={mockApplications}
          profiles={mockProfiles}
          currentUserId="user2"
          {...props}
        />
      </QueryClientProvider>
    );
  };

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

  it('renders application card when applications exist', () => {
    renderComponent();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('shows voting status badge', () => {
    renderComponent();
    expect(screen.getByText('En Votación')).toBeInTheDocument();
  });
});
