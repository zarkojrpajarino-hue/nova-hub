import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoModeProvider, useDemoMode } from './DemoModeContext';

function TestComponent() {
  const { isDemoMode, enableDemo, disableDemo, toggleDemo, demoSection, setDemoSection } = useDemoMode();
  
  return (
    <div>
      <div data-testid="demo-status">{isDemoMode ? 'Demo On' : 'Demo Off'}</div>
      <div data-testid="demo-section">{demoSection || 'None'}</div>
      <button onClick={enableDemo}>Enable</button>
      <button onClick={disableDemo}>Disable</button>
      <button onClick={toggleDemo}>Toggle</button>
      <button onClick={() => setDemoSection('test')}>Set Section</button>
    </div>
  );
}

describe('DemoModeContext', () => {
  it('starts with demo disabled', () => {
    render(<DemoModeProvider><TestComponent /></DemoModeProvider>);
    expect(screen.getByTestId('demo-status')).toHaveTextContent('Demo Off');
  });

  it('enables demo mode', () => {
    render(<DemoModeProvider><TestComponent /></DemoModeProvider>);
    fireEvent.click(screen.getByText('Enable'));
    expect(screen.getByTestId('demo-status')).toHaveTextContent('Demo On');
  });

  it('disables demo mode', () => {
    render(<DemoModeProvider><TestComponent /></DemoModeProvider>);
    fireEvent.click(screen.getByText('Enable'));
    fireEvent.click(screen.getByText('Disable'));
    expect(screen.getByTestId('demo-status')).toHaveTextContent('Demo Off');
  });

  it('toggles demo mode', () => {
    render(<DemoModeProvider><TestComponent /></DemoModeProvider>);
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('demo-status')).toHaveTextContent('Demo On');
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('demo-status')).toHaveTextContent('Demo Off');
  });

  it('sets demo section', () => {
    render(<DemoModeProvider><TestComponent /></DemoModeProvider>);
    fireEvent.click(screen.getByText('Set Section'));
    expect(screen.getByTestId('demo-section')).toHaveTextContent('test');
  });

  it('clears demo section on disable', () => {
    render(<DemoModeProvider><TestComponent /></DemoModeProvider>);
    fireEvent.click(screen.getByText('Set Section'));
    fireEvent.click(screen.getByText('Disable'));
    expect(screen.getByTestId('demo-section')).toHaveTextContent('None');
  });
});
