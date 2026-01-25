import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChallengesList } from './ChallengesList';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 días',
  format: () => '15 de marzo de 2024',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

// Mock ROLE_CONFIG
vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    comercial: { label: 'Comercial', color: '#6366F1' },
  },
}));

const mockChallenges = [
  {
    id: 'challenge1',
    master_id: 'master1',
    challenger_id: 'user1',
    role_name: 'comercial',
    challenge_type: 'performance',
    status: 'pending',
    description: 'Desafío de rendimiento comercial',
    deadline: '2024-12-31',
    result: null,
    created_at: new Date().toISOString(),
  },
];

const mockMasters = [
  {
    id: 'master1',
    user_id: 'user2',
    role_name: 'comercial',
    level: 1,
    mentees_count: 3,
  },
];

const mockProfiles = [
  { id: 'user1', nombre: 'Juan Pérez', avatar: null, color: '#6366F1' },
  { id: 'user2', nombre: 'María García', avatar: null, color: '#22C55E' },
];

describe('ChallengesList', () => {
  it('renders empty state when no challenges', () => {
    render(
      <ChallengesList
        challenges={[]}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText('Sin desafíos activos')).toBeInTheDocument();
  });

  it('displays empty state message', () => {
    render(
      <ChallengesList
        challenges={[]}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText(/Los desafíos permiten competir/)).toBeInTheDocument();
  });

  it('renders Swords icon in empty state', () => {
    const { container } = render(
      <ChallengesList
        challenges={[]}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    const swordsIcon = container.querySelector('.lucide-swords');
    expect(swordsIcon).toBeInTheDocument();
  });

  it('displays challenge status badge', () => {
    render(
      <ChallengesList
        challenges={mockChallenges}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('shows challenge type badge', () => {
    render(
      <ChallengesList
        challenges={mockChallenges}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText('Rendimiento')).toBeInTheDocument();
  });

  it('displays challenger name', () => {
    render(
      <ChallengesList
        challenges={mockChallenges}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('displays master name', () => {
    render(
      <ChallengesList
        challenges={mockChallenges}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText('María García')).toBeInTheDocument();
  });

  it('shows VS indicator', () => {
    render(
      <ChallengesList
        challenges={mockChallenges}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText('VS')).toBeInTheDocument();
  });

  it('renders Retador label', () => {
    render(
      <ChallengesList
        challenges={mockChallenges}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText('Retador')).toBeInTheDocument();
  });

  it('renders Master label', () => {
    render(
      <ChallengesList
        challenges={mockChallenges}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText('Master')).toBeInTheDocument();
  });

  it('displays challenge description', () => {
    render(
      <ChallengesList
        challenges={mockChallenges}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText('Desafío de rendimiento comercial')).toBeInTheDocument();
  });

  it('shows deadline for pending challenges', () => {
    render(
      <ChallengesList
        challenges={mockChallenges}
        masters={mockMasters}
        profiles={mockProfiles}
      />
    );
    expect(screen.getByText('Fecha límite')).toBeInTheDocument();
  });
});
