import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingSummary } from './OnboardingSummary';

const mockValidacionData = {
  tipo: 'validacion' as const,
  problema: 'Test problem',
  cliente_objetivo: 'Test customer',
  solucion_propuesta: 'Test solution',
  hipotesis: ['Test hypothesis'],
  metricas_exito: 'Test metrics',
  recursos_disponibles: 'Test resources',
};

const mockOperacionData = {
  tipo: 'operacion' as const,
  modelo_negocio: {
    propuesta_valor: 'Test value',
    segmento_clientes: 'Test segment',
    canales: 'Test channels',
    fuentes_ingresos: 'Test revenue',
    recursos_clave: 'Test resources',
    actividades_clave: 'Test activities',
  },
  facturacion_actual: 10000,
  pipeline_valor: 5000,
  objetivos_q1: 'Test objectives',
};

describe('OnboardingSummary', () => {
  it('renders validacion summary', () => {
    render(<OnboardingSummary data={mockValidacionData} projectColor="#6366F1" />);
    expect(screen.getByText('Onboarding Completado')).toBeInTheDocument();
    expect(screen.getByText('🧪 Modo Validación')).toBeInTheDocument();
  });

  it('renders operacion summary', () => {
    render(<OnboardingSummary data={mockOperacionData} projectColor="#6366F1" />);
    expect(screen.getByText('Onboarding Completado')).toBeInTheDocument();
    expect(screen.getByText('🚀 Modo Operación')).toBeInTheDocument();
  });

  it('displays edit button when onEdit provided', () => {
    render(<OnboardingSummary data={mockValidacionData} projectColor="#6366F1" onEdit={() => {}} />);
    expect(screen.getByText('Editar')).toBeInTheDocument();
  });
});
