import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthorizationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  NetworkError,
  ServerError,
  handleSupabaseError,
  shouldRetry,
  getRetryDelay,
} from '../errorHandler';

describe('AppError hierarchy', () => {
  it('AppError has correct defaults', () => {
    const err = new AppError('test', 'TEST', 500);
    expect(err.message).toBe('test');
    expect(err.code).toBe('TEST');
    expect(err.statusCode).toBe(500);
    expect(err.name).toBe('AppError');
  });

  it('ValidationError has 400 status and correct code', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.name).toBe('ValidationError');
  });

  it('AuthorizationError has 403 status', () => {
    const err = new AuthorizationError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('AUTHORIZATION_ERROR');
  });

  it('AuthenticationError has 401 status', () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTHENTICATION_ERROR');
  });

  it('NotFoundError has 404 status', () => {
    const err = new NotFoundError('Proyecto');
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain('Proyecto');
  });

  it('ConflictError has 409 status', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('NetworkError has status 0', () => {
    const err = new NetworkError();
    expect(err.statusCode).toBe(0);
    expect(err.code).toBe('NETWORK_ERROR');
  });

  it('ServerError has status 500', () => {
    const err = new ServerError();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('SERVER_ERROR');
  });
});

describe('handleSupabaseError', () => {
  it('returns AppError as-is', () => {
    const original = new ValidationError('already typed');
    const result = handleSupabaseError(original);
    expect(result).toBe(original);
  });

  it('maps duplicate key error (23505) to ConflictError by code', () => {
    const result = handleSupabaseError({ code: '23505', message: 'duplicate key' });
    expect(result.code).toBe('CONFLICT');
    expect(result.statusCode).toBe(409);
  });

  it('maps auth error (PGRST301) to AuthenticationError by code', () => {
    const result = handleSupabaseError({ code: 'PGRST301' });
    expect(result.code).toBe('AUTHENTICATION_ERROR');
    expect(result.statusCode).toBe(401);
  });

  it('maps permission error (42501) to AuthorizationError by code', () => {
    const result = handleSupabaseError({ code: '42501' });
    expect(result.code).toBe('AUTHORIZATION_ERROR');
    expect(result.statusCode).toBe(403);
  });

  it('maps not found (PGRST116) to NotFoundError by code', () => {
    const result = handleSupabaseError({ code: 'PGRST116' });
    expect(result.code).toBe('NOT_FOUND');
    expect(result.statusCode).toBe(404);
  });

  it('maps network errors to NetworkError by code', () => {
    const r1 = handleSupabaseError({ code: 'ECONNREFUSED' });
    expect(r1.code).toBe('NETWORK_ERROR');
    const r2 = handleSupabaseError({ code: 'ETIMEDOUT' });
    expect(r2.code).toBe('NETWORK_ERROR');
  });

  it('returns ServerError for unknown codes', () => {
    const result = handleSupabaseError({ code: 'UNKNOWN_CODE' });
    expect(result.code).toBe('SERVER_ERROR');
  });

  it('maps email duplicate to specific message', () => {
    const result = handleSupabaseError({ code: '23505', message: 'email already exists' });
    expect(result.message).toContain('email');
  });
});

describe('shouldRetry', () => {
  it('retries server errors (status 500)', () => {
    expect(shouldRetry(new ServerError(), 1)).toBe(true);
  });

  it('does not retry validation errors', () => {
    // ValidationError has status 400, AppError.isRetryable checks 500-599
    expect(shouldRetry(new ValidationError('bad'), 1)).toBe(false);
  });

  it('stops retrying after max attempts', () => {
    expect(shouldRetry(new ServerError(), 3, 3)).toBe(false);
  });
});

describe('getRetryDelay', () => {
  it('returns exponential backoff', () => {
    expect(getRetryDelay(1)).toBe(1000);
    expect(getRetryDelay(2)).toBe(2000);
    expect(getRetryDelay(3)).toBe(4000);
  });

  it('caps at 8 seconds', () => {
    expect(getRetryDelay(10)).toBe(8000);
  });
});
