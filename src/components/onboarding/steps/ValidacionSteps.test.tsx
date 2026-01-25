import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  StepProblema, 
  StepCliente, 
  StepSolucion, 
  StepHipotesis, 
  StepMetricas, 
  StepRecursos 
} from './ValidacionSteps';

const mockData = {
  tipo: 'validacion' as const,
  problema: '',
  cliente_objetivo: '',
  solucion_propuesta: '',
  hipotesis: [],
  metricas_exito: '',
  recursos_disponibles: '',
};

describe('ValidacionSteps', () => {
  const onChange = () => {};
  const errors = {};

  it('StepProblema renders problema identificado title', () => {
    render(<StepProblema data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText('Problema Identificado')).toBeInTheDocument();
  });

  it('StepCliente renders cliente objetivo title', () => {
    render(<StepCliente data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText('Cliente Objetivo')).toBeInTheDocument();
  });

  it('StepSolucion renders solucion propuesta title', () => {
    render(<StepSolucion data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText('Solución Propuesta')).toBeInTheDocument();
  });

  it('StepHipotesis renders hipotesis title', () => {
    render(<StepHipotesis data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText('Hipótesis a Validar')).toBeInTheDocument();
  });

  it('StepMetricas renders metricas title', () => {
    render(<StepMetricas data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText('Métricas de Éxito')).toBeInTheDocument();
  });

  it('StepRecursos renders recursos title', () => {
    render(<StepRecursos data={mockData} onChange={onChange} errors={errors} />);
    expect(screen.getByText('Recursos Disponibles')).toBeInTheDocument();
  });
});
