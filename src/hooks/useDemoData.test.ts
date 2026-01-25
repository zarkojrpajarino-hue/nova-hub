import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDemoData, useDemoMembers, useDemoProjects, useDemoOBVs } from './useDemoData';

// Mock demo context
vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: vi.fn(() => ({ isDemoMode: false })),
}));

// Mock demo data
vi.mock('@/data/demoData', () => ({
  getDemoData: vi.fn(() => []),
  DEMO_MEMBERS: [{ id: 'demo1', nombre: 'Demo User' }],
  DEMO_PROJECTS: [{ id: 'demoproj1', nombre: 'Demo Project' }],
  DEMO_OBVS: [{ id: 'demoobv1', titulo: 'Demo OBV' }],
  DEMO_TASKS: [],
  DEMO_LEADS: [],
  DEMO_VALIDATIONS: [],
  DEMO_NOTIFICATIONS: [],
  DEMO_FINANCIAL: [],
  DEMO_KPIS: {},
  DEMO_RANKINGS: [],
  DEMO_ACTIVITY: [],
  DEMO_MASTERS: [],
}));

describe('useDemoData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns real data when demo mode is off', () => {
    const realData = { id: 'real1', name: 'Real Data' };
    const { result } = renderHook(() => useDemoData('members', realData));
    expect(result.current).toEqual(realData);
  });
});

describe('useDemoMembers', () => {
  it('returns real members when demo mode is off', () => {
    const realMembers = [{ id: 'user1', nombre: 'Real User' }];
    const { result } = renderHook(() => useDemoMembers(realMembers));
    expect(result.current).toEqual(realMembers);
  });
});

describe('useDemoProjects', () => {
  it('returns real projects when demo mode is off', () => {
    const realProjects = [{ id: 'proj1', nombre: 'Real Project' }];
    const { result } = renderHook(() => useDemoProjects(realProjects));
    expect(result.current).toEqual(realProjects);
  });
});

describe('useDemoOBVs', () => {
  it('returns real OBVs when demo mode is off', () => {
    const realOBVs = [{ id: 'obv1', titulo: 'Real OBV' }];
    const { result } = renderHook(() => useDemoOBVs(realOBVs));
    expect(result.current).toEqual(realOBVs);
  });
});
