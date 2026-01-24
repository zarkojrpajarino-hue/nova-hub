import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockOnSearch = vi.fn();
  const mockOnNewOBV = vi.fn();
  const mockOnEscape = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls onSearch when Cmd+K is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSearch: mockOnSearch,
        onNewOBV: mockOnNewOBV,
        onEscape: mockOnEscape,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
    });
    document.dispatchEvent(event);

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onSearch when Ctrl+K is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSearch: mockOnSearch,
        onNewOBV: mockOnNewOBV,
        onEscape: mockOnEscape,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onNewOBV when N is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSearch: mockOnSearch,
        onNewOBV: mockOnNewOBV,
        onEscape: mockOnEscape,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'n',
    });
    document.dispatchEvent(event);

    expect(mockOnNewOBV).toHaveBeenCalledTimes(1);
  });

  it('calls onEscape when Escape is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSearch: mockOnSearch,
        onNewOBV: mockOnNewOBV,
        onEscape: mockOnEscape,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
    });
    document.dispatchEvent(event);

    expect(mockOnEscape).toHaveBeenCalledTimes(1);
  });

  it('does not trigger shortcuts when typing in input', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSearch: mockOnSearch,
        onNewOBV: mockOnNewOBV,
        onEscape: mockOnEscape,
      })
    );

    // Create an input element and set it as the event target
    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      bubbles: true,
    });

    Object.defineProperty(event, 'target', {
      writable: false,
      value: input,
    });

    document.dispatchEvent(event);

    expect(mockOnNewOBV).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('does not trigger shortcuts when typing in textarea', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSearch: mockOnSearch,
        onNewOBV: mockOnNewOBV,
        onEscape: mockOnEscape,
      })
    );

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      bubbles: true,
    });

    Object.defineProperty(event, 'target', {
      writable: false,
      value: textarea,
    });

    document.dispatchEvent(event);

    expect(mockOnNewOBV).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('calls onEscape even when typing in input', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSearch: mockOnSearch,
        onNewOBV: mockOnNewOBV,
        onEscape: mockOnEscape,
      })
    );

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    Object.defineProperty(event, 'target', {
      writable: false,
      value: input,
    });

    document.dispatchEvent(event);

    expect(mockOnEscape).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });

  it('does not call onNewOBV when N is pressed with modifier keys', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSearch: mockOnSearch,
        onNewOBV: mockOnNewOBV,
        onEscape: mockOnEscape,
      })
    );

    // Test with Cmd+N
    const event1 = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
    });
    document.dispatchEvent(event1);

    // Test with Ctrl+N
    const event2 = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
    });
    document.dispatchEvent(event2);

    // Test with Alt+N
    const event3 = new KeyboardEvent('keydown', {
      key: 'n',
      altKey: true,
    });
    document.dispatchEvent(event3);

    expect(mockOnNewOBV).not.toHaveBeenCalled();
  });

  it('handles missing handlers gracefully', () => {
    renderHook(() => useKeyboardShortcuts({}));

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
    });

    // Should not throw
    expect(() => document.dispatchEvent(event)).not.toThrow();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({
        onSearch: mockOnSearch,
      })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
