import type { ReactNode } from 'react';

import {
  CurationFormErrorFocusContext,
  type CurationFormErrorFocusRegistry,
} from '../form-error-focus';

interface CurationFormErrorFocusProviderProps {
  children: ReactNode;
  registry: CurationFormErrorFocusRegistry;
}

export function CurationFormErrorFocusProvider({
  children,
  registry,
}: CurationFormErrorFocusProviderProps) {
  return (
    <CurationFormErrorFocusContext.Provider value={registry}>
      {children}
    </CurationFormErrorFocusContext.Provider>
  );
}
