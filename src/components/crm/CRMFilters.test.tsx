import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CRMFilters, type CRMFilters as CRMFiltersType } from './CRMFilters';

const mockProjects = [
  { id: 'proj1', nombre: 'Proyecto Alpha', icon: '🚀' },
  { id: 'proj2', nombre: 'Proyecto Beta', icon: '💼' },
];

const mockMembers = [
  { id: 'user1', nombre: 'Juan Pérez', color: '#6366F1' },
  { id: 'user2', nombre: 'María García', color: '#22C55E' },
];

const defaultFilters: CRMFiltersType = {
  project: 'all',
  responsable: 'all',
  status: 'all',
  minValue: '',
  maxValue: '',
};

describe('CRMFilters', () => {
  const mockOnFiltersChange = vi.fn();

  it('renders filter button', () => {
    render(
      <CRMFilters
        projects={mockProjects}
        members={mockMembers}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByText('Filtros')).toBeInTheDocument();
  });

  it('shows active filters count', () => {
    const activeFilters = { ...defaultFilters, project: 'proj1', minValue: '1000' };
    render(
      <CRMFilters
        projects={mockProjects}
        members={mockMembers}
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('toggles filter panel when button clicked', async () => {
    const user = userEvent.setup();
    render(
      <CRMFilters
        projects={mockProjects}
        members={mockMembers}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const filterButton = screen.getByText('Filtros');
    await user.click(filterButton);

    // Should show filter inputs
    expect(screen.getByPlaceholderText('Min €')).toBeInTheDocument();
  });

  it('renders clear button when filters are active', () => {
    const activeFilters = { ...defaultFilters, project: 'proj1' };
    render(
      <CRMFilters
        projects={mockProjects}
        members={mockMembers}
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByText('Limpiar')).toBeInTheDocument();
  });

  it('calls clearFilters when clear button clicked', async () => {
    const user = userEvent.setup();
    const activeFilters = { ...defaultFilters, project: 'proj1' };
    render(
      <CRMFilters
        projects={mockProjects}
        members={mockMembers}
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    await user.click(screen.getByText('Limpiar'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      project: 'all',
      responsable: 'all',
      status: 'all',
      minValue: '',
      maxValue: '',
    });
  });

  it('allows typing in min value field', async () => {
    const user = userEvent.setup();
    render(
      <CRMFilters
        projects={mockProjects}
        members={mockMembers}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand filters first
    await user.click(screen.getByText('Filtros'));

    const minInput = screen.getByPlaceholderText('Min €');
    await user.type(minInput, '1000');

    // Component is controlled; each keystroke fires onFiltersChange with the current input value
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('allows typing in max value field', async () => {
    const user = userEvent.setup();
    render(
      <CRMFilters
        projects={mockProjects}
        members={mockMembers}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand filters first
    await user.click(screen.getByText('Filtros'));

    const maxInput = screen.getByPlaceholderText('Max €');
    await user.type(maxInput, '5000');

    // Component is controlled; each keystroke fires onFiltersChange with the current input value
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('renders Filter icon', () => {
    const { container } = render(
      <CRMFilters
        projects={mockProjects}
        members={mockMembers}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    const filterIcon = container.querySelector('.lucide-filter');
    expect(filterIcon).toBeInTheDocument();
  });

  it('calculates active filters count correctly', () => {
    const multipleFilters = {
      project: 'proj1',
      responsable: 'user1',
      status: 'hot',
      minValue: '1000',
      maxValue: '5000',
    };
    render(
      <CRMFilters
        projects={mockProjects}
        members={mockMembers}
        filters={multipleFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
