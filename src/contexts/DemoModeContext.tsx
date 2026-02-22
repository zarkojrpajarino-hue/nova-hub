import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  enableDemo: () => void;
  disableDemo: () => void;
  toggleDemo: () => void;
  demoSection: string | null;
  setDemoSection: (section: string | null) => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoSection, setDemoSection] = useState<string | null>(null);

  const enableDemo = useCallback(() => {
    setIsDemoMode(true);
  }, []);

  const disableDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoSection(null);
  }, []);

  const toggleDemo = useCallback(() => {
    setIsDemoMode(prev => !prev);
  }, []);

  return (
    <DemoModeContext.Provider value={{
      isDemoMode,
      enableDemo,
      disableDemo,
      toggleDemo,
      demoSection,
      setDemoSection,
    }}>
      {children}
    </DemoModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
