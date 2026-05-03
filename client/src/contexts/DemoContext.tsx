import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface DemoState {
  isDemoMode: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoState | undefined>(undefined);

export const useDemo = (): DemoState => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const enterDemo = useCallback(() => setIsDemoMode(true), []);
  const exitDemo = useCallback(() => setIsDemoMode(false), []);

  return (
    <DemoContext.Provider value={{ isDemoMode, enterDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
};
