import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MeetingQuestionViewer } from './MeetingQuestionViewer';

const mockQuestions = [
  {
    pregunta: '¿Qué resultados lograste esta semana?',
    subtitulo: 'Revisión de objetivos',
    categoria: 'resultados' as const,
    prioridad: 1 as const,
    tiempo_sugerido_minutos: 10,
    por_que_esta_pregunta: 'Para entender el progreso',
    basada_en: 'Datos del equipo',
    guia: {
      objetivo_de_la_pregunta: 'Medir progreso',
      como_introducirla: 'Comencemos revisando...',
      preguntas_de_seguimiento: ['¿Qué aprendiste?'],
      dinamica_sugerida: {
        formato: 'ronda',
        descripcion: 'Ronda de participación',
        pasos: ['Paso 1', 'Paso 2'],
      },
      que_buscar_en_respuestas: ['Claridad'],
      red_flags: ['Evasivas'],
      como_cerrar: 'Resumir puntos clave',
      accion_resultante: 'Crear tareas de seguimiento',
    },
    relacionada_con_miembros: [],
  },
];

describe('MeetingQuestionViewer', () => {
  it('renders meeting title', () => {
    render(<MeetingQuestionViewer questions={mockQuestions} roleLabel="Comercial" />);
    expect(screen.getByText('Reunión de Comercial')).toBeInTheDocument();
  });

  it('shows question count', () => {
    render(<MeetingQuestionViewer questions={mockQuestions} roleLabel="Comercial" />);
    expect(screen.getByText(/1 preguntas/)).toBeInTheDocument();
  });

  it('displays total time estimate', () => {
    render(<MeetingQuestionViewer questions={mockQuestions} roleLabel="Comercial" />);
    expect(screen.getByText(/10 minutos/)).toBeInTheDocument();
  });

  it('renders question text', () => {
    render(<MeetingQuestionViewer questions={mockQuestions} roleLabel="Comercial" />);
    expect(screen.getByText('¿Qué resultados lograste esta semana?')).toBeInTheDocument();
  });

  it('shows completion badge', () => {
    render(<MeetingQuestionViewer questions={mockQuestions} roleLabel="Comercial" />);
    expect(screen.getByText(/0\/1 completadas/)).toBeInTheDocument();
  });
});
