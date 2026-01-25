import { describe, it, expect } from 'vitest';
import { HELP_CONTENT } from './helpContent';

describe('helpContent', () => {
  it('exports help content object', () => {
    expect(HELP_CONTENT).toBeDefined();
    expect(typeof HELP_CONTENT).toBe('object');
  });

  it('has dashboard help content', () => {
    expect(HELP_CONTENT).toHaveProperty('dashboard');
    expect(HELP_CONTENT.dashboard).toHaveProperty('title');
    expect(HELP_CONTENT.dashboard).toHaveProperty('description');
  });

  it('has obvs help content', () => {
    expect(HELP_CONTENT).toHaveProperty('obvs');
    expect(HELP_CONTENT.obvs).toHaveProperty('title');
  });

  it('help content has string titles', () => {
    Object.values(HELP_CONTENT).forEach(section => {
      expect(typeof section.title).toBe('string');
      expect(section.title.length).toBeGreaterThan(0);
    });
  });
});
