import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaybookViewer } from './PlaybookViewer';

describe('PlaybookViewer', () => {
  const mockPlaybook = {
    titulo: 'Test Playbook',
    descripcion: 'Test description',
    pasos: [
      { titulo: 'Paso 1', contenido: 'Step content', orden: 1 },
    ],
    recursos: ['Resource 1'],
    tips: ['Tip 1'],
  };

  it('renders playbook title', () => {
    render(<PlaybookViewer playbook={mockPlaybook} />);
    expect(screen.getByText('Test Playbook')).toBeInTheDocument();
  });

  it('renders playbook description', () => {
    render(<PlaybookViewer playbook={mockPlaybook} />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders playbook steps', () => {
    render(<PlaybookViewer playbook={mockPlaybook} />);
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
  });
});
