import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSuggestions } from '../useSuggestions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

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
