# Security -- Nova Hub

> Last updated: 2026-03-23 (Sprint 1 Security Hardening applied)

## Known Exposure

### Credentials in Git History

The following credentials were exposed in the git history at various points:

| Credential | Status | Action Required |
|-----------|--------|-----------------|
| Supabase `service_role_key` | EXPOSED in git history | ROTATE immediately before public launch |
| Anthropic API key | EXPOSED in `.env` / `.env.txt` | ROTATE before public launch |
| Supabase `anon_key` | In client code (by design) | Safe -- RLS enforces access |
| PostHog / Sentry keys | In `.env.txt` | Low risk (analytics keys) but rotate anyway |

### Rotation Procedure

1. **Supabase service_role_key:**
   - Go to Supabase Dashboard > Settings > API
   - Click "Rotate service_role key"
   - Update all edge functions that use the old key
   - Update any CI/CD secrets

2. **Anthropic API key:**
   - Go to console.anthropic.com > API Keys
   - Revoke the old key
   - Create a new key
   - Update in Supabase Dashboard > Edge Functions > Secrets (`ANTHROPIC_API_KEY`)
   - Update local `.env.txt` for development

3. **General rotation checklist:**
   - Search for the old key value in the entire repo: `grep -rn "sk-ant-" .`
   - Ensure `.env`, `.env.txt`, `.env.local` are in `.gitignore`
   - After rotation, the old keys in git history are useless but consider `git filter-branch` or BFG Repo-Cleaner if going open-source

## Authentication Pattern

### User Authentication
- **Provider:** Supabase Auth (email/password, magic link)
- **Token format:** JWT signed with ES256 (ECDSA asymmetric)
- **Token storage:** Managed by `@supabase/supabase-js` (localStorage)
- **Session refresh:** Automatic via Supabase client

### Edge Function Authentication (Sprint 1 hardened)
- **`verify_jwt` is set to `false`** on all edge functions
- **Reason:** Supabase's built-in JWT verification uses HS256 but our tokens use ES256. The default verifier rejects valid tokens.
- **Custom validation:** Every edge function calls `validateAuth()` from `_shared/auth.ts`
- **Sprint 1 (S1.1):** 11 functions migrated from ad-hoc `getClaims()` auth to shared `validateAuth()`. All non-exception functions now use the shared middleware.
- **Pattern:**
  ```typescript
  import { validateAuth } from '../_shared/auth.ts'
  // validateAuth throws a Response(401) on failure
  const { user, serviceClient } = await validateAuth(req);
  ```
- **Exceptions** (by design): `seed-users`, `seed-projects` (admin tools), `stripe-webhooks` (Stripe signature), cron functions (`auto-sync-finances`, `competitor-intelligence-cron`)

### Prompt Injection Protection (Sprint 1 — S1.2)
- All AI functions that accept free-text user input sanitize via `sanitizePromptInput()` from `_shared/ai-prompt-sanitizer.ts`
- Detects and blocks: "ignore previous instructions", role impersonation, unicode tricks, excessive whitespace
- Preset configs: `SHORT_INPUT` (100 chars), `MEDIUM_INPUT` (500), `LONG_INPUT` (2000), `SYSTEM_CONTEXT` (10000)
- Applied to: `ai-business-advisor`, `ai-lead-finder`, `ai-career-coach`, `generate-email-pitch`, `ai-task-executor`, `generate-content-calendar`, `analyze-project-v4`, `generate-hiring-guidance`, `generate-complete-business`, `generate-learning-roadmap`, `generate-project-roles`

### AI Output Validation (Sprint 1 — S1.3)
- `_shared/safe-json-parse.ts` provides `safeJsonParse<T>()` for parsing LLM responses
- Handles markdown code blocks (```` ```json ... ``` ````) automatically
- Returns typed `{ ok: true, data: T } | { ok: false, error: string }` instead of throwing
- Applied to: `generate-hiring-guidance`, `generate-strategic-cycle`, `generate-learning-roadmap`, `generate-project-roles`, `generate-role-questions`, `generate-role-questions-v2`, `generate-task-completion-questions`, `generate-playbook`

### Row-Level Security (RLS)
- **Enabled on ALL tables** -- no exceptions
- Policies enforce:
  - Users can only read/write their own data
  - Project members can access project data
  - Admins have broader access via `user_roles.app_role = 'admin'`
- The `profiles` table is the user table (NOT `members` -- that table does not exist)

## Rate Limiting

### Strategy (Sprint 1 — S1.6 upgraded)
- **Per-user persistent rate limiting** via `_shared/rate-limiter-persistent.ts` (Deno KV)
- Survives cold starts and deployments (unlike the old in-memory limiter)
- Limits are applied per function per user with automatic TTL cleanup

### Current Presets (`RateLimitPresets`)
| Preset | Requests | Window | Used By |
|--------|----------|--------|---------|
| `AI_GENERATION` | 10/min | 60s | All LLM-calling functions |
| `AUTH` | 5/min | 60s | Auth endpoints |
| `DATA_MUTATION` | 30/min | 60s | Data write endpoints (export-excel) |
| `DATA_READ` | 100/min | 60s | Read-only endpoints |
| `ADMIN` | 3/5min | 300s | Seed/admin endpoints |

### Sprint 1 additions
- `analyze-expansion-v1`, `generate-hiring-guidance`, `generate-strategic-cycle`, `export-excel`, `generate-content-calendar`, `generate-email-pitch`, `generate-complete-business` — previously had NO rate limiting, now protected

## Data Protection

### Encryption at Rest
- Supabase PostgreSQL encrypts data at rest by default
- Integration credentials (OAuth tokens, API keys) are additionally encrypted using `pgcrypto` extension
- Encryption/decryption via SQL RPCs: `upsert_integration_credential` and `decrypt_integration_credential`
- These RPCs use `SET search_path = public, extensions` to access pgcrypto functions

### Data Isolation
- Multi-project architecture with strict project_id scoping
- RLS policies prevent cross-project data access
- Soft-delete pattern (deleted_at) prevents accidental data loss

## Reporting Vulnerabilities

If you discover a security vulnerability, please email the project owner directly.
Do NOT create a public GitHub issue for security vulnerabilities.
