import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoreaEspanaStep } from './CoreaEspanaStep';
import { defaultContextoCorea } from '../types';

const mockData = {
  tipo: 'validacion' as const,
  problema: 'Test problem',
  cliente_objetivo: 'Test client',
  solucion_propuesta: 'Test solution',
  hipotesis: ['Test hypothesis'],
  metricas_exito: 'Test metrics',
  recursos_disponibles: 'Test resources',
  contexto_corea: defaultContextoCorea,
};

describe('CoreaEspanaStep', () => {
  const onChange = () => {};
  const errors = {};

  it('renders corea espana step title', () => {
    render(<CoreaEspanaStep data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText(/Plan Corea/)).toBeInTheDocument();
  });

  it('renders validar desde corea section', () => {
    render(<CoreaEspanaStep data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText(/¿Qué puedes validar DESDE Corea?/)).toBeInTheDocument();
  });

  it('renders plan espana section', () => {
    render(<CoreaEspanaStep data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText(/Plan para España/)).toBeInTheDocument();
  });
});
