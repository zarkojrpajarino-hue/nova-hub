import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepEquipo } from './StepEquipo';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

describe('StepEquipo', () => {
  const mockProps = {
    projectId: 'proj1',
    selectedMembers: [],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders equipo step title', () => {
    render(<StepEquipo {...mockProps} />);
    expect(screen.getByText('Equipo del Proyecto')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<StepEquipo {...mockProps} />);
    expect(screen.getByText('Cargando perfiles...')).toBeInTheDocument();
  });

  it('displays minimum members requirement', () => {
    render(<StepEquipo {...mockProps} minMembers={2} />);
    expect(screen.getByText(/mínimo 2 miembros/)).toBeInTheDocument();
  });
});
