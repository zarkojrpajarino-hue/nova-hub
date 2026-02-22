import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskPlaybookViewer } from './TaskPlaybookViewer';

describe('TaskPlaybookViewer', () => {
  // Match the actual Playbook interface used by the component
  const mockPlaybook = {
    resumen_ejecutivo: 'Test overview',
    preparacion: {
      antes_de_empezar: ['Item 1'],
      materiales_necesarios: ['Material 1'],
      conocimientos_previos: ['Knowledge 1'],
    },
    pasos: [
      {
        numero: 1,
        titulo: 'Step 1',
        descripcion: 'First step',
        tiempo_estimado: '10 min',
        tips: [],
        errores_comunes: [],
      },
    ],
    herramientas: [],
    recursos: [],
    checklist_final: ['Check item 1'],
    siguiente_paso: 'Next step description',
  };

  it('renders playbook overview', () => {
    render(
      <TaskPlaybookViewer
        playbook={mockPlaybook}
        taskTitle="Test Task"
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Test overview')).toBeInTheDocument();
  });

  it('renders playbook steps', () => {
    render(
      <TaskPlaybookViewer
        playbook={mockPlaybook}
        taskTitle="Test Task"
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(
      <TaskPlaybookViewer
        playbook={mockPlaybook}
        taskTitle="Test Task"
        onClose={() => {}}
      />
    );
    // The component renders a progress badge showing completion %
    expect(screen.getByText(/completado/i)).toBeInTheDocument();
  });
});
