import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let addEventListenerSpy: ReturnType<typeof vi.fn>;
  let removeEventListenerSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addEventListenerSpy = vi.fn();
    removeEventListenerSpy = vi.fn();
    matchMediaMock = vi.fn();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when window width is above mobile breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true when window width is below mobile breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns true at exactly 767px (mobile breakpoint - 1)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    });

    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false at exactly 768px (mobile breakpoint)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('adds event listener on mount', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    });

    renderHook(() => useIsMobile());
    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes event listener on unmount', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    });

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('updates when media query changes', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    let changeHandler: (() => void) | null = null;

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: (event: string, handler: () => void) => {
        changeHandler = handler;
      },
      removeEventListener: removeEventListenerSpy,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      if (changeHandler) {
        changeHandler();
      }
    });

    expect(result.current).toBe(true);
  });

  it('queries correct breakpoint (max-width: 767px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    });

    renderHook(() => useIsMobile());
    expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('handles multiple resize events', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    let changeHandler: (() => void) | null = null;

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: (event: string, handler: () => void) => {
        changeHandler = handler;
      },
      removeEventListener: removeEventListenerSpy,
    });

    const { result } = renderHook(() => useIsMobile());

    // Resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
      if (changeHandler) changeHandler();
    });
    expect(result.current).toBe(true);

    // Resize to desktop
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
      if (changeHandler) changeHandler();
    });
    expect(result.current).toBe(false);

    // Resize to mobile again
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });
      if (changeHandler) changeHandler();
    });
    expect(result.current).toBe(true);
  });
});
