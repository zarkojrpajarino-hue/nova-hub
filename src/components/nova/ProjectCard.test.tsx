import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectCard } from './ProjectCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    nombre: 'Test Project',
    icon: '🚀',
    color: '#6366F1',
    fase: 'validacion',
    tipo: 'validacion',
    onboarding_completed: true,
    members: ['user1', 'user2'],
  };

  const mockMembers = [
    { id: 'user1', nombre: 'John Doe', color: '#FF0000' },
    { id: 'user2', nombre: 'Jane Smith', color: '#00FF00' },
  ];

  const mockRoles = [
    { project_id: '1', member_id: 'user1', role: 'sales' },
    { project_id: '1', member_id: 'user2', role: 'marketing' },
  ];

  it('renders project name correctly', () => {
    render(
      <BrowserRouter>
        <ProjectCard
          project={mockProject}
          members={mockMembers}
          roles={mockRoles}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('displays project icon', () => {
    render(
      <BrowserRouter>
        <ProjectCard
          project={mockProject}
          members={mockMembers}
          roles={mockRoles}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('navigates to project page on click', () => {
    render(
      <BrowserRouter>
        <ProjectCard
          project={mockProject}
          members={mockMembers}
          roles={mockRoles}
        />
      </BrowserRouter>
    );

    const card = screen.getByText('Test Project').closest('div');
    if (card) {
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith('/proyecto/1');
    }
  });

  it('shows onboarding pending badge when not completed', () => {
    const incompleteProject = { ...mockProject, onboarding_completed: false };

    render(
      <BrowserRouter>
        <ProjectCard
          project={incompleteProject}
          members={mockMembers}
          roles={mockRoles}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/Onboarding pendiente/i)).toBeInTheDocument();
  });

  it('displays team members when onboarding is completed', () => {
    render(
      <BrowserRouter>
        <ProjectCard
          project={mockProject}
          members={mockMembers}
          roles={mockRoles}
        />
      </BrowserRouter>
    );

    // Check that member initials are displayed
    expect(screen.getByTitle('John Doe')).toBeInTheDocument();
    expect(screen.getByTitle('Jane Smith')).toBeInTheDocument();
  });
});
