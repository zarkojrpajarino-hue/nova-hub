import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoreaEspanaStep } from './CoreaEspanaStep';

const mockData = {
  tipo: 'validacion' as const,
  problema: 'Test problem',
  cliente_objetivo: 'Test client',
  solucion_propuesta: 'Test solution',
  hipotesis: [],
  metricas_exito: 'Test metrics',
  recursos_disponibles: 'Test resources',
  contexto_corea: {
    viaje_planeado: false,
    fechas_tentativas: '',
    que_validar_desde_corea: [],
    conexiones_locales: '',
    necesidades_especificas: '',
  },
};

describe('CoreaEspanaStep', () => {
  const onChange = () => {};
  const errors = {};

  it('renders corea espana step title', () => {
    render(<CoreaEspanaStep data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText(/Contexto Corea-España/)).toBeInTheDocument();
  });

  it('renders viaje planeado section', () => {
    render(<CoreaEspanaStep data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText(/¿Tienes planeado viajar a Corea?/)).toBeInTheDocument();
  });

  it('renders validar desde corea section', () => {
    render(<CoreaEspanaStep data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText(/¿Qué necesitas validar desde Corea?/)).toBeInTheDocument();
  });
});
