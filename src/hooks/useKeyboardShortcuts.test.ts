import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockHandlers = {
    onSearch: vi.fn(),
    onNewOBV: vi.fn(),
    onEscape: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sets up keyboard event listeners', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockHandlers));
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('accepts optional handlers', () => {
    expect(() => {
      renderHook(() => useKeyboardShortcuts({}));
    }).not.toThrow();
  });

  it('handles missing onSearch handler', () => {
    expect(() => {
      renderHook(() => useKeyboardShortcuts({ onNewOBV: vi.fn() }));
    }).not.toThrow();
  });

  it('handles missing onNewOBV handler', () => {
    expect(() => {
      renderHook(() => useKeyboardShortcuts({ onSearch: vi.fn() }));
    }).not.toThrow();
  });

  it('handles missing onEscape handler', () => {
    expect(() => {
      renderHook(() => useKeyboardShortcuts({ onSearch: vi.fn() }));
    }).not.toThrow();
  });
});
