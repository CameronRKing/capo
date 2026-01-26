'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface ModelContextConfig {
  live?: boolean;           // Auto-sync changes to database
  syncOnInvalid?: boolean;  // Sync even if validation fails
}

interface ModelContextValue {
  model: any;  // RxDB document - typed as 'any' for now to keep it generic
  config: ModelContextConfig;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export interface ModelContextProviderProps {
  children: ReactNode;
  model: any;  // RxDB document
  config?: ModelContextConfig;
}

export function ModelContextProvider({
  children,
  model,
  config = {},
}: ModelContextProviderProps) {
  const value: ModelContextValue = {
    model,
    config: {
      live: config.live ?? true,
      syncOnInvalid: config.syncOnInvalid ?? false,
    },
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModelContext(): ModelContextValue {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModelContext must be used within a ModelContextProvider');
  }
  return context;
}
