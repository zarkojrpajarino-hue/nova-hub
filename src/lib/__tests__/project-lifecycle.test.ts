/**
 * A12 — Tests de ciclo de vida del proyecto
 *
 * Tests de lógica pura:
 * - is_project_active logic (mirrors SQL function)
 */

import { describe, it, expect } from 'vitest'

// Mirror of is_project_active SQL logic
function isProjectActive(project: {
  deleted_at: string | null;
  paused_at: string | null;
  archived_at: string | null;
}): boolean {
  return project.deleted_at === null
    && project.paused_at === null
    && project.archived_at === null;
}

describe('A12 — Project Lifecycle', () => {
  it('active project: all nulls', () => {
    expect(isProjectActive({ deleted_at: null, paused_at: null, archived_at: null })).toBe(true);
  });

  it('paused project: not active', () => {
    expect(isProjectActive({ deleted_at: null, paused_at: '2026-03-21T00:00:00Z', archived_at: null })).toBe(false);
  });

  it('archived project: not active', () => {
    expect(isProjectActive({ deleted_at: null, paused_at: null, archived_at: '2026-03-21T00:00:00Z' })).toBe(false);
  });

  it('deleted project: not active', () => {
    expect(isProjectActive({ deleted_at: '2026-03-21T00:00:00Z', paused_at: null, archived_at: null })).toBe(false);
  });

  it('archived + paused: not active', () => {
    expect(isProjectActive({
      deleted_at: null,
      paused_at: '2026-03-21T00:00:00Z',
      archived_at: '2026-03-21T00:00:00Z',
    })).toBe(false);
  });
});
