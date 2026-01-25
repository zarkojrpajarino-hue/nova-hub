import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MeetingQuestionViewer } from './MeetingQuestionViewer';

const mockQuestions = [
  {
    pregunta: 'Test question',
    subtitulo: 'Test subtitle',
    categoria: 'resultados' as const,
    prioridad: 1 as const,
    tiempo_sugerido_minutos: 10,
    por_que_esta_pregunta: 'Test reason',
    basada_en: 'Test based on',
    guia: {
      objetivo_de_la_pregunta: 'Test objective',
      como_introducirla: 'Test intro',
      preguntas_de_seguimiento: [],
      dinamica_sugerida: {
        formato: 'Test format',
        descripcion: 'Test desc',
        pasos: [],
      },
      que_buscar_en_respuestas: [],
      red_flags: [],
      como_cerrar: 'Test close',
      accion_resultante: 'Test action',
    },
    relacionada_con_miembros: [],
  },
];

describe('MeetingQuestionViewer', () => {
  it('renders preguntas para la junta title', () => {
    render(<MeetingQuestionViewer questions={mockQuestions} roleLabel="Comercial" />);
    expect(screen.getByText(/Preguntas para la Junta/)).toBeInTheDocument();
  });

  it('renders question text', () => {
    render(<MeetingQuestionViewer questions={mockQuestions} roleLabel="Comercial" />);
    expect(screen.getByText('Test question')).toBeInTheDocument();
  });

  it('renders agenda sugerida section when provided', () => {
    const agenda = { apertura: 'Open', desarrollo: 'Dev', cierre: 'Close' };
    render(<MeetingQuestionViewer questions={mockQuestions} roleLabel="Comercial" agendaSugerida={agenda} />);
    expect(screen.getByText('Agenda Sugerida')).toBeInTheDocument();
  });
});
