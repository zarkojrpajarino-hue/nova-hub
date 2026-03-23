# Engine -> Notification Contract

> XE.9 -- Mapping table: which engine events trigger which notification types.
> Source: migrations 00035, 00036, 00037, 00047 + new migrations 000016-000017.

## Layer 1 -- Activity Notifications (cron batch)

| Notification Type | Priority | Trigger Source | Condition | Dedup |
|---|---|---|---|---|
| `lead_inactive` | high | `notify_inactive_leads()` | Lead without activity for 7+ days | 1 day (metadata match) |
| `task_overdue` | high | `notify_overdue_tasks()` | Task past fecha_limite, per-task | 1 day (metadata match) |
| `validation_expiring` | medium | `notify_expiring_validations()` | OBV pending validation 2-3 days | 1 day (metadata match) |
| `project_inactive` | medium | `notify_inactive_projects()` | Project without OBVs for 14+ days | 7 days |
| `overdue_tasks_warning` | high | `notify_overdue_tasks_warning()` | Project has >= 3 overdue tasks | 3 days |
| `decision_retrospective` | medium | `check_decision_retrospectives()` | Strategic decision 30+ days without outcome | 7 days |

## Layer 2 -- Phase Engine (per-project in batch)

| Notification Type | Priority | Trigger Source | Condition | Dedup |
|---|---|---|---|---|
| `phase_advanced` | high | `notify_phase_changes()` | current_phase > previous phase | 7 days |
| `phase_regressed` | critical | `notify_phase_changes()` | current_phase < previous phase | 7 days |
| `phase_critical` | high | `notify_phase_changes()` | phase_status = 'critical' | 7 days |
| `hard_signal_reached` | high | `notify_phase_changes()` | hard_signal_met = true (owner only) | 7 days |
| `phase_stagnant` | medium | `notify_phase_changes()` | 4+ weeks in same phase, score < 50 (owner only) | 14 days |

## Layer 3 -- Viability Engine (per-project in batch)

| Notification Type | Priority | Trigger Source | Condition | Dedup |
|---|---|---|---|---|
| `viability_critical` | critical | `notify_viability_changes()` | viability_status = 'critical' | 7 days |
| `viability_monitoring` | medium | `notify_viability_changes()` | viability_status = 'at_risk' | 7 days |
| `viability_resolved` | low | `notify_viability_changes()` | viability_status changed to 'healthy' | 7 days |
| `cash_flow_alert` | critical | `notify_viability_changes()` | cash_runway_months < 3 | 7 days |

## Layer 4 -- Risk Engine (per-project in batch)

| Notification Type | Priority | Trigger Source | Condition | Dedup |
|---|---|---|---|---|
| `risk_critical` | critical | `notify_risk_changes()` | risk_level = 'critical' | 7 days |
| `risk_elevated` | high | `notify_risk_changes()` | risk_level = 'high' | 7 days |
| `bottleneck_detected` | high | `notify_bottlenecks()` | New bottleneck in strategic_blocks (owner only) | 7 days |

## Layer 5 -- Probability Engine (per-project in batch)

| Notification Type | Priority | Trigger Source | Condition | Dedup |
|---|---|---|---|---|
| `probability_drop` | high | `notify_probability_changes()` | Score dropped >= 10 points | 7 days |
| `probability_recovered` | low | `notify_probability_changes()` | Score recovered >= 10 points | 7 days |
| `probability_critical` | critical | `notify_probability_changes()` | Score < 20% | 7 days |

## Trigger-based Notifications (not in batch)

| Notification Type | Priority | Trigger Source | Event | Dedup |
|---|---|---|---|---|
| `welcome` | low | `notify_welcome_member()` | INSERT on profiles | 0 (one-shot) |
| `project_deleted` | high | `notify_project_deleted()` | UPDATE projects.deleted_at | 0 (one-shot) |
| `role_accepted` | medium | `notify_role_accepted()` | UPDATE project_members.role_accepted | 0 (one-shot) |
| `lead_won` | medium | `notify_lead_won()` | UPDATE obvs.pipeline_status to cerrado_ganado | 7 days |
| `obv_validated` | low | `notify_obv_validated()` | UPDATE obvs.status to validated | 0 (one-shot) |

## Batch Execution Order

`run_notification_batch()` is called by pg_cron every 6 hours (`0 */6 * * *`).

```
1. notify_inactive_leads()           -- Layer 1
2. notify_overdue_tasks()            -- Layer 1
3. notify_expiring_validations()     -- Layer 1
4. notify_inactive_projects()        -- Layer 1
5. notify_overdue_tasks_warning()    -- N7.V2.1
6. check_decision_retrospectives()   -- SR10.V2.3
7. FOR EACH project:                 -- Layers 2-5
   a. notify_phase_changes()
   b. notify_viability_changes()
   c. notify_risk_changes()
   d. notify_bottlenecks()
   e. notify_probability_changes()
```

## Hard Caps

- Daily per user: 5 notifications (critical bypasses)
- Weekly per user: 15 notifications (critical bypasses)
- Implemented in `check_notification_cap()`
