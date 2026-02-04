import { type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { renderHook, type RenderHookOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { ToastContext, useToastState } from '@/hooks/useToast';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function ToastProvider({ children }: { children: ReactNode }) {
  const toastState = useToastState();
  return (
    <ToastContext.Provider value={toastState}>
      {children}
    </ToastContext.Provider>
  );
}

function AllProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ToastProvider>{children}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

function customRenderHook<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'>
) {
  return renderHook(hook, { wrapper: AllProviders, ...options });
}

export { customRender as render, customRenderHook as renderHook };
