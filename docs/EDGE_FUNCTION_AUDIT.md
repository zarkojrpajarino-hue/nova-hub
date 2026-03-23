# Edge Function Audit

> Generated: 2026-03-23
> Total functions: 92 (excluding `_shared` and `tests` directories)

## Status Legend

| Status | Meaning |
|--------|---------|
| ACTIVE | Referenced in `src/` - called from frontend |
| CRON | Scheduled function - not called from frontend, triggered by pg_cron or external scheduler |
| ZOMBIE | No references found in `src/` - candidate for removal |

## Audit Results

| Function | Status | Referenced In |
|----------|--------|---------------|
| agent-synthesis | ACTIVE | useAgentContext, build-next-action |
| ai-business-advisor | ZOMBIE | No references |
| ai-career-coach | ACTIVE | MentorChat |
| ai-lead-finder | ACTIVE | AILeadFinder |
| ai-task-executor | ACTIVE | AITaskExecutor |
| ai-task-router | ACTIVE | AITaskRouter |
| analyze-competitor-urls | ZOMBIE | No references |
| analyze-competitors | ZOMBIE | No references (confused with analyze-competitor-urls) |
| analyze-expansion-v1 | ACTIVE | ExpansionIntelligencePage |
| analyze-meeting | ACTIVE | useMeetings |
| analyze-project-v4 | ACTIVE | useProjectAnalysis, AnalysisChat |
| apply-meeting-insights | ACTIVE | useMeetings |
| approve-generation-preview | ACTIVE | useGenerativeBusiness |
| auto-sync-finances | CRON | No frontend refs - likely cron-triggered |
| calculate-fit-score | ACTIVE | SelfEvaluationModal |
| calculate-lead-score | ZOMBIE | No references (legacy - replaced by OBV scoring?) |
| cofounder-alignment-analyzer | ZOMBIE | No references |
| competitive-swot-generator | ZOMBIE | No references |
| competitor-intelligence-cron | CRON | No frontend refs - cron by name |
| connect-asana | ACTIVE | AsanaIntegration |
| connect-google-calendar | ACTIVE | GoogleCalendarIntegration |
| connect-holded | ACTIVE | HoldedIntegration |
| connect-hubspot | ACTIVE | HubSpotIntegration |
| connect-notion | ACTIVE | NotionIntegration |
| connect-slack | ACTIVE | SlackSyncIntegration |
| connect-stripe | ACTIVE | StripeIntegration |
| connect-trello | ACTIVE | TrelloIntegration |
| deploy-to-vercel | ZOMBIE | No references |
| enrich-project-intelligence | ZOMBIE | No references |
| evaluate-meeting-alignment | ACTIVE | MeetingCompletionSummary |
| export-excel | ACTIVE | useExcelExport |
| extract-business-info | ZOMBIE | No references |
| generate-actionable-insights | ACTIVE | useFounderTool |
| generate-brand-kit-v2 | ACTIVE | useFounderTool |
| generate-business-ideas | ACTIVE | useGenerativeBusiness |
| generate-business-options | ACTIVE | useFounderTool |
| generate-buyer-persona-v2 | ACTIVE | useFounderTool |
| generate-comms-guide-v2 | ACTIVE | useFounderTool |
| generate-complete-business | ACTIVE | useGenerativeBusiness |
| generate-content-calendar | ACTIVE | useFounderTool |
| generate-customer-journey-v2 | ACTIVE | useFounderTool |
| generate-email-pitch | ACTIVE | EmailPitchGenerator |
| generate-financial-projections | ACTIVE | useFounderTool |
| generate-hiring-guidance | ACTIVE | useFounderTool |
| generate-launch-checklist | ACTIVE | useFounderTool |
| generate-lead-scoring-v2 | ACTIVE | useFounderTool |
| generate-learning-path | ACTIVE | LearningPathGenerator, LearningPathList |
| generate-learning-roadmap | ACTIVE | useGenerateLearningRoadmap |
| generate-local-context | ACTIVE | helpContent |
| generate-pitch-deck | ACTIVE | useFounderTool |
| generate-playbook | ACTIVE | useEvidenceGeneration |
| generate-predictions | ACTIVE | evidence profiles |
| generate-project-roles | ACTIVE | useGenerateRoles |
| generate-role-questions | ACTIVE | AIRoleQuestionsGenerator |
| generate-role-questions-v2 | ACTIVE | AIRoleQuestionsGenerator |
| generate-sales-playbook-v2 | ACTIVE | useFounderTool |
| generate-strategic-cycle | ACTIVE | useStrategicCycles |
| generate-task-completion-questions | ACTIVE | TaskCompletionDialog |
| generate-tasks-v2 | ACTIVE | AITaskGenerator |
| generate-testimonial | ACTIVE | evidence profiles |
| generate-weekly-insights | ACTIVE | evidence profiles |
| generate-weekly-reviews | ZOMBIE | No references (possibly replaced by generate-weekly-insights) |
| geo-intelligence | ZOMBIE | No references |
| get-meeting-brief | ACTIVE | StartMeetingModal |
| google-analytics-sync | CRON | No frontend refs - sync by name |
| growth-playbook-generator | ZOMBIE | No references |
| learning-path-generator | ZOMBIE | No references (replaced by generate-learning-path) |
| market-research | ZOMBIE | No references |
| prepare-one-on-one | ACTIVE | OneOnOnePrep |
| ritual-optimus | ACTIVE | ResetSurface |
| scrape-and-extract | ACTIVE | evidence function-claims |
| seed-projects | ZOMBIE | Admin/dev utility |
| seed-users | ZOMBIE | Admin/dev utility |
| send-critical-notifications | CRON | No frontend refs - triggered by DB/cron |
| send-email-real | ZOMBIE | No frontend refs (called from other edge functions?) |
| send-slack-notification | ACTIVE | SlackIntegration |
| stripe-webhooks | ACTIVE | Webhook endpoint (not called from frontend but active) |
| suggest-buyer-persona | ZOMBIE | No references (replaced by generate-buyer-persona-v2) |
| suggest-optimal-schedule | ACTIVE | OptimalScheduleSuggester |
| sync-asana | ACTIVE | AsanaIntegration, salesAgentService |
| sync-google-calendar | ACTIVE | GoogleCalendarIntegration |
| sync-holded | ACTIVE | HoldedIntegration, financeAgentService |
| sync-hubspot | ACTIVE | HubSpotIntegration |
| sync-notion | ACTIVE | NotionIntegration |
| sync-slack | ACTIVE | SlackSyncIntegration |
| sync-stripe | ACTIVE | StripeIntegration, financeAgentService |
| sync-trello | ACTIVE | TrelloIntegration |
| transcribe-meeting | ACTIVE | useMeetings |
| trial-email-triggers | CRON | No frontend refs - triggered by cron |
| validate-monetization | ZOMBIE | No references |
| write-content-piece | ZOMBIE | No references |

## Summary

| Status | Count |
|--------|-------|
| ACTIVE | 65 |
| CRON | 5 |
| ZOMBIE | 22 |

## Zombie Functions (candidates for removal)

1. **ai-business-advisor** - No references found
2. **analyze-competitor-urls** - No references found
3. **analyze-competitors** - No references found
4. **calculate-lead-score** - Likely replaced by OBV pipeline scoring
5. **cofounder-alignment-analyzer** - No references found
6. **competitive-swot-generator** - No references found
7. **deploy-to-vercel** - No references found
8. **enrich-project-intelligence** - No references found
9. **extract-business-info** - No references found
10. **generate-weekly-reviews** - Likely replaced by generate-weekly-insights
11. **geo-intelligence** - No references found
12. **growth-playbook-generator** - No references found
13. **learning-path-generator** - Replaced by generate-learning-path
14. **market-research** - No references found
15. **seed-projects** - Dev utility, not production
16. **seed-users** - Dev utility, not production
17. **send-email-real** - May be called from other edge functions (check before deleting)
18. **suggest-buyer-persona** - Replaced by generate-buyer-persona-v2
19. **validate-monetization** - No references found
20. **write-content-piece** - No references found

> **WARNING:** Before deleting any zombie function, verify it is not called from other edge functions (function-to-function calls) or from pg_cron jobs. `send-email-real` is especially suspect -- it may be called internally by notification functions.
