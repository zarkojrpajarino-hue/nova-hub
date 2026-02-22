# AI Evidence System - Usage Guide

## Quick Start

The AI Evidence System provides transparent, auditable evidence backing for AI-generated content.

### Basic Flow

```typescript
import { searchEvidenceSources, getProjectSourcePolicy } from '@/lib/evidence/retrievers/master-retriever';
import { validateEvidenceContract } from '@/lib/evidence/validators/evidence-validator';

// 1. Get user's source policy
const policy = await getProjectSourcePolicy(projectId);

// 2. Search for evidence
const searchResults = await searchEvidenceSources(
  'SaaS market size in US 2025',
  policy,
  {
    userId: user.id,
    projectId: project.id,
    country: 'US',
    userEmail: user.email
  }
);

console.log(`Found ${searchResults.sources_found.length} sources`);
console.log(`Tier 1 (user docs): ${searchResults.tier_1_count}`);
console.log(`Tier 2 (official): ${searchResults.tier_2_count}`);
console.log(`Avg reliability: ${searchResults.avg_reliability_score}`);

// 3. Use sources to generate with evidence
// (Integration with AI generation in Week 2)
```

## Source Tiers (Priority Order)

### Tier 1: User Documents (Highest Priority)
**Reliability:** 100 (user's own data)
**Quote Level:** exact

```typescript
import { searchUserDocuments, extractCitations } from '@/lib/evidence/retrievers/user-documents';

// Search user's uploaded PDFs, CSVs, XLSX
const userDocs = await searchUserDocuments(
  'revenue projections',
  userId,
  projectId,
  5 // limit
);

// Extract precise citations
for (const doc of userDocs) {
  const citations = await extractCitations(doc, 'revenue');
  citations.forEach(c => {
    console.log(`Quote: "${c.quote}"`);
    console.log(`Location: Page ${c.location.page}, Paragraph ${c.location.paragraph}`);
  });
}
```

### Tier 2: Official APIs
**Reliability:** 90-95
**Quote Level:** exact

```typescript
import { searchOfficialSources } from '@/lib/evidence/retrievers/official-sources';

// Searches SEC, World Bank, Census, BLS based on query intent
const officialData = await searchOfficialSources(
  'US GDP growth rate 2024',
  'US',
  userEmail
);
```

#### Specific API Searches

```typescript
import {
  searchSEC,
  searchWorldBank,
  searchCensus,
  searchBLS
} from '@/lib/evidence/retrievers/official-sources';

// SEC filings for a company
const secFilings = await searchSEC('0000789019', userEmail); // Microsoft CIK

// World Bank indicators
const gdpData = await searchWorldBank(
  'NY.GDP.MKTP.CD', // Indicator ID for GDP
  'US',             // Country code
  5                 // Years
);

// Census data
const censusData = await searchCensus('population California');

// BLS employment data
const blsData = await searchBLS('LNS14000000'); // Unemployment rate series
```

### Tier 3: Business Data (TODO)
**Reliability:** 75-80
**Quote Level:** snippet or exact

Coming in Week 2:
- Crunchbase startup data
- PitchBook VC/PE data
- CB Insights market intelligence

### Tier 4: News (TODO)
**Reliability:** 60-75
**Quote Level:** snippet

Coming in Week 2:
- TechCrunch, Bloomberg, Reuters
- Requires multiple source confirmation
- Disabled by default

## Source Policies

Control which sources to use per project:

```typescript
import { updateProjectSourcePolicy } from '@/lib/evidence/retrievers/master-retriever';

// Update policy for a project
await updateProjectSourcePolicy(projectId, {
  evidence_mode: 'strict',      // 'strict' | 'balanced' | 'hypothesis'

  tier_1_enabled: true,         // User documents
  tier_2_enabled: true,         // Official APIs
  tier_3_enabled: false,        // Business data
  tier_4_enabled: false,        // News

  blocked_domains: ['example.com'],
  allowed_domains: [],          // Empty = all allowed (except blocked)

  max_source_age_days: 180,     // Only sources from last 6 months
  min_reliability_score: 70,    // Minimum 70/100 reliability
  require_https: true
});
```

## Evidence Modes

### Strict Mode
- Requires evidence contract to be met
- Blocks generation if insufficient sources
- Only accepts `exact` quote levels
- Recommended for: Financial Projections, Legal Documents

```typescript
const contract: EvidenceContract = {
  function_name: 'financial-projections',
  mode: 'strict',

  claims: [
    {
      id: 'market_growth_rate',
      claim_text: 'Market growth rate for target segment',
      field_path: 'market_analysis.growth_rate',
      value_type: 'percentage',
      requires_evidence: true,
      sources_min: 3,              // Need 3 independent sources
      max_age_days: 180,           // Data must be < 6 months old
      requires_independence: true  // Must be from different domains
    }
  ],

  min_total_sources: 5,
  require_tier_1_or_2: true,      // Must have user doc OR official API
  allow_partial_evidence: false,  // 100% coverage required
  block_on_failure: true
};

// Validate evidence against contract
const validation = validateEvidenceContract(claims, sources, contract);

if (!validation.passes) {
  console.log(`Failed: ${validation.reason}`);
  console.log(`Coverage: ${validation.coverage}%`);

  // Show exit options to user
  validation.exitOptions?.options.forEach(option => {
    console.log(`- ${option.label}: ${option.description}`);
  });
}
```

### Balanced Mode (Default)
- Tries to find evidence, proceeds with warnings if partial
- Accepts `exact` and `snippet` quote levels
- Recommended for: Business Model Canvas, Market Research

### Hypothesis Mode
- Fast generation, no evidence required
- Clearly marks output as hypothesis
- Recommended for: Brainstorming, Early-stage Ideation

## Evidence Validation

### Check Source Independence

```typescript
import { validateSourceIndependence } from '@/lib/evidence/retrievers/master-retriever';

const independence = validateSourceIndependence(sources);

if (!independence.isIndependent) {
  console.log('Warning: Some sources share domains or parent organizations');
  console.log('Duplicate domains:', independence.duplicateDomains);
}

console.log('Unique domains:', independence.uniqueDomains);
```

### Detect Conflicts

```typescript
import { detectEvidenceConflicts } from '@/lib/evidence/validators/evidence-validator';

const conflicts = detectEvidenceConflicts(claims);

conflicts.forEach(conflict => {
  console.log(`Conflict in claim: ${conflict.claim_id}`);
  console.log('Conflicting values:');
  conflict.conflicting_values.forEach(cv => {
    console.log(`  - ${cv.value} (${cv.citations.length} sources)`);
  });

  if (conflict.resolution) {
    console.log(`Resolution (${conflict.resolution_type}): ${conflict.resolution}`);
  }
});
```

### Calculate Coverage

```typescript
import { calculateCoverage, getEvidenceStatus } from '@/lib/evidence/types';

const coverage = calculateCoverage(claims);
console.log(`Evidence coverage: ${coverage}%`);

const status = getEvidenceStatus(claims, conflicts);
console.log(`Evidence status: ${status}`);
// 'evidence_backed' | 'partial_evidence' | 'no_evidence' | 'conflicting'
```

## Type Definitions

All types are exported from `@/lib/evidence/types`:

```typescript
import type {
  RealSource,
  Citation,
  ClaimWithEvidence,
  EvidenceStatus,
  EvidenceMode,
  SourcePolicy,
  EvidenceContract,
  SearchResults,
  AIOutputWithEvidence,
  EvidenceReport
} from '@/lib/evidence/types';
```

## Example: Complete Evidence Flow

```typescript
import {
  searchEvidenceSources,
  getProjectSourcePolicy
} from '@/lib/evidence/retrievers/master-retriever';
import {
  validateEvidenceContract,
  detectEvidenceConflicts
} from '@/lib/evidence/validators/evidence-validator';
import {
  calculateCoverage,
  getEvidenceStatus
} from '@/lib/evidence/types';

async function generateWithEvidence(
  functionName: string,
  query: string,
  projectId: string,
  userId: string,
  contract?: EvidenceContract
) {
  // 1. Get source policy
  const policy = await getProjectSourcePolicy(projectId);

  // 2. Search for sources
  const searchResults = await searchEvidenceSources(
    query,
    policy,
    { userId, projectId, country: 'US' }
  );

  console.log(`Found ${searchResults.sources_found.length} sources in ${searchResults.search_duration_ms}ms`);

  // 3. If strict mode, validate contract
  if (contract && policy.evidence_mode === 'strict') {
    // (Build claims from sources - implementation in Week 2)
    const claims: ClaimWithEvidence[] = []; // TODO: Extract from sources

    const validation = validateEvidenceContract(
      claims,
      searchResults.sources_found,
      contract
    );

    if (!validation.passes) {
      // Show exit options to user
      return {
        success: false,
        reason: validation.reason,
        exitOptions: validation.exitOptions
      };
    }
  }

  // 4. Generate AI output with sources
  // (Integration with AI generator in Week 2)

  // 5. Build evidence report
  const claims: ClaimWithEvidence[] = []; // TODO: From AI output
  const conflicts = detectEvidenceConflicts(claims);
  const coverage = calculateCoverage(claims);
  const status = getEvidenceStatus(claims, conflicts);

  return {
    success: true,
    content: {}, // Generated content
    evidence: {
      sources: searchResults.sources_found,
      claims,
      conflicts,
      coverage,
      status,
      search_duration_ms: searchResults.search_duration_ms
    }
  };
}
```

## Database Schema

### Upload a Document

```typescript
import { supabase } from '@/integrations/supabase/client';

// Extract text from PDF/XLSX first (implementation in Week 2)
const extractedText = await extractTextFromFile(file);

// Insert into database
const { data, error } = await supabase
  .from('project_documents')
  .insert({
    project_id: projectId,
    user_id: userId,
    name: file.name,
    file_type: file.type,
    file_size_bytes: file.size,
    raw_content: extractedText,
    content_language: 'simple', // or detect language
    pages_count: pdfPagesCount
  });
```

### Search Documents

```typescript
// Using the helper function
const { data, error } = await supabase
  .rpc('search_project_documents', {
    p_project_id: projectId,
    p_query: 'market size',
    p_limit: 10
  });
```

## Audit Trail

All generations are logged:

```typescript
const { data, error } = await supabase
  .from('ai_generation_logs')
  .insert({
    project_id: projectId,
    user_id: userId,
    function_name: 'business-model-canvas',
    evidence_mode: policy.evidence_mode,
    planned_sources: searchResults.sources_found.map(s => s.id),
    sources_found: searchResults.sources_found,
    claims_made: claims,
    evidence_status: status,
    coverage_percentage: coverage,
    search_duration_ms: searchResults.search_duration_ms,
    generated_content: output
  });
```

## Best Practices

### ✅ DO

1. **Always search before generating** (in balanced/strict modes)
2. **Show source plan before searching** (honest about unknowns)
3. **Filter by user policy** (respect tier toggles, domain blocks)
4. **Check source independence** (different domains/orgs)
5. **Detect and resolve conflicts** (show ranges or scenarios)
6. **Log everything** (audit trail for compliance)

### ❌ DON'T

1. **Never invent sources** (if none found, say `no_evidence`)
2. **Never promise source counts** before searching
3. **Never mix reliability and authority** (separate scores)
4. **Never ignore user's policy** (respect blocked domains)
5. **Never skip conflict detection** (show all disagreements)
6. **Never use 'verified' terminology** (use 'evidence_backed')

## Coming in Week 2

- Document upload UI with drag-drop
- PDF/CSV/XLSX text extraction
- Pre-generation modal with source plan
- Integration with AI generators
- Post-generation evidence report UI
- Tier 3 (Business data) and Tier 4 (News) retrievers

---

**Current Status:** Phase 0.5 Days 1-2 Complete (Database + Core Retrieval)

**Next:** Days 3-5 (UI + Integration)
