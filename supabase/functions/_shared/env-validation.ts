/**
 * Environment Variable Validation Utilities
 *
 * Ensures required environment variables are present before edge functions execute.
 * Prevents silent failures and provides clear error messages.
 */

/**
 * Requires an environment variable to be set
 * @param key - The environment variable name
 * @throws Error if the environment variable is missing or empty
 * @returns The environment variable value
 */
export function requireEnv(key: string): string {
  const value = Deno.env.get(key);

  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

/**
 * Gets an optional environment variable with a default value
 * @param key - The environment variable name
 * @param defaultValue - The default value if not set
 * @returns The environment variable value or default
 */
export function getEnv(key: string, defaultValue: string): string {
  const value = Deno.env.get(key);
  return value && value.trim() !== '' ? value : defaultValue;
}

/**
 * Validates multiple required environment variables at once
 * @param keys - Array of required environment variable names
 * @throws Error with list of all missing variables
 */
export function requireEnvVars(keys: string[]): void {
  const missing: string[] = [];

  for (const key of keys) {
    const value = Deno.env.get(key);
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Gets all required environment variables as an object
 * @param keys - Array of required environment variable names
 * @returns Object with environment variable values
 * @throws Error if any required variable is missing
 */
export function getRequiredEnvVars<T extends string>(
  keys: T[]
): Record<T, string> {
  requireEnvVars(keys);

  const result = {} as Record<T, string>;
  for (const key of keys) {
    result[key] = Deno.env.get(key)!;
  }

  return result;
}
