# Rate Limiter Migration Guide
## From In-Memory to Persistent (Deno KV)

**Date:** 2026-01-25
**Issue:** In-memory rate limiting vulnerable to cold start bypass
**Solution:** Use Deno KV (distributed key-value storage)

---

## Problem

The current rate limiter (`_shared/rate-limiter.ts`) uses `Map()` in-memory storage:

```typescript
const rateLimitStore = new Map<string, Map<string, RateLimitEntry>>();
```

**Vulnerability:**
1. Attacker makes 10 requests (hits limit)
2. Waits for Edge Function cold start (function restarts)
3. Map() is reset, limit is bypassed
4. Attacker makes 10 more requests

---

## Solution

New persistent rate limiter (`_shared/rate-limiter-persistent.ts`) uses **Deno KV**:

```typescript
const kv = await Deno.openKv();
await kv.set(key, entry, { expireIn: expiresAt - now });
```

**Benefits:**
✅ Survives cold starts
✅ Distributed globally (multi-region)
✅ Automatic expiration
✅ Atomic operations
✅ No external services needed (built into Supabase Edge Functions)

---

## Migration Steps

### Step 1: Update Import (in each Edge Function)

**Before:**
```typescript
import { checkRateLimit, RateLimitPresets, getIdentifier } from '../_shared/rate-limiter.ts';
```

**After:**
```typescript
import { checkRateLimit, RateLimitPresets, getIdentifier } from '../_shared/rate-limiter-persistent.ts';
```

### Step 2: Add `await` to Function Calls

**Before:**
```typescript
const rateLimitResult = checkRateLimit(
  identifier,
  'endpoint-name',
  RateLimitPresets.AI_GENERATION
);
```

**After:**
```typescript
const rateLimitResult = await checkRateLimit(
  identifier,
  'endpoint-name',
  RateLimitPresets.AI_GENERATION
);
```

### Step 3: Update Function Signature (if needed)

If the function calling `checkRateLimit` is not async, make it async:

**Before:**
```typescript
Deno.serve((req) => {
  // ...
  const result = checkRateLimit(...);
```

**After:**
```typescript
Deno.serve(async (req) => {
  // ...
  const result = await checkRateLimit(...);
```

---

## Files to Update

Based on grep, these 9 Edge Functions use rate limiting:

### 1. **seed-users** - `supabase/functions/seed-users/index.ts`
- Line ~48: Rate limiting for admin endpoints
- Config: `RateLimitPresets.ADMIN`

### 2. **seed-projects** - `supabase/functions/seed-projects/index.ts`
- Line ~48: Rate limiting for admin endpoints
- Config: `RateLimitPresets.ADMIN`

### 3. **generate-tasks-v2** - `supabase/functions/generate-tasks-v2/index.ts`
- Line ~40: Rate limiting for AI generation
- Config: `RateLimitPresets.AI_GENERATION`

### 4. **generate-role-questions** - `supabase/functions/generate-role-questions/index.ts`
- Line ~40: Rate limiting for AI generation
- Config: `RateLimitPresets.AI_GENERATION`

### 5. **generate-role-questions-v2** - `supabase/functions/generate-role-questions-v2/index.ts`
- Line ~40: Rate limiting for AI generation
- Config: `RateLimitPresets.AI_GENERATION`

### 6. **generate-task-completion-questions** - `supabase/functions/generate-task-completion-questions/index.ts`
- Line ~40: Rate limiting for AI generation
- Config: `RateLimitPresets.AI_GENERATION`

### 7. **generate-project-roles** - `supabase/functions/generate-project-roles/index.ts`
- Line ~40: Rate limiting for AI generation
- Config: `RateLimitPresets.AI_GENERATION`

### 8. **generate-playbook** - `supabase/functions/generate-playbook/index.ts`
- Line ~40: Rate limiting for AI generation
- Config: `RateLimitPresets.AI_GENERATION`

---

## Example: Full Migration

### Before (seed-users/index.ts):

```typescript
import { checkRateLimit, RateLimitPresets, getIdentifier } from '../_shared/rate-limiter.ts';

Deno.serve((req) => {
  // ... CORS, auth checks ...

  // Rate limiting
  const identifier = getIdentifier(req);
  const rateLimitResult = checkRateLimit(
    identifier,
    'seed-users',
    RateLimitPresets.ADMIN
  );

  if (!rateLimitResult.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429
    });
  }

  // ... rest of function ...
});
```

### After (seed-users/index.ts):

```typescript
import { checkRateLimit, RateLimitPresets, getIdentifier } from '../_shared/rate-limiter-persistent.ts';

Deno.serve(async (req) => {  // ← Added 'async'
  // ... CORS, auth checks ...

  // Rate limiting
  const identifier = getIdentifier(req);
  const rateLimitResult = await checkRateLimit(  // ← Added 'await'
    identifier,
    'seed-users',
    RateLimitPresets.ADMIN
  );

  if (!rateLimitResult.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429
    });
  }

  // ... rest of function ...
});
```

---

## Testing

After migration, test that rate limiting persists across cold starts:

### Test 1: Normal Rate Limiting
```bash
# Make 11 requests quickly (limit is 10)
for i in {1..11}; do
  curl -X POST https://your-project.supabase.co/functions/v1/seed-users \
    -H "X-Admin-Secret: YOUR_SECRET"
done
# 11th request should get 429 Rate Limit Exceeded
```

### Test 2: Cold Start Persistence
```bash
# 1. Make 10 requests (hit limit)
# 2. Wait 5 minutes for cold start
# 3. Make 1 request immediately
# Should STILL get 429 (not reset by cold start)
```

### Test 3: Expiration Works
```bash
# 1. Make 10 requests (hit limit)
# 2. Wait for window to expire (1 minute for AI_GENERATION)
# 3. Make request
# Should succeed (limit reset after window)
```

---

## Rollback Plan

If issues occur, rollback is simple:

1. Revert imports back to `rate-limiter.ts`
2. Remove `await` keywords
3. Remove `async` from function signatures

---

## Performance Impact

**Deno KV Performance:**
- Read latency: ~1-5ms (global)
- Write latency: ~5-10ms (global)
- Atomic operations: Yes
- Cost: Included in Supabase Edge Functions

**Trade-off:**
- Adds ~10ms latency per request
- Prevents cold start bypass vulnerability
- **Worth it for security** ✅

---

## FAQ

### Q: Do I need to configure anything?
**A:** No, Deno KV is built into Supabase Edge Functions. Just use it.

### Q: What if Deno KV is down?
**A:** Failover to in-memory (degrade gracefully):
```typescript
let kv;
try {
  kv = await Deno.openKv();
} catch {
  // Fallback to in-memory if KV unavailable
  console.warn('KV unavailable, using in-memory rate limiting');
}
```

### Q: Can I clear rate limits manually?
**A:** Yes, use the helper function:
```typescript
import { clearRateLimit } from '../_shared/rate-limiter-persistent.ts';
await clearRateLimit('user-id', 'endpoint-name');
```

### Q: How do I monitor rate limits?
**A:** Use the status function:
```typescript
import { getRateLimitStatus } from '../_shared/rate-limiter-persistent.ts';
const status = await getRateLimitStatus('user-id', 'endpoint', config);
console.log(`Remaining: ${status.remaining}`);
```

---

## Completion Checklist

- [ ] Update all 9 Edge Functions
- [ ] Add `await` to all `checkRateLimit()` calls
- [ ] Make all calling functions `async`
- [ ] Test rate limiting works
- [ ] Test cold start persistence
- [ ] Deploy to production
- [ ] Monitor for issues

---

**Status:** ⚠️ Migration pending - files created, manual updates needed
**Security Impact:** Fixes cold start bypass vulnerability
**Priority:** HIGH (security issue)
