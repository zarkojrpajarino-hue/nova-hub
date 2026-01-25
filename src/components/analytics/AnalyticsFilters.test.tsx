import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsFilters } from './AnalyticsFilters';

const mockMembers = [
  { id: 'user1', nombre: 'Juan Pérez', color: '#6366F1', obvs: 10, lps: 2, facturacion: 5000 },
  { id: 'user2', nombre: 'María García', color: '#22C55E', obvs: 8, lps: 1, facturacion: 3000 },
  { id: 'user3', nombre: 'Carlos López', color: '#F59E0B', obvs: 12, lps: 3, facturacion: 7000 },
];

describe('AnalyticsFilters', () => {
  const mockOnPartnersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter label', () => {
    render(
      <AnalyticsFilters
        members={mockMembers}
        selectedPartners={[]}
        onPartnersChange={mockOnPartnersChange}
      />
    );
    expect(screen.getByText('Filtrar por socios:')).toBeInTheDocument();
  });

  it('renders all member checkboxes', () => {
    render(
      <AnalyticsFilters
        members={mockMembers}
        selectedPartners={[]}
        onPartnersChange={mockOnPartnersChange}
      />
    );
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('shows select all button', () => {
    render(
      <AnalyticsFilters
        members={mockMembers}
        selectedPartners={[]}
        onPartnersChange={mockOnPartnersChange}
      />
    );
    expect(screen.getByText('Seleccionar todos')).toBeInTheDocument();
  });

  it('shows clear button', () => {
    render(
      <AnalyticsFilters
        members={mockMembers}
        selectedPartners={[]}
        onPartnersChange={mockOnPartnersChange}
      />
    );
    expect(screen.getByText('Limpiar')).toBeInTheDocument();
  });

  it('calls onPartnersChange with all IDs when select all clicked', async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsFilters
        members={mockMembers}
        selectedPartners={[]}
        onPartnersChange={mockOnPartnersChange}
      />
    );

    await user.click(screen.getByText('Seleccionar todos'));

    expect(mockOnPartnersChange).toHaveBeenCalledWith(['user1', 'user2', 'user3']);
  });

  it('calls onPartnersChange with empty array when clear clicked', async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsFilters
        members={mockMembers}
        selectedPartners={['user1', 'user2']}
        onPartnersChange={mockOnPartnersChange}
      />
    );

    await user.click(screen.getByText('Limpiar'));

    expect(mockOnPartnersChange).toHaveBeenCalledWith([]);
  });

  it('toggles partner selection when checkbox clicked', async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsFilters
        members={mockMembers}
        selectedPartners={[]}
        onPartnersChange={mockOnPartnersChange}
      />
    );

    const checkbox = screen.getByLabelText(/Juan Pérez/);
    await user.click(checkbox);

    expect(mockOnPartnersChange).toHaveBeenCalledWith(['user1']);
  });

  it('removes partner when already selected', async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsFilters
        members={mockMembers}
        selectedPartners={['user1', 'user2']}
        onPartnersChange={mockOnPartnersChange}
      />
    );

    const checkbox = screen.getByLabelText(/Juan Pérez/);
    await user.click(checkbox);

    expect(mockOnPartnersChange).toHaveBeenCalledWith(['user2']);
  });

  it('displays member initials in colored badges', () => {
    const { container } = render(
      <AnalyticsFilters
        members={mockMembers}
        selectedPartners={[]}
        onPartnersChange={mockOnPartnersChange}
      />
    );
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
});
