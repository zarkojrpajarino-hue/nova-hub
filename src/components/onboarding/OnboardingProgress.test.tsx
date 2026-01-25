import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingProgress } from './OnboardingProgress';
import { Users, Target, Lightbulb } from 'lucide-react';

const mockSteps = [
  { id: 'step1', title: 'Equipo', icon: Users },
  { id: 'step2', title: 'Objetivos', icon: Target },
  { id: 'step3', title: 'Ideas', icon: Lightbulb },
];

describe('OnboardingProgress', () => {
  it('renders all steps', () => {
    render(
      <OnboardingProgress
        steps={mockSteps}
        currentStep={0}
      />
    );
    expect(screen.getByText('Equipo')).toBeInTheDocument();
    expect(screen.getByText('Objetivos')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
  });

  it('highlights current step', () => {
    const { container } = render(
      <OnboardingProgress
        steps={mockSteps}
        currentStep={1}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[1]).toHaveClass('bg-primary/10');
  });

  it('marks completed steps with check icon', () => {
    const { container } = render(
      <OnboardingProgress
        steps={mockSteps}
        currentStep={2}
      />
    );
    const checkIcons = container.querySelectorAll('.lucide-check');
    expect(checkIcons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders chevron separators between steps', () => {
    const { container } = render(
      <OnboardingProgress
        steps={mockSteps}
        currentStep={0}
      />
    );
    const chevrons = container.querySelectorAll('.lucide-chevron-right');
    expect(chevrons).toHaveLength(2);
  });

  it('calls onStepClick when step is clicked', async () => {
    const user = userEvent.setup();
    const mockOnStepClick = vi.fn();
    render(
      <OnboardingProgress
        steps={mockSteps}
        currentStep={1}
        onStepClick={mockOnStepClick}
      />
    );

    const equipoButton = screen.getByText('Equipo');
    await user.click(equipoButton);

    expect(mockOnStepClick).toHaveBeenCalledWith(0);
  });

  it('disables future steps', () => {
    const { container } = render(
      <OnboardingProgress
        steps={mockSteps}
        currentStep={0}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[1]).toBeDisabled();
    expect(buttons[2]).toBeDisabled();
  });

  it('shows completed styling for finished steps', () => {
    const { container } = render(
      <OnboardingProgress
        steps={mockSteps}
        currentStep={2}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveClass('bg-green-500/10');
    expect(buttons[1]).toHaveClass('bg-green-500/10');
  });

  it('applies opacity to incomplete steps', () => {
    const { container } = render(
      <OnboardingProgress
        steps={mockSteps}
        currentStep={0}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[2]).toHaveClass('opacity-50');
  });
});
