import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingProgress } from './OnboardingProgress';

const mockSteps = [
  { id: 'step1', title: 'Paso 1', icon: '1', component: () => null },
  { id: 'step2', title: 'Paso 2', icon: '2', component: () => null },
  { id: 'step3', title: 'Paso 3', icon: '3', component: () => null },
];

describe('OnboardingProgress', () => {
  it('renders all step titles', () => {
    render(<OnboardingProgress steps={mockSteps} currentStep={0} />);
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
    expect(screen.getByText('Paso 2')).toBeInTheDocument();
    expect(screen.getByText('Paso 3')).toBeInTheDocument();
  });

  it('highlights current step', () => {
    const { container } = render(<OnboardingProgress steps={mockSteps} currentStep={1} />);
    const currentButton = container.querySelectorAll('button')[1];
    expect(currentButton.className).toContain('bg-primary/10');
  });

  it('shows completed steps with check icon', () => {
    const { container } = render(<OnboardingProgress steps={mockSteps} currentStep={2} />);
    const checkIcons = container.querySelectorAll('.lucide-check');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('renders ChevronRight between steps', () => {
    const { container } = render(<OnboardingProgress steps={mockSteps} currentStep={0} />);
    const chevrons = container.querySelectorAll('.lucide-chevron-right');
    expect(chevrons.length).toBe(2); // One less than total steps
  });

  it('calls onStepClick when step is clicked', async () => {
    const user = userEvent.setup();
    const mockOnStepClick = vi.fn();
    render(<OnboardingProgress steps={mockSteps} currentStep={1} onStepClick={mockOnStepClick} />);
    
    const firstButton = screen.getByText('Paso 1').closest('button');
    if (firstButton) {
      await user.click(firstButton);
      expect(mockOnStepClick).toHaveBeenCalledWith(0);
    }
  });

  it('disables future steps', () => {
    const { container } = render(<OnboardingProgress steps={mockSteps} currentStep={0} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons[1]).toBeDisabled();
    expect(buttons[2]).toBeDisabled();
  });

  it('enables past and current steps', () => {
    const { container } = render(<OnboardingProgress steps={mockSteps} currentStep={2} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).not.toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
    expect(buttons[2]).not.toBeDisabled();
  });
});
