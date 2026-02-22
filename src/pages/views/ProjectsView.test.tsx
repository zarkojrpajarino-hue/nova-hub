import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ProjectsView } from './ProjectsView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock('@/hooks/useNovaData', () => ({
  useProjects: () => ({ data: [], isLoading: false }),
  useProjectMembers: () => ({ data: [] }),
  useMemberStats: () => ({ data: [] }),
  useProfiles: () => ({ data: [] }),
}));

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title }: { title: string }) => <div data-testid="nova-header">{title}</div>,
}));

vi.mock('@/components/nova/ProjectCard', () => ({
  ProjectCard: () => <div data-testid="project-card">Card</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

vi.mock('@/components/ui/how-it-works', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How it works</div>,
}));

vi.mock('@/components/projects/CreateProjectDialog', () => ({
  CreateProjectDialog: ({ trigger }: { trigger: React.ReactNode }) => <div data-testid="create-project-dialog">{trigger}</div>,
}));

vi.mock('@/components/projects/DeletedProjectsDialog', () => ({
  DeletedProjectsDialog: () => <div data-testid="deleted-projects-dialog" />,
}));

vi.mock('./GenerativeOnboardingView', () => ({
  GenerativeOnboardingView: () => <div data-testid="generative-onboarding">Onboarding</div>,
}));

vi.mock('@/components/preview/GenerativeOnboardingPreviewModal', () => ({
  GenerativeOnboardingPreviewModal: () => <div data-testid="preview-modal" />,
}));

vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}));

describe('ProjectsView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ProjectsView />
      </QueryClientProvider>
    </MemoryRouter>
  );

  it('renders proyectos title', () => {
    renderComponent();
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
  });

  it('renders empty state when no projects', () => {
    renderComponent();
    expect(screen.getByText('Aún no tienes proyectos')).toBeInTheDocument();
  });
});
