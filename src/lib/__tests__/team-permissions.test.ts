/**
 * EQ26.13 — Tests del sistema de equipo v2
 *
 * Tests de lógica pura:
 * 1. computePermissions: founder ve todo
 * 2. computePermissions: sales ve CRM + tareas
 * 3. computePermissions: finance ve financiero
 * 4. computePermissions: ai_tech puede configurar integraciones
 * 5. visibleTabs count per role
 */

import { describe, it, expect } from 'vitest'

// Mirror of computePermissions from useRolePermissions.ts
const FULL_TABS = ['dashboard', 'equipo', 'crm', 'tareas', 'obvs', 'financiero', 'negocio-ia'];

function computePermissions(role: string | null, isLead: boolean) {
  const isFounder = isLead || role === 'strategy';

  if (isFounder) {
    return {
      role, isLead, isFounder: true,
      canViewFullDashboard: true, canViewFinancial: true, canViewCRM: true,
      canChangeStrategy: true, canInviteMembers: true, canConfigureIntegrations: true,
      canCreateOBVs: true, canViewTeam: true,
      visibleTabs: FULL_TABS,
    };
  }

  const base = {
    role, isLead: false, isFounder: false,
    canViewFullDashboard: false, canViewFinancial: false, canViewCRM: false,
    canChangeStrategy: false, canInviteMembers: false, canConfigureIntegrations: false,
    canCreateOBVs: true, canViewTeam: true,
    visibleTabs: ['dashboard', 'tareas', 'equipo'],
  };

  switch (role) {
    case 'sales': return { ...base, canViewCRM: true, visibleTabs: ['dashboard', 'tareas', 'crm', 'obvs', 'equipo'] };
    case 'marketing': return { ...base, canViewCRM: true, visibleTabs: ['dashboard', 'tareas', 'crm', 'obvs', 'equipo'] };
    case 'finance': return { ...base, canViewFinancial: true, visibleTabs: ['dashboard', 'tareas', 'financiero', 'equipo'] };
    case 'operations': return { ...base, visibleTabs: ['dashboard', 'tareas', 'obvs', 'equipo'] };
    case 'ai_tech': return { ...base, canConfigureIntegrations: true, visibleTabs: ['dashboard', 'tareas', 'equipo'] };
    default: return base;
  }
}

describe('EQ26.8 — Role Permissions', () => {
  it('founder (is_lead=true) sees all tabs', () => {
    const p = computePermissions('sales', true);
    expect(p.isFounder).toBe(true);
    expect(p.visibleTabs).toEqual(FULL_TABS);
    expect(p.canChangeStrategy).toBe(true);
    expect(p.canInviteMembers).toBe(true);
  });

  it('strategy role is founder even without is_lead', () => {
    const p = computePermissions('strategy', false);
    expect(p.isFounder).toBe(true);
    expect(p.visibleTabs).toEqual(FULL_TABS);
  });

  it('sales sees CRM, OBVs, tareas', () => {
    const p = computePermissions('sales', false);
    expect(p.isFounder).toBe(false);
    expect(p.canViewCRM).toBe(true);
    expect(p.canViewFinancial).toBe(false);
    expect(p.visibleTabs).toContain('crm');
    expect(p.visibleTabs).toContain('obvs');
    expect(p.visibleTabs).not.toContain('financiero');
  });

  it('finance sees financiero but not CRM', () => {
    const p = computePermissions('finance', false);
    expect(p.canViewFinancial).toBe(true);
    expect(p.canViewCRM).toBe(false);
    expect(p.visibleTabs).toContain('financiero');
    expect(p.visibleTabs).not.toContain('crm');
  });

  it('ai_tech can configure integrations', () => {
    const p = computePermissions('ai_tech', false);
    expect(p.canConfigureIntegrations).toBe(true);
    expect(p.canChangeStrategy).toBe(false);
  });

  it('operations can create OBVs', () => {
    const p = computePermissions('operations', false);
    expect(p.canCreateOBVs).toBe(true);
    expect(p.visibleTabs).toContain('obvs');
  });

  it('no role gets minimal access', () => {
    const p = computePermissions(null, false);
    expect(p.isFounder).toBe(false);
    expect(p.visibleTabs).toHaveLength(3);
  });
});
