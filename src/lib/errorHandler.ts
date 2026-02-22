/**
 * ✨ OPTIMIZED: Error Handling System
 *
 * Sistema centralizado de manejo de errores con tipos específicos
 * y mensajes claros para usuarios.
 *
 * ANTES: Errores genéricos, mensajes poco claros, retry sin lógica
 * DESPUÉS: Errores tipados, mensajes claros, retry inteligente
 */

/**
 * Clase base para errores de la aplicación
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Método para obtener mensaje amigable para el usuario
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * Determinar si es un error recuperable (se puede reintentar)
   */
  isRetryable(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }
}

/**
 * Error de validación (datos inválidos del usuario)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }

  getUserMessage(): string {
    return `Error de validación: ${this.message}`;
  }

  isRetryable(): boolean {
    return false; // Errores de validación no son recuperables con retry
  }
}

/**
 * Error de autorización (usuario no tiene permisos)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'No tienes permisos para realizar esta acción') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }

  getUserMessage(): string {
    return this.message;
  }

  isRetryable(): boolean {
    return false;
  }
}

/**
 * Error de autenticación (sesión expirada, no autenticado)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Sesión expirada. Por favor, inicia sesión nuevamente.') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }

  getUserMessage(): string {
    return this.message;
  }

  isRetryable(): boolean {
    return false;
  }
}

/**
 * Error de recurso no encontrado
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }

  getUserMessage(): string {
    return this.message;
  }

  isRetryable(): boolean {
    return false;
  }
}

/**
 * Error de conflicto (ej: duplicado)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Ya existe un registro con esos datos') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }

  getUserMessage(): string {
    return this.message;
  }

  isRetryable(): boolean {
    return false;
  }
}

/**
 * Error de red
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Error de conexión. Verifica tu internet.') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }

  getUserMessage(): string {
    return this.message;
  }

  isRetryable(): boolean {
    return true;
  }
}

/**
 * Error de servidor
 */
export class ServerError extends AppError {
  constructor(message: string = 'Error del servidor. Intenta nuevamente.') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }

  getUserMessage(): string {
    return this.message;
  }

  isRetryable(): boolean {
    return true;
  }
}

/**
 * Mapeo de códigos de error de Supabase a AppErrors
 */
const SUPABASE_ERROR_MAP: Record<string, (error: any) => AppError> = {
  // Autenticación
  'PGRST301': () => new AuthenticationError(),
  'invalid_grant': () => new AuthenticationError('Credenciales inválidas'),

  // Autorización
  '42501': () => new AuthorizationError(),

  // Not Found
  'PGRST116': () => new NotFoundError(),

  // Duplicados
  '23505': (error) => new ConflictError(
    error.message?.includes('email')
      ? 'Este email ya está registrado'
      : 'Ya existe un registro con esos datos'
  ),

  // Violación de constraint
  '23503': () => new ValidationError('Referencia inválida. El recurso relacionado no existe.'),
  '23502': () => new ValidationError('Campo requerido faltante'),
  '23514': () => new ValidationError('Datos inválidos. No cumplen con las restricciones.'),

  // Conexión
  'ECONNREFUSED': () => new NetworkError(),
  'ETIMEDOUT': () => new NetworkError('Tiempo de espera agotado'),
  'ENOTFOUND': () => new NetworkError('No se pudo conectar al servidor'),

  // Servidor
  'PGRST500': () => new ServerError(),
  '500': () => new ServerError(),
};

/**
 * Convertir error de Supabase a AppError
 */
export function handleSupabaseError(error: any): AppError {
  // Si ya es un AppError, devolverlo directamente
  if (error instanceof AppError) {
    return error;
  }

  // Buscar mapeo por código
  const code = error.code || error.status?.toString();
  const mapper = SUPABASE_ERROR_MAP[code];

  if (mapper) {
    return mapper(error);
  }

  // Error genérico si no hay mapeo específico
  return new ServerError(
    error.message || 'Ocurrió un error inesperado'
  );
}

/**
 * Helper para determinar si se debe reintentar una operación
 */
export function shouldRetry(error: any, attemptNumber: number, maxAttempts: number = 3): boolean {
  if (attemptNumber >= maxAttempts) return false;

  const appError = error instanceof AppError ? error : handleSupabaseError(error);
  return appError.isRetryable();
}

/**
 * Helper para calcular delay exponencial de retry
 */
export function getRetryDelay(attemptNumber: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 8000);
}

/**
 * Ejemplo de uso en queries:
 *
 * ```tsx
 * import { handleSupabaseError, shouldRetry, getRetryDelay } from '@/lib/errorHandler';
 *
 * export function useProjects() {
 *   return useQuery({
 *     queryKey: ['projects'],
 *     queryFn: async () => {
 *       const { data, error } = await supabase
 *         .from('projects')
 *         .select('*');
 *
 *       if (error) throw handleSupabaseError(error);
 *       return data;
 *     },
 *     retry: (failureCount, error) => shouldRetry(error, failureCount),
 *     retryDelay: getRetryDelay,
 *   });
 * }
 * ```
 *
 * Ejemplo de uso en mutations:
 *
 * ```tsx
 * const createProjectMutation = useMutation({
 *   mutationFn: async (data) => {
 *     const { data: project, error } = await supabase
 *       .from('projects')
 *       .insert(data)
 *       .select()
 *       .single();
 *
 *     if (error) throw handleSupabaseError(error);
 *     return project;
 *   },
 *   onError: (error) => {
 *     const appError = error instanceof AppError ? error : handleSupabaseError(error);
 *     toast.error(appError.getUserMessage());
 *   },
 * });
 * ```
 *
 * Ejemplo de uso en try-catch:
 *
 * ```tsx
 * try {
 *   await supabase.from('leads').insert(leadData);
 * } catch (error) {
 *   const appError = handleSupabaseError(error);
 *   console.error('Error details:', appError.details);
 *   toast.error(appError.getUserMessage());
 *
 *   // Manejo específico por tipo
 *   if (appError instanceof ValidationError) {
 *     // Mostrar errores de validación en el formulario
 *     setFormErrors(appError.details);
 *   } else if (appError instanceof AuthenticationError) {
 *     // Redirigir a login
 *     navigate('/auth');
 *   }
 * }
 * ```
 */

/**
 * Logs de error para debugging
 */
export function logError(error: any, context?: string) {
  const appError = error instanceof AppError ? error : handleSupabaseError(error);

  console.group(`❌ Error${context ? ` in ${context}` : ''}`);
  console.error('Message:', appError.message);
  console.error('Code:', appError.code);
  console.error('Status:', appError.statusCode);
  if (appError.details) {
    console.error('Details:', appError.details);
  }
  console.error('Stack:', appError.stack);
  console.groupEnd();

  // En producción, enviar a servicio de logging (Sentry, etc.)
  if (import.meta.env.PROD) {
    // Implementar envío a Sentry/similar
  }
}
