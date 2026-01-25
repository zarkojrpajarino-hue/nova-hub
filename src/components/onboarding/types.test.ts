import { describe, it, expect } from 'vitest';

// Type-only imports for testing purposes
type OnboardingData = import('./types').OnboardingData;
type ValidacionData = import('./types').ValidacionData;
type OperacionData = import('./types').OperacionData;

describe('onboarding types', () => {
  it('can create validacion data object', () => {
    const data: ValidacionData = {
      tipo: 'validacion',
      problema: 'Test problem',
      cliente_objetivo: 'Test client',
      solucion_propuesta: 'Test solution',
      hipotesis: ['Test hypothesis'],
      metricas_exito: 'Test metrics',
      recursos_disponibles: 'Test resources',
    };
    
    expect(data.tipo).toBe('validacion');
    expect(data.problema).toBe('Test problem');
  });

  it('can create operacion data object', () => {
    const data: OperacionData = {
      tipo: 'operacion',
      modelo_negocio: {
        propuesta_valor: 'Test',
        segmento_clientes: 'Test',
        canales: 'Test',
        fuentes_ingresos: 'Test',
        recursos_clave: 'Test',
        actividades_clave: 'Test',
      },
      facturacion_actual: 1000,
      pipeline_valor: 500,
      objetivos_q1: 'Test',
    };
    
    expect(data.tipo).toBe('operacion');
    expect(data.facturacion_actual).toBe(1000);
  });

  it('types are distinct', () => {
    const validacion: ValidacionData = {
      tipo: 'validacion',
      problema: 'Test',
      cliente_objetivo: 'Test',
      solucion_propuesta: 'Test',
      hipotesis: [],
      metricas_exito: 'Test',
      recursos_disponibles: 'Test',
    };

    expect(validacion.tipo).not.toBe('operacion');
  });
});
