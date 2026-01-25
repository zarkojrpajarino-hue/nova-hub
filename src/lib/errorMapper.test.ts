import { describe, it, expect } from 'vitest';
import { mapDatabaseError, mapAuthError, CONTEXT_ERRORS } from './errorMapper';

describe('errorMapper', () => {
  describe('mapDatabaseError', () => {
    it('maps PostgreSQL constraint violation error', () => {
      const error = { code: '23505' };
      const result = mapDatabaseError(error);
      expect(result).toBe('Ya existe un registro con estos datos');
    });

    it('maps PostgreSQL permission error', () => {
      const error = { code: '42501' };
      const result = mapDatabaseError(error);
      expect(result).toBe('No tienes permisos para esta acción');
    });

    it('maps PostgreSQL connection error', () => {
      const error = { code: '08000' };
      const result = mapDatabaseError(error);
      expect(result).toBe('Error de conexión con el servidor');
    });

    it('maps invalid login credentials error', () => {
      const error = { message: 'Invalid login credentials' };
      const result = mapDatabaseError(error);
      expect(result).toBe('Email o contraseña incorrectos');
    });

    it('maps JWT expired error', () => {
      const error = { message: 'JWT expired' };
      const result = mapDatabaseError(error);
      expect(result).toContain('sesión ha expirado');
    });

    it('maps network error', () => {
      const error = { message: 'Network error occurred' };
      const result = mapDatabaseError(error);
      expect(result).toContain('conexión');
    });

    it('uses context-specific error message', () => {
      const error = null;
      const result = mapDatabaseError(error, 'create');
      expect(result).toBe(CONTEXT_ERRORS.create);
    });

    it('returns default message for unknown error', () => {
      const error = { code: 'UNKNOWN' };
      const result = mapDatabaseError(error);
      expect(result).toBe('No se pudo completar la operación');
    });

    it('handles string error messages', () => {
      const error = 'Invalid login credentials';
      const result = mapDatabaseError(error);
      expect(result).toBe('Email o contraseña incorrectos');
    });

    it('handles null error', () => {
      const result = mapDatabaseError(null);
      expect(result).toBe('No se pudo completar la operación');
    });
  });

  describe('mapAuthError', () => {
    it('maps auth error to login context', () => {
      const error = { message: 'Auth error' };
      const result = mapAuthError(error);
      expect(result).toBe(CONTEXT_ERRORS.login);
    });
  });

  describe('CONTEXT_ERRORS', () => {
    it('has create error message', () => {
      expect(CONTEXT_ERRORS.create).toBe('No se pudo crear el registro');
    });

    it('has login error message', () => {
      expect(CONTEXT_ERRORS.login).toBe('Error al iniciar sesión');
    });

    it('has validate error message', () => {
      expect(CONTEXT_ERRORS.validate).toBe('Error al validar');
    });

    it('has rotation error message', () => {
      expect(CONTEXT_ERRORS.rotation).toBe('Error al procesar la rotación de roles');
    });
  });
});
