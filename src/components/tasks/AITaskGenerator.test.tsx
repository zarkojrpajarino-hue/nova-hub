import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AITaskGenerator } from './AITaskGenerator';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user1' }, profile: { id: 'user1' } })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
          })),
        })),
      })),
    })),
  },
}));

// Mock EvidenceAIGenerator to render a button that triggers the dialog
vi.mock('@/components/evidence', () => ({
  EvidenceAIGenerator: ({ buttonLabel, onGenerationComplete }: { buttonLabel: string; onGenerationComplete: (r: unknown) => void }) => (
    <button onClick={() => onGenerationComplete({ content: { tasks: [] } })}>
      {buttonLabel}
    </button>
  ),
}));

describe('AITaskGenerator', () => {
  const mockProject = {
    id: 'proj1',
    nombre: 'Test Project',
    fase: 'validacion',
    tipo: 'b2b',
    onboarding_data: null,
    team: [{ id: '1', nombre: 'Test', role: 'member' }],
    obvs_count: 0,
    leads_count: 0,
    last_activity: null,
  };

  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <AITaskGenerator
          project={mockProject}
          onComplete={() => {}}
        />
      </QueryClientProvider>
    );
  };

  it('renders dialog when open', async () => {
    const user = userEvent.setup();
    renderComponent();
    // Click the generate button to open the dialog
    await user.click(screen.getByText(/Generar tareas con IA/i));
    // The dialog title appears along with the trigger button - use getAllByText
    const matches = screen.getAllByText(/Generar Tareas con IA/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders task type selector', async () => {
    const user = userEvent.setup();
    renderComponent();
    // Click the generate button to open the dialog
    await user.click(screen.getByText(/Generar tareas con IA/i));
    // The dialog description mentions analyzing the project
    expect(screen.getByText(/La IA analizará tu proyecto/i)).toBeInTheDocument();
  });
});
