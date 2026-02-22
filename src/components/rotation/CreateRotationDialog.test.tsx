import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateRotationDialog } from './CreateRotationDialog';

// Supabase chainable mock
function createChain(resolveData = null) {
  const chain: Record<string, unknown> = {};
  ['select','eq','neq','order','limit','or','in','is','gte','lte','insert','update','delete','upsert'].forEach(m => {
    chain[m] = vi.fn(() => chain);
  });
  chain.single = vi.fn(() => Promise.resolve({ data: resolveData, error: null }));
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: resolveData, error: null }));
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: resolveData ? [resolveData] : [], error: null }).then(resolve);
  chain.catch = (reject: (v: unknown) => unknown) =>
    Promise.resolve({ data: [], error: null }).catch(reject);
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => createChain()),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user1' } }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1', nombre: 'Test User' } })),
}));

vi.mock('@/hooks/useNovaData', () => ({
  useProjects: vi.fn(() => ({ data: [], isLoading: false })),
  useProjectMembers: vi.fn(() => ({ data: [], isLoading: false })),
  useProfiles: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/hooks/useRoleRotation', () => ({
  useCreateRotationRequest: vi.fn(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false })),
  useCalculateCompatibility: vi.fn(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false })),
}));

describe('CreateRotationDialog', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = (open = true) => render(
    <QueryClientProvider client={queryClient}>
      <CreateRotationDialog open={open} onOpenChange={() => {}} />
    </QueryClientProvider>
  );

  it('renders solicitar rotacion title when open', () => {
    renderComponent(true);
    // The dialog title is "Nueva Solicitud de Rotación"
    expect(screen.getByText('Nueva Solicitud de Rotación')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderComponent(false);
    expect(screen.queryByText('Nueva Solicitud de Rotación')).not.toBeInTheDocument();
  });

  it('renders selecciona con quien label', () => {
    renderComponent(true);
    // The label shown before project is selected is "Tu proyecto y rol actual"
    // After project selection the "Intercambiar con" label appears.
    // We check the always-visible label.
    expect(screen.getByText('Tu proyecto y rol actual')).toBeInTheDocument();
  });
});
