import { createContext, useContext, ReactNode } from 'react';

interface NavigationContextType {
  navigate: (view: string) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({
  children,
  onNavigate,
  onGoBack,
  canGoBack = false
}: {
  children: ReactNode;
  onNavigate: (view: string) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}) {
  return (
    <NavigationContext.Provider value={{
      navigate: onNavigate,
      goBack: onGoBack || (() => {}),
      canGoBack
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
