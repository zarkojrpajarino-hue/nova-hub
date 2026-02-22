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

// Mock leadService - the form uses leadService.create() internally
vi.mock('@/services/LeadService', () => ({
  leadService: {
    create: vi.fn(() => Promise.resolve({ id: 'new-lead', nombre: 'Test' })),
  },
}));

import { leadService } from '@/services/LeadService';

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
    // Labels contain icons (SVG) + text, use flexible matchers
    expect(screen.getByLabelText(/nombre del contacto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
  });

  it('allows typing in nombre field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nombreInput = screen.getByLabelText(/nombre del contacto/i);
    await user.type(nombreInput, 'Cliente Potencial');

    expect(nombreInput).toHaveValue('Cliente Potencial');
  });

  it('allows typing in empresa field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const empresaInput = screen.getByLabelText(/empresa/i);
    await user.type(empresaInput, 'Empresa XYZ');

    expect(empresaInput).toHaveValue('Empresa XYZ');
  });

  it('validates required nombre field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const submitButton = screen.getByText(/Crear Lead/);
    await user.click(submitButton);

    // Validation fires before leadService.create() is called
    expect(leadService.create).not.toHaveBeenCalled();
  });

  it('submits form successfully', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.fn(() => Promise.resolve({ id: 'new-lead', nombre: 'Test Lead' }));
    (leadService.create as ReturnType<typeof vi.fn>).mockImplementation(mockCreate);

    renderComponent({ projectId: 'proj1' });

    await user.type(screen.getByLabelText(/nombre del contacto/i), 'Test Lead');
    await user.type(screen.getByLabelText(/empresa/i), 'Test Corp');
    await user.click(screen.getByText(/Crear Lead/));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    (leadService.create as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 'x' }), 100))
    );

    renderComponent({ projectId: 'proj1' });

    await user.type(screen.getByLabelText(/nombre del contacto/i), 'Test');
    await user.type(screen.getByLabelText(/empresa/i), 'Test Corp');
    await user.click(screen.getByText(/Crear Lead/));

    expect(screen.getByText(/Creando/)).toBeInTheDocument();
  });

  it('invalidates queries after successful submission', async () => {
    const user = userEvent.setup();
    (leadService.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-lead' });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    renderComponent({ projectId: 'proj1' });

    await user.type(screen.getByLabelText(/nombre del contacto/i), 'Test');
    await user.type(screen.getByLabelText(/empresa/i), 'Test Corp');
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
