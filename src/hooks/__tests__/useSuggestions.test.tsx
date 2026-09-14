import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSuggestions } from '../useSuggestions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock do Supabase: query builder encadeável que resolve como uma lista vazia
vi.mock('@/integrations/supabase/client', () => {
  const builder: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (v: unknown) => unknown) => resolve({ data: [], error: null });
        }
        return vi.fn(() => builder);
      },
    }
  );

  const channel: any = {
    on: vi.fn(() => channel),
    subscribe: vi.fn(() => channel),
    unsubscribe: vi.fn(),
  };

  return {
    supabase: {
      from: vi.fn(() => builder),
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
      functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
    },
  };
});

// Mock do AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

describe('useSuggestions', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }
    
    return Wrapper;
  };

  it('deve iniciar com loading true', () => {
    const { result } = renderHook(() => useSuggestions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
  });

  it('deve ter funções de approve e reject definidas', () => {
    const { result } = renderHook(() => useSuggestions(), {
      wrapper: createWrapper(),
    });

    // Verifica se as funções estão definidas
    expect(result.current.approveSuggestion).toBeDefined();
    expect(result.current.rejectSuggestion).toBeDefined();
    expect(typeof result.current.approveSuggestion).toBe('function');
    expect(typeof result.current.rejectSuggestion).toBe('function');
  });
});
