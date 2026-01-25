import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepCanvas1, StepCanvas2, StepFinanzas, StepObjetivos } from './OperacionSteps';

const mockData = {
  tipo: 'operacion' as const,
  modelo_negocio: {
    propuesta_valor: '',
    segmento_clientes: '',
    canales: '',
    fuentes_ingresos: '',
    recursos_clave: '',
    actividades_clave: '',
  },
  facturacion_actual: 0,
  pipeline_valor: 0,
  objetivos_q1: '',
};

describe('OperacionSteps', () => {
  const onChange = () => {};
  const errors = {};

  it('StepCanvas1 renders business model canvas part 1', () => {
    render(<StepCanvas1 data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText('Business Model Canvas - Parte 1')).toBeInTheDocument();
  });

  it('StepCanvas1 renders propuesta de valor field', () => {
    render(<StepCanvas1 data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText('Propuesta de Valor *')).toBeInTheDocument();
  });

  it('StepCanvas2 renders business model canvas part 2', () => {
    render(<StepCanvas2 data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText('Business Model Canvas - Parte 2')).toBeInTheDocument();
  });

  it('StepFinanzas renders metricas actuales', () => {
    render(<StepFinanzas data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText('Métricas Actuales')).toBeInTheDocument();
  });

  it('StepObjetivos renders objetivos title', () => {
    render(<StepObjetivos data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText(/Objetivos/)).toBeInTheDocument();
  });
});
