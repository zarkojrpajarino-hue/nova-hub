import { describe, it, expect } from 'vitest';
import { mapDatabaseError, mapAuthError, CONTEXT_ERRORS } from './errorMapper';

describe('errorMapper', () => {
  describe('mapDatabaseError', () => {
    it('returns default message for null error', () => {
      const result = mapDatabaseError(null);
      expect(result).toBe('No se pudo completar la operación');
    });

    it('returns context-specific default message', () => {
      const result = mapDatabaseError(null, 'create');
      expect(result).toBe(CONTEXT_ERRORS.create);
    });

    it('maps PostgreSQL unique violation error', () => {
      const error = { code: '23505' };
      const result = mapDatabaseError(error);
      expect(result).toBe('Ya existe un registro con estos datos');
    });

    it('maps PostgreSQL foreign key violation error', () => {
      const error = { code: '23503' };
      const result = mapDatabaseError(error);
      expect(result).toBe('Referencia inválida - el registro relacionado no existe');
    });

    it('maps permission error', () => {
      const error = { code: '42501' };
      const result = mapDatabaseError(error);
      expect(result).toBe('No tienes permisos para esta acción');
    });

    it('maps timeout error', () => {
      const error = { code: '57014' };
      const result = mapDatabaseError(error);
      expect(result).toBe('La operación tardó demasiado tiempo');
    });

    it('maps PostgREST not found error', () => {
      const error = { code: 'PGRST116' };
      const result = mapDatabaseError(error);
      expect(result).toBe('No se encontró el registro');
    });

    it('maps invalid login credentials pattern', () => {
      const error = { message: 'Invalid login credentials' };
      const result = mapDatabaseError(error);
      expect(result).toBe('Email o contraseña incorrectos');
    });

    it('maps user already registered pattern', () => {
      const error = { message: 'User already registered' };
      const result = mapDatabaseError(error);
      expect(result).toBe('Este email ya está registrado');
    });

    it('maps JWT expired pattern', () => {
      const error = { message: 'JWT expired' };
      const result = mapDatabaseError(error);
      expect(result).toBe('Tu sesión ha expirado. Por favor, inicia sesión de nuevo');
    });

    it('maps network error pattern', () => {
      const error = { message: 'Network error occurred' };
      const result = mapDatabaseError(error);
      expect(result).toBe('Error de conexión. Comprueba tu conexión a internet');
    });

    it('maps timeout pattern in message', () => {
      const error = { message: 'Request timeout' };
      const result = mapDatabaseError(error);
      expect(result).toBe('La operación tardó demasiado tiempo. Inténtalo de nuevo');
    });

    it('maps rate limit pattern', () => {
      const error = { message: 'Rate limit exceeded' };
      const result = mapDatabaseError(error);
      expect(result).toBe('Demasiadas solicitudes. Espera un momento e inténtalo de nuevo');
    });

    it('handles string errors', () => {
      const error = 'Invalid login credentials';
      const result = mapDatabaseError(error);
      expect(result).toBe('Email o contraseña incorrectos');
    });

    it('returns default for unknown error', () => {
      const error = { code: 'UNKNOWN', message: 'Some unknown error' };
      const result = mapDatabaseError(error);
      expect(result).toBe('No se pudo completar la operación');
    });

    it('uses context for unknown errors', () => {
      const error = { code: 'UNKNOWN' };
      const result = mapDatabaseError(error, 'upload');
      expect(result).toBe(CONTEXT_ERRORS.upload);
    });
  });

  describe('mapAuthError', () => {
    it('maps auth errors with login context', () => {
      const error = { message: 'Invalid credentials' };
      const result = mapAuthError(error);
      expect(result).toBe('Email o contraseña incorrectos');
    });

    it('returns login default for unknown auth error', () => {
      const error = { code: 'UNKNOWN' };
      const result = mapAuthError(error);
      expect(result).toBe(CONTEXT_ERRORS.login);
    });
  });

  describe('CONTEXT_ERRORS', () => {
    it('has all expected CRUD operations', () => {
      expect(CONTEXT_ERRORS.create).toBeTruthy();
      expect(CONTEXT_ERRORS.read).toBeTruthy();
      expect(CONTEXT_ERRORS.update).toBeTruthy();
      expect(CONTEXT_ERRORS.delete).toBeTruthy();
    });

    it('has auth operation errors', () => {
      expect(CONTEXT_ERRORS.login).toBeTruthy();
      expect(CONTEXT_ERRORS.signup).toBeTruthy();
      expect(CONTEXT_ERRORS.logout).toBeTruthy();
    });

    it('has validation operation errors', () => {
      expect(CONTEXT_ERRORS.validate).toBeTruthy();
      expect(CONTEXT_ERRORS.approve).toBeTruthy();
      expect(CONTEXT_ERRORS.reject).toBeTruthy();
    });
  });
});
