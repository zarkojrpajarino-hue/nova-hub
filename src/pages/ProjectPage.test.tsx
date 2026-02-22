import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProjectPage from './ProjectPage';

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1', nombre: 'Test User' } })),
}));

// Mock optimized data hooks
vi.mock('@/hooks/useNovaDataOptimized', () => ({
  useProjects: vi.fn(() => ({
    data: [
      {
        id: 'proj1',
        nombre: 'Test Project',
        descripcion: 'A test project',
        fase: 'ideacion',
        tipo: 'validacion',
        onboarding_completed: true,
        icon: '🚀',
        color: '#6366F1',
      },
    ],
    isLoading: false,
  })),
  useProjectTeamMembers: vi.fn(() => ({ data: [], isLoading: false })),
  useProjectStats: vi.fn(() => ({ data: null, isLoading: false })),
  useProjectLeads: vi.fn(() => ({ data: [], isLoading: false })),
}));

// Mock project tab components
vi.mock('@/components/project/ProjectDashboardTab', () => ({
  ProjectDashboardTab: () => <div data-testid="project-dashboard-tab">Dashboard</div>,
}));
vi.mock('@/components/project/ProjectTeamTab', () => ({
  ProjectTeamTab: () => <div data-testid="project-team-tab">Team</div>,
}));
vi.mock('@/components/project/ProjectCRMTab', () => ({
  ProjectCRMTab: () => <div data-testid="project-crm-tab">CRM</div>,
}));
vi.mock('@/components/project/ProjectTasksTab', () => ({
  ProjectTasksTab: () => <div data-testid="project-tasks-tab">Tasks</div>,
}));
vi.mock('@/components/project/ProjectOBVsTab', () => ({
  ProjectOBVsTab: () => <div data-testid="project-obvs-tab">OBVs</div>,
}));
vi.mock('@/components/project/ProjectFinancialTab', () => ({
  ProjectFinancialTab: () => <div data-testid="project-financial-tab">Financial</div>,
}));
vi.mock('@/components/project/ProjectOnboardingTab', () => ({
  ProjectOnboardingTab: () => <div data-testid="project-onboarding-tab">Onboarding</div>,
}));
vi.mock('@/components/project/ProjectHelpMenu', () => ({
  ProjectHelpMenu: () => null,
}));
vi.mock('@/components/projects/DeleteProjectDialog', () => ({
  DeleteProjectDialog: () => null,
}));
vi.mock('@/components/generative/GeneratedBusinessDashboard', () => ({
  GeneratedBusinessDashboard: () => <div data-testid="generated-business-dashboard">Business IA</div>,
}));
vi.mock('@/components/ui/section-help', () => ({
  HelpWidget: () => null,
}));

describe('ProjectPage', () => {
  it('renders project page without crashing', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <MemoryRouter initialEntries={['/projects/proj1']}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/projects/:projectId" element={<ProjectPage />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(container).toBeInTheDocument();
  });

  it('shows not found when no project matches', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { getByText } = render(
      <MemoryRouter initialEntries={['/projects/nonexistent']}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/projects/:projectId" element={<ProjectPage />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(getByText('Proyecto no encontrado')).toBeInTheDocument();
  });
});
