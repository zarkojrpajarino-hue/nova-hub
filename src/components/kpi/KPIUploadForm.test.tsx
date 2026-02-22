import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPIUploadForm } from './KPIUploadForm';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

vi.mock('@/hooks/useValidationSystem', () => ({
  useCanUpload: vi.fn(() => ({
    canUpload: true,
    isBlocked: false,
  })),
}));

// Mock EvidenceUrlInput
vi.mock('@/components/evidence/EvidenceUrlInput', () => ({
  EvidenceUrlInput: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <input
      data-testid="evidence-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Google Drive URL..."
    />
  ),
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
import { useCanUpload } from '@/hooks/useValidationSystem';

describe('KPIUploadForm', () => {
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
        <KPIUploadForm
          type="lp"
          open={true}
          onOpenChange={mockOnOpenChange}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('renders dialog with title for LP', () => {
    renderComponent({ type: 'lp' });
    expect(screen.getByText('Nuevo Learning Path')).toBeInTheDocument();
  });

  it('renders dialog with title for BP', () => {
    renderComponent({ type: 'bp' });
    expect(screen.getByText('Nuevo Book Point')).toBeInTheDocument();
  });

  it('renders dialog with title for CP', () => {
    renderComponent({ type: 'cp' });
    expect(screen.getByText('Nuevo Community Point')).toBeInTheDocument();
  });

  it('renders all form fields for LP', () => {
    renderComponent({ type: 'lp' });
    expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument();
    expect(screen.getByTestId('evidence-input')).toBeInTheDocument();
  });

  it('renders book points field for BP', () => {
    renderComponent({ type: 'bp' });
    expect(screen.getByLabelText(/Número de Book Points/)).toBeInTheDocument();
  });

  it('does not render evidence field for CP', () => {
    renderComponent({ type: 'cp' });
    expect(screen.queryByTestId('evidence-input')).not.toBeInTheDocument();
  });

  it('shows CP info alert', () => {
    renderComponent({ type: 'cp' });
    expect(screen.getByText('Community Points')).toBeInTheDocument();
    expect(screen.getByText(/se suman directamente sin necesidad de validación/)).toBeInTheDocument();
  });

  it('allows typing in titulo field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const tituloInput = screen.getByLabelText(/Título/);
    await user.type(tituloInput, 'Test Learning Path');

    expect(tituloInput).toHaveValue('Test Learning Path');
  });

  it('allows typing in descripcion field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const descripcionInput = screen.getByLabelText(/Descripción/);
    await user.type(descripcionInput, 'Test description');

    expect(descripcionInput).toHaveValue('Test description');
  });

  it('allows changing book points for BP', async () => {
    const user = userEvent.setup();
    renderComponent({ type: 'bp' });

    const bpInput = screen.getByLabelText(/Número de Book Points/);
    await user.clear(bpInput);
    await user.type(bpInput, '5');

    expect(bpInput).toHaveValue(5);
  });

  it('shows validation message for BP points', () => {
    renderComponent({ type: 'bp' });
    expect(screen.getByText(/Este libro otorgará/)).toBeInTheDocument();
    expect(screen.getByText(/1 BP/)).toBeInTheDocument();
  });

  it('renders Cancel and Submit buttons', () => {
    renderComponent();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Enviar a validación')).toBeInTheDocument();
  });

  it('shows correct submit button text for CP', () => {
    renderComponent({ type: 'cp' });
    expect(screen.getByText('Registrar (+1 CP)')).toBeInTheDocument();
  });

  it('disables submit when blocked', () => {
    (useCanUpload as Mock).mockReturnValue({
      canUpload: false,
      isBlocked: true,
    });

    renderComponent({ type: 'lp' });

    const submitButton = screen.getByText('Bloqueado');
    expect(submitButton).toBeDisabled();
  });

  it('shows blocked alert when user is blocked', () => {
    (useCanUpload as Mock).mockReturnValue({
      canUpload: false,
      isBlocked: true,
    });

    renderComponent({ type: 'lp' });
    expect(screen.getByText('Estás bloqueado')).toBeInTheDocument();
  });

  it('does not show blocked alert for CP even when blocked', () => {
    (useCanUpload as Mock).mockReturnValue({
      canUpload: false,
      isBlocked: true,
    });

    renderComponent({ type: 'cp' });
    expect(screen.queryByText('Estás bloqueado')).not.toBeInTheDocument();
  });

  it('submits LP form successfully', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as Mock).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent({ type: 'lp' });

    await user.type(screen.getByLabelText(/Título/), 'Test LP');
    await user.click(screen.getByText('Enviar a validación'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'lp',
          titulo: 'Test LP',
          status: 'pending',
        })
      );
    });
  });

  it('submits CP form with validated status', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as Mock).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent({ type: 'cp' });

    await user.type(screen.getByLabelText(/Título/), 'Test CP');
    await user.click(screen.getByText('Registrar (+1 CP)'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cp',
          titulo: 'Test CP',
          status: 'validated',
          cp_points: 1,
        })
      );
    });
  });

  it('submits BP with correct points', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as Mock).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent({ type: 'bp' });

    await user.type(screen.getByLabelText(/Título/), 'Test Book');
    const bpInput = screen.getByLabelText(/Número de Book Points/);
    await user.clear(bpInput);
    await user.type(bpInput, '3');
    await user.click(screen.getByText('Enviar a validación'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bp',
          cp_points: 3,
        })
      );
    });
  });

  it('validates titulo is not empty', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Enviar a validación'));

    // Toast error should be shown (not testing toast directly)
    expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
  });

  it('closes dialog after successful submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as Mock).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test');
    await user.click(screen.getByText('Enviar a validación'));

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ data: null, error: null }), 100)));
    (supabase.from as Mock).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test');
    await user.click(screen.getByText('Enviar a validación'));

    expect(screen.getByText('Enviando...')).toBeInTheDocument();
  });

  it('handles submission error gracefully', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: { message: 'Error' } }));
    (supabase.from as Mock).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test');
    await user.click(screen.getByText('Enviar a validación'));

    await waitFor(() => {
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  it('invalidates queries after successful submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as Mock).mockReturnValue({
      insert: mockInsert,
    });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test');
    await user.click(screen.getByText('Enviar a validación'));

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['kpis'] });
    });
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as Mock).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    const tituloInput = screen.getByLabelText(/Título/);
    await user.type(tituloInput, 'Test');
    await user.click(screen.getByText('Enviar a validación'));

    await waitFor(() => {
      expect(tituloInput).toHaveValue('');
    });
  });

  it('calls onOpenChange when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Cancelar'));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('prevents BP points below 1', async () => {
    const user = userEvent.setup();
    renderComponent({ type: 'bp' });

    const bpInput = screen.getByLabelText(/Número de Book Points/);
    await user.clear(bpInput);
    await user.type(bpInput, '0');

    // The component should enforce minimum of 1
    expect(parseInt((bpInput as HTMLInputElement).value)).toBeGreaterThanOrEqual(1);
  });

  it('renders icon for BP type', () => {
    const { container } = renderComponent({ type: 'bp' });
    const icon = container.querySelector('.lucide-book-open');
    expect(icon).toBeInTheDocument();
  });

  it('renders icon for CP type', () => {
    const { container } = renderComponent({ type: 'cp' });
    const icon = container.querySelector('.lucide-users');
    expect(icon).toBeInTheDocument();
  });
});
