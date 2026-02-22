import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RankingsView } from './RankingsView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'user1', nombre: 'Test User' } }),
}));

vi.mock('@/hooks/useDevelopment', () => ({
  useRoleRankings: () => ({ data: [], isLoading: false }),
  useRolePerformance: () => ({ data: [] }),
}));

vi.mock('@/hooks/useNovaData', () => ({
  useProfiles: () => ({ data: [] }),
  useProjects: () => ({ data: [], isLoading: false }),
  useProjectMembers: () => ({ data: [] }),
}));

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title }: { title: string }) => <div data-testid="nova-header">{title}</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

vi.mock('@/components/ui/how-it-works', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How it works</div>,
}));

vi.mock('@/components/rankings/RankingLeaderboard', () => ({
  RankingLeaderboard: () => <div data-testid="ranking-leaderboard">Leaderboard Content</div>,
}));

vi.mock('@/components/rankings/RankingTrends', () => ({
  RankingTrends: () => <div data-testid="ranking-trends">Trends</div>,
}));

vi.mock('@/components/rankings/MyRankingCard', () => ({
  MyRankingCard: () => <div data-testid="my-ranking-card">My Ranking</div>,
}));

vi.mock('@/components/preview/RankingsPreviewModal', () => ({
  RankingsPreviewModal: () => <div data-testid="preview-modal" />,
}));

vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {},
}));

describe('RankingsView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <RankingsView />
    </QueryClientProvider>
  );

  it('renders rankings title', () => {
    renderComponent();
    expect(screen.getByText('Rankings')).toBeInTheDocument();
  });

  it('renders leaderboard tab', () => {
    renderComponent();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('renders tendencias tab', () => {
    renderComponent();
    expect(screen.getByText('Tendencias')).toBeInTheDocument();
  });

  it('renders participantes stat', () => {
    renderComponent();
    expect(screen.getByText('Participantes')).toBeInTheDocument();
  });
});
