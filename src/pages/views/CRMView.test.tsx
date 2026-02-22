import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CRMView } from './CRMView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title }: { title: string }) => <div data-testid="nova-header">{title}</div>,
}));

vi.mock('@/components/crm/CRMPipeline', () => ({
  CRMPipeline: () => <div data-testid="crm-pipeline">Pipeline</div>,
}));

vi.mock('@/components/crm/CRMFilters', () => ({
  CRMFilters: () => <div data-testid="crm-filters">Filters</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

vi.mock('@/components/ui/how-it-works', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How it works</div>,
}));

vi.mock('@/components/preview/CRMPreviewModal', () => ({
  CRMPreviewModal: () => null,
}));

vi.mock('@/components/crm/AILeadFinder', () => ({
  AILeadFinder: () => <div data-testid="ai-lead-finder">AI Lead Finder</div>,
}));

vi.mock('@/components/crm/AILeadScoring', () => ({
  AILeadScoring: () => <div data-testid="ai-lead-scoring">AI Lead Scoring</div>,
}));

vi.mock('@/components/crm/EmailPitchGenerator', () => ({
  EmailPitchGenerator: () => <div data-testid="email-pitch-generator">Email Pitch Generator</div>,
}));

vi.mock('@/components/export/ExportButton', () => ({
  ExportButton: () => <div data-testid="export-button">Export</div>,
}));

vi.mock('@/hooks/useNovaData', () => ({
  usePipelineGlobal: vi.fn(() => ({ data: [], isLoading: false })),
  useProjects: vi.fn(() => ({ data: [], isLoading: false })),
  useProfiles: vi.fn(() => ({ data: [], isLoading: false })),
}));

describe('CRMView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <CRMView />
    </QueryClientProvider>
  );

  it('renders crm global title', () => {
    renderComponent();
    expect(screen.getByText('CRM Global')).toBeInTheDocument();
  });

  it('renders vista general tab', () => {
    renderComponent();
    expect(screen.getByText('Vista General')).toBeInTheDocument();
  });

  it('renders pipeline kanban tab', () => {
    renderComponent();
    expect(screen.getByText('Pipeline Kanban')).toBeInTheDocument();
  });

  it('renders lista detallada tab', () => {
    renderComponent();
    expect(screen.getByText('Lista Detallada')).toBeInTheDocument();
  });
});
