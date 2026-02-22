# Evidence Instrumentation - Integration Guide

## Status: Day 1-2 In Progress ⏳

### ✅ Completed
1. Created Deno-compatible instrumentation module (`_shared/evidence-instrumentation.ts`)
2. Integrated into **ai-lead-finder** edge function ✅
3. Integrated into **generate-tasks-v2** edge function ✅

### 📝 Integration Pattern

Follow this pattern for all remaining edge functions:

#### Step 1: Import the tracker

```typescript
import { EvidenceMetricsTracker } from '../_shared/evidence-instrumentation.ts';
```

#### Step 2: Create tracker (after auth & parsing request)

```typescript
// Extract evidence_mode from request (optional, defaults to 'balanced')
const evidenceMode = body.evidence_mode || 'balanced';

// Create tracker
const evidenceTracker = new EvidenceMetricsTracker(
  'feature_name',           // e.g., 'ai_lead_finder', 'task_generation', 'learning_path'
  'profile_name',           // e.g., 'crm', 'tasks', 'learning', 'financial'
  evidenceMode,             // 'hypothesis' | 'balanced' | 'strict'
  userId,
  projectId
);
```

#### Step 3: Track retrieval phase (external sources, DB queries, APIs)

```typescript
// START retrieval
evidenceTracker.startRetrieval();

// ... fetch data from external APIs, DB, etc.
const sources = await fetchExternalData();

// END retrieval
const retrievalTime = evidenceTracker.endRetrieval(sources.length);
evidenceTracker.recordTierDuration('tier_name', retrievalTime);
```

Common tiers to record:
- `'internal_data'` - Database queries, project intelligence
- `'external_apis'` - Third-party APIs (Google Maps, World Bank, etc.)
- `'user_docs'` - User-uploaded documents
- `'web_news'` - Web scraping, news APIs

#### Step 4: Track generation phase (AI calls)

```typescript
// START generation
evidenceTracker.startGeneration();

// ... call AI (Claude, GPT, etc.)
const aiResponse = await callAI(prompt);

// Count how many sources were cited in the response
const sourcesCited = countCitationsInResponse(aiResponse);

// END generation
evidenceTracker.endGeneration(sourcesCited);
```

#### Step 5: Determine evidence status and log metrics

```typescript
// Determine evidence_status based on results
if (sourcesFound >= minRequired && quality === 'high') {
  evidenceTracker.setEvidenceStatus('verified');
} else if (sourcesFound > 0) {
  evidenceTracker.setEvidenceStatus('partial');
} else {
  evidenceTracker.setEvidenceStatus('no_evidence');
}

// Add metadata (optional but recommended)
evidenceTracker.metadata = {
  // Any additional context useful for analysis
  items_generated: generatedItems.length,
  quality_score: qualityScore,
  coverage_percentage: (itemsSaved / itemsRequested) * 100,
};

// Persist to DB
const generationId = await evidenceTracker.finish(supabase);
console.log(`[Evidence] Logged generation: ${generationId}`);
```

#### Step 6: Return generation_id in response

```typescript
return new Response(
  JSON.stringify({
    success: true,
    // ... your normal response data
    generation_id: generationId, // Add this for UI event tracking
  }),
  { headers: { 'Content-Type': 'application/json' } }
);
```

---

## Remaining Edge Functions to Integrate

### Priority 1 (Core AI Features)

- [ ] **generate-learning-path** (profile: 'learning')
- [ ] **geo-intelligence** (profile: 'financial')
- [ ] **prepare-one-on-one** (profile: 'team')
- [ ] **suggest-optimal-schedule** (profile: 'team')

### Priority 2 (Additional Features)

- [ ] **ai-task-router** (profile: 'tasks')
- [ ] **ai-task-executor** (profile: 'tasks')

---

## Profile Mapping

| Feature | Profile | Mode Default | Notes |
|---------|---------|--------------|-------|
| ai-lead-finder | `crm` | `balanced` | External APIs (Google Maps, directories) |
| generate-tasks-v2 | `tasks` | `hypothesis` | Internal only (project intelligence, team data) |
| generate-learning-path | `learning` | `balanced` | Mix of internal + external resources |
| geo-intelligence | `financial` | `strict` | Official APIs (World Bank, OECD, etc.) |
| prepare-one-on-one | `team` | `balanced` | Internal data (team metrics, 1:1 history) |
| suggest-optimal-schedule | `team` | `balanced` | Internal data (availability, preferences) |
| ai-task-router | `tasks` | `hypothesis` | Internal routing logic |
| ai-task-executor | `tasks` | `hypothesis` | Internal execution |

---

## Example: ai-lead-finder

See `C:\Users\Zarko\nova-hub\supabase\functions\ai-lead-finder\index.ts` for complete integration.

**Key points:**
1. Tracker created after Supabase client initialization
2. Retrieval tracks external API calls (findBusinesses)
3. Generation tracks enrichment (generatePitches)
4. Evidence status based on number of leads found
5. Metadata includes search criteria and location

---

## Example: generate-tasks-v2

See `C:\Users\Zarko\nova-hub\supabase\functions\generate-tasks-v2\index.ts` for complete integration.

**Key points:**
1. Tracker created after auth and project validation
2. Retrieval tracks internal data gathering (project, team, intelligence)
3. Generation tracks Claude API call
4. Evidence status based on context quality (sources_found)
5. Metadata includes team size, project phase, tasks generated

---

## Testing Checklist

After integrating each function:

1. [ ] Edge function deploys without errors
2. [ ] Evidence tracking doesn't break function (returns normally)
3. [ ] Data appears in `evidence_generation_metrics` table
4. [ ] `generation_id` returned in response
5. [ ] Latency, sources, and status recorded correctly

---

## Next Steps

1. Run migration to create `evidence_generation_metrics` table
2. Integrate remaining 6 edge functions
3. Deploy to staging
4. Execute 50-100 test generations
5. Run decision queries from `EVIDENCE_SYSTEM_QUERIES.sql`
6. Analyze results and identify red flags

---

## Notes

- **Don't break existing functionality** - If instrumentation fails, log the error but don't throw
- **Use try-catch** around `evidenceTracker.finish()` to prevent logging failures from breaking responses
- **Profile should match domain** - Use the appropriate profile for each feature
- **Mode comes from request** - Client can override mode (hypothesis, balanced, strict)
- **Sources_cited** - Only applicable if AI actually cites sources in output (N/A for many features)
