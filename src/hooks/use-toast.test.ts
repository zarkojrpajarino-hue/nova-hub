import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useToast, toast } from './use-toast';

// Mock setTimeout/clearTimeout
vi.useFakeTimers();

describe('useToast', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toasts.forEach((t) => {
        result.current.dismiss(t.id);
      });
    });
    vi.clearAllTimers();
  });

  describe('useToast hook', () => {
    it('returns initial empty toasts array', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toEqual([]);
    });

    it('provides toast function', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toast).toBeDefined();
      expect(typeof result.current.toast).toBe('function');
    });

    it('provides dismiss function', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.dismiss).toBeDefined();
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('adds toast to toasts array', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'This is a test',
        });
      });

      waitFor(() => {
        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].title).toBe('Test Toast');
        expect(result.current.toasts[0].description).toBe('This is a test');
      });
    });

    it('limits toasts to TOAST_LIMIT (1)', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
        result.current.toast({ title: 'Toast 3' });
      });

      waitFor(() => {
        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].title).toBe('Toast 3');
      });
    });

    it('dismisses specific toast by id', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const t = result.current.toast({ title: 'Test Toast' });
        toastId = t.id;
      });

      act(() => {
        result.current.dismiss(toastId!);
      });

      waitFor(() => {
        expect(result.current.toasts[0]?.open).toBe(false);
      });
    });

    it('sets toast as open by default', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });

      waitFor(() => {
        expect(result.current.toasts[0].open).toBe(true);
      });
    });
  });

  describe('toast function', () => {
    it('returns toast object with id', () => {
      const result = toast({ title: 'Test' });
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });

    it('returns toast object with dismiss function', () => {
      const result = toast({ title: 'Test' });
      expect(result.dismiss).toBeDefined();
      expect(typeof result.dismiss).toBe('function');
    });

    it('returns toast object with update function', () => {
      const result = toast({ title: 'Test' });
      expect(result.update).toBeDefined();
      expect(typeof result.update).toBe('function');
    });

    it('generates unique ids for each toast', () => {
      const toast1 = toast({ title: 'Toast 1' });
      const toast2 = toast({ title: 'Toast 2' });
      expect(toast1.id).not.toBe(toast2.id);
    });

    it('allows dismissing toast via returned dismiss function', () => {
      const { result } = renderHook(() => useToast());

      let toastObj: ReturnType<typeof toast>;
      act(() => {
        toastObj = toast({ title: 'Test Toast' });
      });

      act(() => {
        toastObj!.dismiss();
      });

      waitFor(() => {
        expect(result.current.toasts[0]?.open).toBe(false);
      });
    });

    it('allows updating toast via returned update function', () => {
      const { result } = renderHook(() => useToast());

      let toastObj: ReturnType<typeof toast>;
      act(() => {
        toastObj = toast({ title: 'Original Title' });
      });

      act(() => {
        toastObj!.update({ title: 'Updated Title' });
      });

      waitFor(() => {
        expect(result.current.toasts[0]?.title).toBe('Updated Title');
      });
    });

    it('creates toast with custom variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: 'Error', variant: 'destructive' });
      });

      waitFor(() => {
        expect(result.current.toasts[0].variant).toBe('destructive');
      });
    });

    it('creates toast with action element', () => {
      const { result } = renderHook(() => useToast());
      const action = { altText: 'Undo' };

      act(() => {
        toast({ title: 'Toast with action', action: action as any });
      });

      waitFor(() => {
        expect(result.current.toasts[0].action).toBeDefined();
      });
    });
  });

  describe('toast updates', () => {
    it('updates toast title', () => {
      const { result } = renderHook(() => useToast());

      let toastObj: ReturnType<typeof toast>;
      act(() => {
        toastObj = toast({ title: 'Original' });
      });

      act(() => {
        toastObj!.update({ title: 'Updated' });
      });

      waitFor(() => {
        expect(result.current.toasts[0]?.title).toBe('Updated');
      });
    });

    it('updates toast description', () => {
      const { result } = renderHook(() => useToast());

      let toastObj: ReturnType<typeof toast>;
      act(() => {
        toastObj = toast({ description: 'Original description' });
      });

      act(() => {
        toastObj!.update({ description: 'Updated description' });
      });

      waitFor(() => {
        expect(result.current.toasts[0]?.description).toBe('Updated description');
      });
    });

    it('updates toast variant', () => {
      const { result } = renderHook(() => useToast());

      let toastObj: ReturnType<typeof toast>;
      act(() => {
        toastObj = toast({ variant: 'default' });
      });

      act(() => {
        toastObj!.update({ variant: 'destructive' });
      });

      waitFor(() => {
        expect(result.current.toasts[0]?.variant).toBe('destructive');
      });
    });

    it('preserves other properties when updating', () => {
      const { result } = renderHook(() => useToast());

      let toastObj: ReturnType<typeof toast>;
      act(() => {
        toastObj = toast({ title: 'Title', description: 'Description' });
      });

      act(() => {
        toastObj!.update({ title: 'New Title' });
      });

      waitFor(() => {
        expect(result.current.toasts[0]?.title).toBe('New Title');
        expect(result.current.toasts[0]?.description).toBe('Description');
      });
    });
  });

  describe('toast removal', () => {
    it('removes toast after dismiss', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const t = result.current.toast({ title: 'Test' });
        toastId = t.id;
      });

      act(() => {
        result.current.dismiss(toastId!);
      });

      // Fast-forward timers to trigger removal
      act(() => {
        vi.runAllTimers();
      });

      waitFor(() => {
        const remainingToast = result.current.toasts.find((t) => t.id === toastId!);
        expect(remainingToast).toBeUndefined();
      });
    });

    it('dismisses all toasts when no id provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
      });

      act(() => {
        result.current.dismiss();
      });

      waitFor(() => {
        expect(result.current.toasts[0]?.open).toBe(false);
      });
    });
  });

  describe('multiple hook instances', () => {
    it('syncs state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.toast({ title: 'Synced Toast' });
      });

      waitFor(() => {
        expect(result1.current.toasts).toHaveLength(1);
        expect(result2.current.toasts).toHaveLength(1);
        expect(result2.current.toasts[0]?.title).toBe('Synced Toast');
      });
    });

    it('syncs dismiss across instances', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const t = result1.current.toast({ title: 'Test' });
        toastId = t.id;
      });

      act(() => {
        result2.current.dismiss(toastId!);
      });

      waitFor(() => {
        expect(result1.current.toasts[0]?.open).toBe(false);
        expect(result2.current.toasts[0]?.open).toBe(false);
      });
    });
  });
});
