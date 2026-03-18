/**
 * useAuth — re-export desde AuthContext.
 *
 * El estado de auth ahora vive en AuthContext (un único Provider,
 * una única suscripción a onAuthStateChange, un único debounce).
 * Este re-export mantiene la compatibilidad con todos los componentes
 * que importan desde '@/hooks/useAuth'.
 */
export { useAuth } from '@/contexts/AuthContext';
