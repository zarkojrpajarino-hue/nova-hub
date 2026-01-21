import { createContext, useContext, ReactNode } from 'react';

interface NavigationContextType {
  navigate: (view: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ 
  children, 
  onNavigate 
}: { 
  children: ReactNode; 
  onNavigate: (view: string) => void;
}) {
  return (
    <NavigationContext.Provider value={{ navigate: onNavigate }}>
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
