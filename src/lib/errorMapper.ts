/**
 * Error mapping utility for user-friendly error messages
 * Maps database error codes and common error patterns to Spanish messages
 */

// PostgreSQL error codes mapping
const POSTGRES_ERROR_MAP: Record<string, string> = {
  // Constraint violations
  '23505': 'Ya existe un registro con estos datos',
  '23503': 'Referencia inválida - el registro relacionado no existe',
  '23502': 'Faltan datos requeridos',
  '23514': 'Los datos no cumplen las validaciones requeridas',
  
  // Permission errors
  '42501': 'No tienes permisos para esta acción',
  '42000': 'Error de sintaxis en la consulta',
  
  // Connection/timeout
  '08000': 'Error de conexión con el servidor',
  '08003': 'Conexión no disponible',
  '57014': 'La operación tardó demasiado tiempo',
  
  // Data errors
  '22001': 'El texto es demasiado largo',
  '22003': 'El número está fuera del rango permitido',
  '22007': 'Formato de fecha inválido',
  '22P02': 'Formato de datos inválido',
};

// PostgREST error codes mapping
const POSTGREST_ERROR_MAP: Record<string, string> = {
  'PGRST116': 'No se encontró el registro',
  'PGRST204': 'No se pudo completar la operación',
  'PGRST301': 'Error de autenticación',
  'PGRST302': 'Error de autorización',
};

// Common error message patterns
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /Invalid login credentials/i, message: 'Email o contraseña incorrectos' },
  { pattern: /Email not confirmed/i, message: 'Por favor, confirma tu email antes de iniciar sesión' },
  { pattern: /User already registered/i, message: 'Este email ya está registrado' },
  { pattern: /Password.*weak/i, message: 'La contraseña es demasiado débil' },
  { pattern: /JWT expired/i, message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo' },
  { pattern: /row-level security/i, message: 'No tienes permisos para acceder a estos datos' },
  { pattern: /violates.*policy/i, message: 'Esta acción no está permitida' },
  { pattern: /network|fetch|connection/i, message: 'Error de conexión. Comprueba tu conexión a internet' },
  { pattern: /timeout/i, message: 'La operación tardó demasiado tiempo. Inténtalo de nuevo' },
  { pattern: /rate limit/i, message: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo' },
];

// Context-specific error messages
export const CONTEXT_ERRORS = {
  // General CRUD operations
  create: 'No se pudo crear el registro',
  read: 'No se pudo cargar los datos',
  update: 'No se pudo actualizar el registro',
  delete: 'No se pudo eliminar el registro',
  
  // Specific operations
  login: 'Error al iniciar sesión',
  signup: 'Error al crear la cuenta',
  logout: 'Error al cerrar sesión',
  
  // Validation operations
  validate: 'Error al validar',
  approve: 'Error al aprobar',
  reject: 'Error al rechazar',
  
  // Data operations
  save: 'Error al guardar',
  load: 'Error al cargar',
  upload: 'Error al subir el archivo',
  download: 'Error al descargar',
  
  // Team operations
  invite: 'Error al enviar la invitación',
  join: 'Error al unirse',
  leave: 'Error al abandonar',
  
  // Role operations
  rotation: 'Error al procesar la rotación de roles',
} as const;

/**
 * Maps a database/API error to a user-friendly message
 * @param error - The error object from Supabase or fetch
 * @param context - Optional context for more specific messages
 * @returns A user-friendly error message in Spanish
 */
export function mapDatabaseError(
  error: unknown,
  context?: keyof typeof CONTEXT_ERRORS
): string {
  // Default fallback message
  const defaultMessage = context 
    ? CONTEXT_ERRORS[context] 
    : 'No se pudo completar la operación';
  
  if (!error) {
    return defaultMessage;
  }

  // Handle error object with code property (PostgreSQL errors)
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    // Check PostgreSQL error code
    if (typeof errorObj.code === 'string') {
      const pgMessage = POSTGRES_ERROR_MAP[errorObj.code];
      if (pgMessage) {
        return pgMessage;
      }
      
      const postgrestMessage = POSTGREST_ERROR_MAP[errorObj.code];
      if (postgrestMessage) {
        return postgrestMessage;
      }
    }
    
    // Check error message patterns
    const message = (errorObj.message || errorObj.error || '') as string;
    if (typeof message === 'string') {
      for (const { pattern, message: mappedMessage } of ERROR_PATTERNS) {
        if (pattern.test(message)) {
          return mappedMessage;
        }
      }
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    for (const { pattern, message } of ERROR_PATTERNS) {
      if (pattern.test(error)) {
        return message;
      }
    }
  }
  
  return defaultMessage;
}

/**
 * Maps an auth error to a user-friendly message
 * @param error - The error from Supabase auth
 * @returns A user-friendly error message in Spanish
 */
export function mapAuthError(error: unknown): string {
  return mapDatabaseError(error, 'login');
}

/**
 * Logs error details to console in development only
 * @param context - Description of where the error occurred
 * @param error - The error object
 */
export function logError(context: string, error: unknown): void {
  // In production, you might want to send this to an error tracking service
  console.error(`[${context}]`, error);
}
