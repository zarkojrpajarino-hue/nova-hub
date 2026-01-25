import { describe, it, expect } from 'vitest';
import { DEMO_MEMBERS, DEMO_PROJECTS, DEMO_OBVS, DEMO_LEADS } from './demoData';

describe('demoData', () => {
  it('exports demo members array', () => {
    expect(DEMO_MEMBERS).toBeDefined();
    expect(Array.isArray(DEMO_MEMBERS)).toBe(true);
    expect(DEMO_MEMBERS.length).toBeGreaterThan(0);
  });

  it('exports demo projects array', () => {
    expect(DEMO_PROJECTS).toBeDefined();
    expect(Array.isArray(DEMO_PROJECTS)).toBe(true);
    expect(DEMO_PROJECTS.length).toBeGreaterThan(0);
  });

  it('exports demo obvs array', () => {
    expect(DEMO_OBVS).toBeDefined();
    expect(Array.isArray(DEMO_OBVS)).toBe(true);
  });

  it('exports demo leads array', () => {
    expect(DEMO_LEADS).toBeDefined();
    expect(Array.isArray(DEMO_LEADS)).toBe(true);
  });

  it('demo members have required properties', () => {
    const member = DEMO_MEMBERS[0];
    expect(member).toHaveProperty('id');
    expect(member).toHaveProperty('nombre');
    expect(member).toHaveProperty('email');
    expect(member).toHaveProperty('color');
  });

  it('demo projects have required properties', () => {
    const project = DEMO_PROJECTS[0];
    expect(project).toHaveProperty('id');
    expect(project).toHaveProperty('nombre');
    expect(project).toHaveProperty('icon');
    expect(project).toHaveProperty('color');
  });
});
