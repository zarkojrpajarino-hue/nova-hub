import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityCard } from './ActivityCard';
import { Activity } from '@/data/mockData';

const mockActivities: Activity[] = [
  {
    id: '1',
    user: 'Juan Pérez',
    action: 'completó',
    target: 'Tarea de Marketing',
    time: 'hace 2 minutos',
  },
  {
    id: '2',
    user: 'María González',
    action: 'agregó',
    target: 'Cliente importante',
    amount: '+$5,000',
    time: 'hace 15 minutos',
  },
  {
    id: '3',
    user: 'Carlos López',
    action: 'actualizó',
    target: 'Proyecto Alpha',
    time: 'hace 1 hora',
  },
];

describe('ActivityCard', () => {
  it('renders activity card', () => {
    render(<ActivityCard activities={mockActivities} />);
    expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
  });

  it('renders header with icon', () => {
    const { container } = render(<ActivityCard activities={mockActivities} />);
    expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders all activities', () => {
    render(<ActivityCard activities={mockActivities} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María González')).toBeInTheDocument();
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('renders activity actions', () => {
    render(<ActivityCard activities={mockActivities} />);
    expect(screen.getByText(/completó/)).toBeInTheDocument();
    expect(screen.getByText(/agregó/)).toBeInTheDocument();
    expect(screen.getByText(/actualizó/)).toBeInTheDocument();
  });

  it('renders activity targets', () => {
    render(<ActivityCard activities={mockActivities} />);
    expect(screen.getByText('Tarea de Marketing')).toBeInTheDocument();
    expect(screen.getByText('Cliente importante')).toBeInTheDocument();
    expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
  });

  it('renders activity timestamps', () => {
    render(<ActivityCard activities={mockActivities} />);
    expect(screen.getByText('hace 2 minutos')).toBeInTheDocument();
    expect(screen.getByText('hace 15 minutos')).toBeInTheDocument();
    expect(screen.getByText('hace 1 hora')).toBeInTheDocument();
  });

  it('renders activity with amount', () => {
    render(<ActivityCard activities={mockActivities} />);
    expect(screen.getByText('+$5,000')).toBeInTheDocument();
  });

  it('renders activity without amount', () => {
    render(<ActivityCard activities={mockActivities} />);
    // First and third activities don't have amounts
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('renders colored dots for each activity', () => {
    const { container } = render(<ActivityCard activities={mockActivities} />);
    const dots = container.querySelectorAll('.w-2.h-2.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('applies different colors to dots', () => {
    const { container } = render(<ActivityCard activities={mockActivities} />);
    const dots = container.querySelectorAll('.w-2.h-2.rounded-full');

    // Each dot should have a background style
    dots.forEach((dot) => {
      const background = (dot as HTMLElement).style.background;
      expect(background).toBeTruthy();
    });
  });

  it('renders empty list when no activities', () => {
    const { container } = render(<ActivityCard activities={[]} />);
    expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
    const list = container.querySelector('ul');
    expect(list?.children).toHaveLength(0);
  });

  it('renders single activity', () => {
    const singleActivity: Activity[] = [
      {
        id: '1',
        user: 'Test User',
        action: 'tested',
        target: 'Component',
        time: 'now',
      },
    ];

    render(<ActivityCard activities={singleActivity} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/tested/)).toBeInTheDocument();
    expect(screen.getByText('Component')).toBeInTheDocument();
  });

  it('applies custom delay prop', () => {
    const { container } = render(<ActivityCard activities={mockActivities} delay={8} />);
    expect(container.querySelector('.delay-8')).toBeInTheDocument();
  });

  it('uses default delay when not provided', () => {
    const { container } = render(<ActivityCard activities={mockActivities} />);
    expect(container.querySelector('.delay-4')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<ActivityCard activities={mockActivities} />);
    const section = screen.getByLabelText('Actividad reciente del equipo');
    expect(section).toBeInTheDocument();
  });

  it('has feed role on activity list', () => {
    const { container } = render(<ActivityCard activities={mockActivities} />);
    const feed = container.querySelector('[role="feed"]');
    expect(feed).toBeInTheDocument();
  });

  it('has article role on each activity', () => {
    const { container } = render(<ActivityCard activities={mockActivities} />);
    const articles = container.querySelectorAll('[role="article"]');
    expect(articles).toHaveLength(3);
  });

  it('renders time elements with dateTime attribute', () => {
    const { container } = render(<ActivityCard activities={mockActivities} />);
    const timeElements = container.querySelectorAll('time');
    expect(timeElements).toHaveLength(3);
    timeElements.forEach((time, index) => {
      expect(time).toHaveAttribute('dateTime', mockActivities[index].time);
    });
  });

  it('applies hover effect to activity items', () => {
    const { container } = render(<ActivityCard activities={mockActivities} />);
    const items = container.querySelectorAll('li');
    items.forEach((item) => {
      expect(item).toHaveClass('hover:bg-muted/50');
    });
  });

  it('renders activities with correct structure', () => {
    const { container } = render(<ActivityCard activities={mockActivities} />);
    const activityItems = container.querySelectorAll('li');

    activityItems.forEach((item) => {
      // Should have dot, content, and time
      expect(item.querySelector('.w-2.h-2.rounded-full')).toBeInTheDocument();
      expect(item.querySelector('.flex-1')).toBeInTheDocument();
      expect(item.querySelector('time')).toBeInTheDocument();
    });
  });
});
