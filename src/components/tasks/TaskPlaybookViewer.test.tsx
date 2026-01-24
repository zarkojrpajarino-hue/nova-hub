import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskPlaybookViewer } from './TaskPlaybookViewer';

describe('TaskPlaybookViewer', () => {
  const mockPlaybook = {
    overview: 'Test overview',
    steps: [
      { title: 'Step 1', description: 'First step', estimatedTime: '10 min' },
    ],
    tips: ['Tip 1'],
    resources: ['Resource 1'],
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
    expect(screen.getByText(/Cerrar/i)).toBeInTheDocument();
  });
});
