/**
 * V4.7.5 — Tests for computePermissions (src/hooks/useRolePermissions.ts)
 *
 * 8 branches: isLead, strategy, sales, customer, marketing, finance, operations, ai_tech, default (null)
 */

import { describe, it, expect } from 'vitest';
import { computePermissions, type RolePermissions } from '../useRolePermissions';

const FULL_TABS = ['dashboard', 'equipo', 'crm', 'tareas', 'obvs', 'financiero', 'negocio-ia', 'expansion'];

describe('computePermissions', () => {
  // ── Founder paths (isLead=true or role='strategy') ────────────

  it('isLead=true grants full permissions regardless of role', () => {
    const perms = computePermissions('operations', true);
    expect(perms.isFounder).toBe(true);
    expect(perms.isLead).toBe(true);
    expect(perms.canViewFullDashboard).toBe(true);
    expect(perms.canViewFinancial).toBe(true);
    expect(perms.canViewCRM).toBe(true);
    expect(perms.canChangeStrategy).toBe(true);
    expect(perms.canInviteMembers).toBe(true);
    expect(perms.canConfigureIntegrations).toBe(true);
    expect(perms.canCreateOBVs).toBe(true);
    expect(perms.canViewTeam).toBe(true);
    expect(perms.visibleTabs).toEqual(FULL_TABS);
  });

  it('role=strategy grants full permissions even without isLead', () => {
    const perms = computePermissions('strategy', false);
    expect(perms.isFounder).toBe(true);
    expect(perms.canViewFullDashboard).toBe(true);
    expect(perms.canChangeStrategy).toBe(true);
    expect(perms.visibleTabs).toEqual(FULL_TABS);
  });

  // ── Sales role ────────────────────────────────────────────────

  it('role=sales can view CRM and OBVs', () => {
    const perms = computePermissions('sales', false);
    expect(perms.isFounder).toBe(false);
    expect(perms.canViewCRM).toBe(true);
    expect(perms.canCreateOBVs).toBe(true);
    expect(perms.canViewFinancial).toBe(false);
    expect(perms.canChangeStrategy).toBe(false);
    expect(perms.canInviteMembers).toBe(false);
    expect(perms.visibleTabs).toEqual(['dashboard', 'tareas', 'crm', 'obvs', 'equipo']);
  });

  // ── Customer role ─────────────────────────────────────────────

  it('role=customer has same permissions as sales', () => {
    const perms = computePermissions('customer', false);
    expect(perms.canViewCRM).toBe(true);
    expect(perms.canCreateOBVs).toBe(true);
    expect(perms.visibleTabs).toEqual(['dashboard', 'tareas', 'crm', 'obvs', 'equipo']);
  });

  // ── Marketing role ────────────────────────────────────────────

  it('role=marketing can view CRM and create OBVs', () => {
    const perms = computePermissions('marketing', false);
    expect(perms.canViewCRM).toBe(true);
    expect(perms.canCreateOBVs).toBe(true);
    expect(perms.canViewFinancial).toBe(false);
    expect(perms.visibleTabs).toEqual(['dashboard', 'tareas', 'crm', 'obvs', 'equipo']);
  });

  // ── Finance role ──────────────────────────────────────────────

  it('role=finance can view financial but not CRM', () => {
    const perms = computePermissions('finance', false);
    expect(perms.canViewFinancial).toBe(true);
    expect(perms.canViewCRM).toBe(false);
    expect(perms.canCreateOBVs).toBe(true); // base has canCreateOBVs: true
    expect(perms.visibleTabs).toEqual(['dashboard', 'tareas', 'financiero', 'equipo']);
  });

  // ── Operations role ───────────────────────────────────────────

  it('role=operations can create OBVs, sees obvs tab', () => {
    const perms = computePermissions('operations', false);
    expect(perms.canCreateOBVs).toBe(true);
    expect(perms.canViewCRM).toBe(false);
    expect(perms.canViewFinancial).toBe(false);
    expect(perms.visibleTabs).toEqual(['dashboard', 'tareas', 'obvs', 'equipo']);
  });

  // ── AI/Tech role ──────────────────────────────────────────────

  it('role=ai_tech can configure integrations', () => {
    const perms = computePermissions('ai_tech', false);
    expect(perms.canConfigureIntegrations).toBe(true);
    expect(perms.canViewCRM).toBe(false);
    expect(perms.canViewFinancial).toBe(false);
    expect(perms.visibleTabs).toEqual(['dashboard', 'tareas', 'equipo']);
  });

  // ── Default / null role ───────────────────────────────────────

  it('role=null (no membership) returns minimal permissions', () => {
    const perms = computePermissions(null, false);
    expect(perms.isFounder).toBe(false);
    expect(perms.isLead).toBe(false);
    expect(perms.canViewFullDashboard).toBe(false);
    expect(perms.canViewFinancial).toBe(false);
    expect(perms.canViewCRM).toBe(false);
    expect(perms.canChangeStrategy).toBe(false);
    expect(perms.canInviteMembers).toBe(false);
    expect(perms.canConfigureIntegrations).toBe(false);
    expect(perms.canCreateOBVs).toBe(true);
    expect(perms.canViewTeam).toBe(true);
    expect(perms.visibleTabs).toEqual(['dashboard', 'tareas', 'equipo']);
  });

  it('unknown role falls back to base permissions', () => {
    const perms = computePermissions('unknown_role', false);
    expect(perms.isFounder).toBe(false);
    expect(perms.canViewCRM).toBe(false);
    expect(perms.canViewFinancial).toBe(false);
    expect(perms.canConfigureIntegrations).toBe(false);
    expect(perms.visibleTabs).toEqual(['dashboard', 'tareas', 'equipo']);
  });

  // ── All non-founder roles share common base properties ────────

  it('all non-founder roles cannot change strategy or invite members', () => {
    const roles = ['sales', 'customer', 'marketing', 'finance', 'operations', 'ai_tech'];
    for (const role of roles) {
      const perms = computePermissions(role, false);
      expect(perms.canChangeStrategy).toBe(false);
      expect(perms.canInviteMembers).toBe(false);
    }
  });

  it('all non-founder roles can view team', () => {
    const roles = ['sales', 'customer', 'marketing', 'finance', 'operations', 'ai_tech', null];
    for (const role of roles) {
      const perms = computePermissions(role, false);
      expect(perms.canViewTeam).toBe(true);
    }
  });
});
