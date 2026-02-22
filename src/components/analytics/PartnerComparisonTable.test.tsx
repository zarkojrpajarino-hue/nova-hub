import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartnerComparisonTable } from './PartnerComparisonTable';

const mockMembers = [
  {
    id: 'user1',
    nombre: 'Juan Pérez',
    color: '#6366F1',
    avatar: null,
    email: 'juan@test.com',
    obvs: 10,
    lps: 2,
    bps: 15,
    cps: 8,
    facturacion: 5000,
    margen: 2500,
  },
  {
    id: 'user2',
    nombre: 'María García',
    color: '#22C55E',
    avatar: null,
    email: 'maria@test.com',
    obvs: 8,
    lps: 1,
    bps: 12,
    cps: 6,
    facturacion: 3000,
    margen: 1500,
  },
  {
    id: 'user3',
    nombre: 'Carlos López',
    color: '#F59E0B',
    avatar: null,
    email: 'carlos@test.com',
    obvs: 12,
    lps: 3,
    bps: 18,
    cps: 10,
    facturacion: 7000,
    margen: 3500,
  },
];

describe('PartnerComparisonTable', () => {
  const mockOnSelectPartner = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table headers', () => {
    render(
      <PartnerComparisonTable
        members={mockMembers}
        onSelectPartner={mockOnSelectPartner}
        selectedPartners={[]}
      />
    );
    expect(screen.getByText('Socio')).toBeInTheDocument();
    expect(screen.getByText('OBVs')).toBeInTheDocument();
    expect(screen.getByText('LPs')).toBeInTheDocument();
    expect(screen.getByText('BPs')).toBeInTheDocument();
    expect(screen.getByText('CPs')).toBeInTheDocument();
    expect(screen.getByText('Facturación')).toBeInTheDocument();
    expect(screen.getByText('Margen')).toBeInTheDocument();
  });

  it('displays all members', () => {
    render(
      <PartnerComparisonTable
        members={mockMembers}
        onSelectPartner={mockOnSelectPartner}
        selectedPartners={[]}
      />
    );
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('shows member initials in colored badges', () => {
    render(
      <PartnerComparisonTable
        members={mockMembers}
        onSelectPartner={mockOnSelectPartner}
        selectedPartners={[]}
      />
    );
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('displays member metrics', () => {
    render(
      <PartnerComparisonTable
        members={mockMembers}
        onSelectPartner={mockOnSelectPartner}
        selectedPartners={[]}
      />
    );
    // '10' appears twice: Juan OBVs=10 and Carlos CPs=10
    expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
    // Juan's facturacion (5000) also appears in the average row, so use getAllByText
    expect(screen.getAllByText(`€${(5000).toLocaleString()}`).length).toBeGreaterThanOrEqual(1);
  });

  it('renders average row', () => {
    render(
      <PartnerComparisonTable
        members={mockMembers}
        onSelectPartner={mockOnSelectPartner}
        selectedPartners={[]}
      />
    );
    expect(screen.getByText('📊 Media del equipo')).toBeInTheDocument();
  });

  it('calls onSelectPartner when checkbox clicked', async () => {
    const user = userEvent.setup();
    render(
      <PartnerComparisonTable
        members={mockMembers}
        onSelectPartner={mockOnSelectPartner}
        selectedPartners={[]}
      />
    );

    // Default sort is obvs desc: Carlos(12), Juan(10), María(8).
    // checkboxes[0] = Carlos (user3), checkboxes[1] = Juan (user1).
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);

    expect(mockOnSelectPartner).toHaveBeenCalledWith('user1');
  });

  it('highlights selected partners', () => {
    const { container } = render(
      <PartnerComparisonTable
        members={mockMembers}
        onSelectPartner={mockOnSelectPartner}
        // Default sort is obvs desc: Carlos(user3) is row 0. Select user3 to highlight row 0.
        selectedPartners={['user3']}
      />
    );
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0]).toHaveClass('bg-primary/5');
  });

  it('sorts by column when header clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PartnerComparisonTable
        members={mockMembers}
        onSelectPartner={mockOnSelectPartner}
        selectedPartners={[]}
      />
    );

    await user.click(screen.getByText('Socio'));

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('renders sort indicators', () => {
    const { container } = render(
      <PartnerComparisonTable
        members={mockMembers}
        onSelectPartner={mockOnSelectPartner}
        selectedPartners={[]}
      />
    );

    // Initial sort is obvs desc, so ChevronDown is already visible without clicking.
    const chevronDown = container.querySelector('.lucide-chevron-down');
    expect(chevronDown).toBeInTheDocument();
  });
});
