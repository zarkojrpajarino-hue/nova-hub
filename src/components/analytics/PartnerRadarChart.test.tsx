import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PartnerRadarChart } from './PartnerRadarChart';

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Radar: () => <div data-testid="radar" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

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
];

describe('PartnerRadarChart', () => {
  it('renders empty state when no members', () => {
    render(<PartnerRadarChart members={[]} />);
    expect(screen.getByText(/Selecciona 2-3 socios/)).toBeInTheDocument();
  });

  it('shows instruction message in empty state', () => {
    render(<PartnerRadarChart members={[]} />);
    expect(screen.getByText(/para compararlos en el radar/)).toBeInTheDocument();
  });

  it('renders chart components when members provided', () => {
    render(<PartnerRadarChart members={mockMembers} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  it('renders PolarGrid component', () => {
    render(<PartnerRadarChart members={mockMembers} />);
    expect(screen.getByTestId('polar-grid')).toBeInTheDocument();
  });

  it('renders PolarAngleAxis component', () => {
    render(<PartnerRadarChart members={mockMembers} />);
    expect(screen.getByTestId('polar-angle-axis')).toBeInTheDocument();
  });

  it('renders PolarRadiusAxis component', () => {
    render(<PartnerRadarChart members={mockMembers} />);
    expect(screen.getByTestId('polar-radius-axis')).toBeInTheDocument();
  });

  it('renders Radar components for each member', () => {
    render(<PartnerRadarChart members={mockMembers} />);
    const radars = screen.getAllByTestId('radar');
    expect(radars).toHaveLength(2);
  });

  it('renders Legend component', () => {
    render(<PartnerRadarChart members={mockMembers} />);
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('renders Tooltip component', () => {
    render(<PartnerRadarChart members={mockMembers} />);
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('handles single member', () => {
    render(<PartnerRadarChart members={[mockMembers[0]]} />);
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });
});
