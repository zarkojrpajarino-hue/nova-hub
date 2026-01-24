import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeadForm, PIPELINE_STAGES } from './LeadForm';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

import { supabase } from '@/integrations/supabase/client';

const mockProjects = [
  { id: 'proj1', nombre: 'Proyecto Alpha', icon: '🚀' },
  { id: 'proj2', nombre: 'Proyecto Beta', icon: '💼' },
];

const mockMembers = [
  { id: 'user1', nombre: 'Juan Pérez', color: '#6366F1' },
  { id: 'user2', nombre: 'María García', color: '#22C55E' },
];

describe('LeadForm', () => {
  let queryClient: QueryClient;
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LeadForm
          projects={mockProjects}
          members={mockMembers}
          open={true}
          onOpenChange={mockOnOpenChange}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('renders dialog title', () => {
    renderComponent();
    expect(screen.getByText('Nuevo Lead')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderComponent();
    expect(screen.getByLabelText(/Nombre del contacto/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Empresa/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument();
  });

  it('allows typing in nombre field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nombreInput = screen.getByLabelText(/Nombre del contacto/);
    await user.type(nombreInput, 'Cliente Potencial');

    expect(nombreInput).toHaveValue('Cliente Potencial');
  });

  it('allows typing in empresa field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const empresaInput = screen.getByLabelText(/Empresa/);
    await user.type(empresaInput, 'Empresa XYZ');

    expect(empresaInput).toHaveValue('Empresa XYZ');
  });

  it('validates required nombre field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const submitButton = screen.getByText(/Crear Lead/);
    await user.click(submitButton);

    // Should show toast error (testing by checking that insert was not called)
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('submits form successfully', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent({ projectId: 'proj1' });

    await user.type(screen.getByLabelText(/Nombre del contacto/), 'Test Lead');
    await user.click(screen.getByText(/Crear Lead/));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ data: null, error: null }), 100)));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent({ projectId: 'proj1' });

    await user.type(screen.getByLabelText(/Nombre del contacto/), 'Test');
    await user.click(screen.getByText(/Crear Lead/));

    expect(screen.getByText(/Creando/)).toBeInTheDocument();
  });

  it('invalidates queries after successful submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    renderComponent({ projectId: 'proj1' });

    await user.type(screen.getByLabelText(/Nombre del contacto/), 'Test');
    await user.click(screen.getByText(/Crear Lead/));

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['pipeline_global'] });
    });
  });

  it('exports PIPELINE_STAGES constant', () => {
    expect(PIPELINE_STAGES).toHaveLength(7);
    expect(PIPELINE_STAGES[0].id).toBe('frio');
    expect(PIPELINE_STAGES[5].id).toBe('cerrado_ganado');
  });
});
