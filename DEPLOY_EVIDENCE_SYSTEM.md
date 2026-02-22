# 🚀 Deploy AI Evidence System - Phase 0.5

## Quick Deploy Guide

### Step 1: Apply Database Migration

You have 2 options:

#### Option A: Via Supabase Dashboard (Recommended - No CLI needed)

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Open file: `supabase/migrations/20260207000001_ai_evidence_system_phase_0_5.sql`
3. Copy the entire SQL content
4. Paste into SQL Editor
5. Click **"Run"**
6. ✅ Verify: Check that 4 new tables appear in Table Editor:
   - `project_documents`
   - `ai_source_registry`
   - `user_source_policies`
   - `ai_generation_logs`

#### Option B: Via Supabase CLI (If you have it installed)

```bash
cd nova-hub
supabase db push
```

### Step 2: Verify Migration Success

Run this query in SQL Editor to confirm:

```sql
-- Check that all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'project_documents',
    'ai_source_registry',
    'user_source_policies',
    'ai_generation_logs'
  );

-- Should return 4 rows
```

### Step 3: Verify Seed Data

Check that official sources were seeded:

```sql
SELECT source_name, source_type, reliability_score
FROM ai_source_registry
ORDER BY reliability_score DESC;

-- Should show SEC, Census, World Bank, BLS, FRED, etc.
```

### Step 4: Test Full-Text Search Function

```sql
-- This should work even with no documents yet (returns empty)
SELECT * FROM search_project_documents(
  'some-project-id'::uuid,
  'test query',
  10
);
```

---

## 🧪 Testing the System (Manual)

### Test 1: Create a Test Document

```sql
-- Insert a test document
INSERT INTO project_documents (
  project_id,
  user_id,
  name,
  file_type,
  raw_content,
  content_language,
  pages_count
) VALUES (
  (SELECT id FROM projects LIMIT 1), -- Use your actual project ID
  auth.uid(),
  'Test Market Research.pdf',
  'pdf',
  'The SaaS market size in the United States reached $150 billion in 2024. Market growth rate is estimated at 18% CAGR through 2028. Customer acquisition costs average $300 for B2B SaaS companies.',
  'simple',
  1
);
```

### Test 2: Search the Document

```sql
SELECT
  document_name,
  matched_content,
  relevance_rank
FROM search_project_documents(
  (SELECT id FROM projects LIMIT 1),
  'SaaS market size',
  5
);

-- Should return the test document with highlighted matches
```

### Test 3: Create Source Policy

```sql
-- Get or create default policy for a project
SELECT * FROM get_project_source_policy(
  (SELECT id FROM projects LIMIT 1)::uuid
);

-- Should return a policy with default settings
```

---

## 📝 Testing from TypeScript (Once UI is ready)

Create a test file: `src/lib/evidence/__tests__/retrieval.test.ts`

```typescript
import { searchUserDocuments } from '@/lib/evidence/retrievers/user-documents';
import { searchOfficialSources } from '@/lib/evidence/retrievers/official-sources';
import { searchEvidenceSources, getProjectSourcePolicy } from '@/lib/evidence/retrievers/master-retriever';

// Test 1: Search user documents
async function testUserDocuments() {
  const results = await searchUserDocuments(
    'SaaS market size',
    'user-id-here',
    'project-id-here',
    5
  );

  console.log(`Found ${results.length} user documents`);
  results.forEach(doc => {
    console.log(`- ${doc.name}: ${doc.summary}`);
  });
}

// Test 2: Search official sources
async function testOfficialSources() {
  const results = await searchOfficialSources(
    'US GDP growth rate 2024',
    'US'
  );

  console.log(`Found ${results.length} official sources`);
  results.forEach(source => {
    console.log(`- ${source.name} (${source.reliability_score}): ${source.url}`);
  });
}

// Test 3: Full search with policy
async function testFullSearch() {
  const policy = await getProjectSourcePolicy('project-id-here');

  if (!policy) {
    console.log('No policy found');
    return;
  }

  const searchResults = await searchEvidenceSources(
    'SaaS market size 2024',
    policy,
    {
      userId: 'user-id-here',
      projectId: 'project-id-here',
      country: 'US'
    }
  );

  console.log(`Search completed in ${searchResults.search_duration_ms}ms`);
  console.log(`Found ${searchResults.sources_found.length} total sources`);
  console.log(`- Tier 1 (user docs): ${searchResults.tier_1_count}`);
  console.log(`- Tier 2 (official): ${searchResults.tier_2_count}`);
  console.log(`- Avg reliability: ${searchResults.avg_reliability_score}`);
  console.log(`- Unique domains: ${searchResults.independent_domains.join(', ')}`);
}

// Run tests
testUserDocuments();
testOfficialSources();
testFullSearch();
```

---

## 🔍 Troubleshooting

### Migration fails with "table already exists"

Drop the tables first (⚠️ WARNING: This deletes data):

```sql
DROP TABLE IF EXISTS ai_generation_logs CASCADE;
DROP TABLE IF EXISTS user_source_policies CASCADE;
DROP TABLE IF EXISTS ai_source_registry CASCADE;
DROP TABLE IF EXISTS project_documents CASCADE;

-- Then re-run the migration
```

### Full-text search returns nothing

Check that `content_tsvector` is being generated:

```sql
SELECT
  name,
  length(raw_content) as content_length,
  content_tsvector IS NOT NULL as has_tsvector
FROM project_documents;
```

If `has_tsvector` is false, the generated column isn't working. Check PostgreSQL version (needs 12+).

### RLS blocks access

Temporarily disable RLS for testing (⚠️ Re-enable after testing):

```sql
ALTER TABLE project_documents DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing:
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
```

### TypeScript import errors

Make sure `@/integrations/supabase/client` exists. If not, check your `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 📊 Expected Database Schema

After migration, you should have:

### Tables (4)
- `project_documents` - User uploaded files with full-text search
- `ai_source_registry` - External source catalog
- `user_source_policies` - Per-project source preferences
- `ai_generation_logs` - Audit trail

### Indexes (11)
- `idx_project_documents_project`
- `idx_project_documents_user`
- `idx_project_documents_type`
- `idx_project_documents_search` (GIN)
- `idx_project_documents_upload_date`
- `idx_ai_source_registry_type`
- `idx_ai_source_registry_domain`
- `idx_ai_source_registry_url` (UNIQUE)
- `idx_user_source_policies_project`
- `idx_ai_generation_logs_project`
- `idx_ai_generation_logs_function`

### Functions (2)
- `search_project_documents(uuid, text, integer)`
- `get_project_source_policy(uuid)`

### RLS Policies (8)
- `project_documents`: 4 policies (SELECT, INSERT, UPDATE, DELETE)
- `user_source_policies`: 2 policies (SELECT, ALL)
- `ai_generation_logs`: 2 policies (SELECT, INSERT)

### Seed Data (11 sources)
- SEC EDGAR Database (95)
- US Census Bureau (95)
- World Bank Open Data (90)
- Bureau of Labor Statistics (95)
- Federal Reserve Economic Data (95)
- Crunchbase (75)
- PitchBook (80)
- CB Insights (80)
- TechCrunch (60)
- Bloomberg (75)
- Reuters (75)

---

## ✅ Verification Checklist

Before proceeding to Week 2 UI implementation:

- [ ] Migration applied successfully (4 tables created)
- [ ] Seed data exists (11 official sources in registry)
- [ ] Full-text search function works
- [ ] Source policy function works
- [ ] RLS policies active (can query own documents)
- [ ] TypeScript imports work (no errors in `src/lib/evidence/`)

---

## 🎯 Next Steps (Week 2 Days 3-5)

Once database is deployed and verified:

### Day 3: Document Upload
- Create upload component (drag-drop PDF/CSV/XLSX)
- Install text extraction libraries: `npm install pdf-parse xlsx papaparse`
- Implement text extraction + database insert
- Show upload progress

### Day 4: Pre-Generation Modal
- Design modal UI (simple + advanced modes)
- Show planned sources BEFORE searching
- Honest messaging: "Availability unknown until search"
- Tier toggles, domain controls

### Day 5: Integration
- Connect evidence system to `scrape-and-extract` Edge Function
- Test full flow: upload → search → generate → evidence report
- Implement post-generation evidence display

---

## 📞 Support

If you run into issues:

1. Check `PHASE_0_5_IMPLEMENTATION_STATUS.md` for implementation details
2. Check `src/lib/evidence/README.md` for usage examples
3. Review TypeScript types in `src/lib/evidence/types/index.ts`
4. Check browser console for errors
5. Check Supabase logs in Dashboard → Logs

---

**Deployment Date:** 2026-02-07
**Phase:** 0.5 (Days 1-2 Complete)
**Status:** Database infrastructure ready for UI integration
