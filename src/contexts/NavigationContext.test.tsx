import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationProvider, useNavigation } from './NavigationContext';

function TestComponent() {
  const { navigate } = useNavigation();
  
  return (
    <button onClick={() => navigate('test-view')}>Navigate</button>
  );
}

describe('NavigationContext', () => {
  it('calls onNavigate when navigate is called', () => {
    const mockNavigate = vi.fn();
    render(
      <NavigationProvider onNavigate={mockNavigate}>
        <TestComponent />
      </NavigationProvider>
    );
    
    fireEvent.click(screen.getByText('Navigate'));
    expect(mockNavigate).toHaveBeenCalledWith('test-view');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNavigation must be used within NavigationProvider');
    
    spy.mockRestore();
  });
});
