import { useState, useCallback } from 'react';

interface NavigationHistoryItem {
  view: string;
  data?: Record<string, unknown>;
}

export function useNavigationHistory() {
  const [history, setHistory] = useState<NavigationHistoryItem[]>([{ view: 'dashboard' }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const navigateTo = useCallback((view: string, data?: Record<string, unknown>) => {
    setHistory(prev => {
      // Si estamos en medio del historial, eliminar todo lo que viene después
      const newHistory = prev.slice(0, currentIndex + 1);
      // Agregar nueva vista
      return [...newHistory, { view, data }];
    });
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const canGoBack = currentIndex > 0;
  const currentView = history[currentIndex];

  return {
    navigateTo,
    goBack,
    canGoBack,
    currentView,
    history,
  };
}
