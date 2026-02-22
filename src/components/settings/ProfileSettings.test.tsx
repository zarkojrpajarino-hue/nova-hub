import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileSettings } from './ProfileSettings';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ 
    profile: { id: 'user1', nombre: 'Test User', color: '#6366F1', avatar: null },
    user: { email: 'test@example.com' },
  })),
}));

vi.mock('@/hooks/useSettings', () => ({
  useUpdateProfile: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useUploadAvatar: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProfileSettings', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProfileSettings />
      </QueryClientProvider>
    );
  };

  it('renders personal information title', () => {
    renderComponent();
    expect(screen.getByText('👤 Información Personal')).toBeInTheDocument();
  });

  it('renders color identificativo title', () => {
    renderComponent();
    expect(screen.getByText('🎨 Color Identificativo')).toBeInTheDocument();
  });

  it('renders nombre input', () => {
    renderComponent();
    // Label has no htmlFor, use placeholder to find the input
    expect(screen.getByPlaceholderText('Tu nombre')).toBeInTheDocument();
  });

  it('renders email input (disabled)', () => {
    renderComponent();
    // Label has no htmlFor, find by display value (the mocked email)
    const emailInput = screen.getByDisplayValue('test@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('shows email cannot be changed message', () => {
    renderComponent();
    expect(screen.getByText('El email no se puede cambiar')).toBeInTheDocument();
  });

  it('renders color selector', () => {
    const { container } = renderComponent();
    const colorButtons = container.querySelectorAll('button[style*="background"]');
    expect(colorButtons.length).toBeGreaterThan(10);
  });

  it('renders save button', () => {
    renderComponent();
    expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
  });

  it('renders Camera icon', () => {
    const { container } = renderComponent();
    const icon = container.querySelector('.lucide-camera');
    expect(icon).toBeInTheDocument();
  });

  it('shows color description text', () => {
    renderComponent();
    expect(screen.getByText(/Este color te identifica en rankings/)).toBeInTheDocument();
  });
});
