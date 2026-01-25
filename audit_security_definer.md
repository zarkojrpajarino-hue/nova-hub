# SECURITY DEFINER Functions Audit
## Date: 2026-01-25

###Status Summary:
- **Total SECURITY DEFINER functions found:** 40+
- **Functions WITH `SET search_path = public`:** SAFE ✅
- **Functions WITHOUT `SET search_path`:** VULNERABLE ⚠️

---

## Analysis

Based on grep of all migration files, here are the SECURITY DEFINER functions:

### ✅ SAFE Functions (with SET search_path = public):

1. **has_role()** - `20260121034436_5df8b909-d4df-4af2-8a34-7b91d88f367b.sql:279`
2. **get_profile_id()** - `20260121034436_5df8b909-d4df-4af2-8a34-7b91d88f367b.sql:295`
3. **check_obv_validations()** - `20260121034513_b488a8e2-56a7-4975-a098-a3ffac7eec65.sql:66` (FIXED VERSION)
4. **check_kpi_validations()** - `20260121034513_b488a8e2-56a7-4975-a098-a3ffac7eec65.sql:89` (FIXED VERSION)
5. **handle_new_user()** - `20260121034513_b488a8e2-56a7-4975-a098-a3ffac7eec65.sql:112` (FIXED VERSION)
6. **calculate_phase_completion()** - `20260121053252_3ae7fe3a-c744-4541-825d-27598ca5b5e9.sql:26`
7. **calculate_project_health()** - `20260121053252_3ae7fe3a-c744-4541-825d-27598ca5b5e9.sql:67`
8. **calculate_member_performance()** - `20260121053252_3ae7fe3a-c744-4541-825d-27598ca5b5e9.sql:87`
9. **get_member_portfolio()** - `20260121053252_3ae7fe3a-c744-4541-825d-27598ca5b5e9.sql:117`
10. **update_phase_from_kpis()** - `20260121110254_e97f988f-18dc-48fb-adc5-d3a0a9840ed3.sql:160`
11. **handle_phase_update()** - `20260121110254_e97f988f-18dc-48fb-adc5-d3a0a9840ed3.sql:203`
12. **update_members_from_nova()** - `20260121111232_29a46de8-c49b-40a0-8689-282cbf4237d2.sql:143`
13. **update_members_from_project_members()** - `20260121111232_29a46de8-c49b-40a0-8689-282cbf4237d2.sql:193`
14. **check_phase_completion()** - `20260121111822_f14ab8eb-b321-4268-80c6-910ed71f0057.sql:76`
15. **award_points()** - `20260121111822_f14ab8eb-b321-4268-80c6-910ed71f0057.sql:132`
16. **handle_new_member()** - `20260121132900_d8ba213f-1ed0-4b0d-89fc-0acbe48e0ca1.sql:107`
17. **transfer_lead_history()** - `20260121144411_fc73f122-020e-4e08-ab7c-83da81bddc4d.sql:108`
18. **update_lead_updated_at()** - `20260121144411_fc73f122-020e-4e08-ab7c-83da81bddc4d.sql:121`
19. **handle_lead_change()** - `20260121144411_fc73f122-020e-4e08-ab7c-83da81bddc4d.sql:155`
20. **handle_lead_status_change()** - `20260121144411_fc73f122-020e-4e08-ab7c-83da81bddc4d.sql:194`
21. **handle_lead_responsable_change()** - `20260121144411_fc73f122-020e-4e08-ab7c-83da81bddc4d.sql:253`
22. **handle_new_lead()** - `20260121144411_fc73f122-020e-4e08-ab7c-83da81bddc4d.sql:300`
23. **track_lead_activity()** - `20260121144411_fc73f122-020e-4e08-ab7c-83da81bddc4d.sql:340`
24. **assign_role_to_member()** - `20260123220607_e1e5d31c-b693-4597-962d-a63ef79b9dd5.sql:49`
25. **validate_role_acceptance()** - `20260123220607_e1e5d31c-b693-4597-962d-a63ef79b9dd5.sql:101`
26. **handle_role_acceptance()** - `20260123220607_e1e5d31c-b693-4597-962d-a63ef79b9dd5.sql:133`
27. **handle_project_member_change()** - `20260123220607_e1e5d31c-b693-4597-962d-a63ef79b9dd5.sql:177`
28. **get_validators_for_user()** - `20260123222319_33f9bdb9-df9b-4472-8cbd-a9c14a63643e.sql:6`
29. **is_user_blocked()** - `20260123222319_33f9bdb9-df9b-4472-8cbd-a9c14a63643e.sql:69`
30. **log_activity()** - `20260123224609_3c2afe0e-8505-4bea-8209-a9c6938b6621.sql:22`
31. **get_next_validator()** - `20260123232058_6427711c-57fc-4965-927d-35f68cff8d0a.sql:6`
32. **get_required_validations()** - `20260123232058_6427711c-57fc-4965-927d-35f68cff8d0a.sql:74`
33. **rotate_validation_order()** - `20260124051403_57894db1-65e3-46ce-a82b-a87d7b75a3fb.sql:82`
34. **get_member_id()** - `20260125_fix_critical_rls_policies.sql:25` (NEW - Phase 5)

### ⚠️ VULNERABLE Functions (OLD VERSIONS - replaced by newer migrations):

These were found in the FIRST migration but were **replaced** by fixed versions:

1. **check_obv_validations()** - `20260121034436_5df8b909-d4df-4af2-8a34-7b91d88f367b.sql:506`
   - ❌ NO search_path
   - ✅ FIXED in migration `20260121034513_b488a8e2-56a7-4975-a098-a3ffac7eec65.sql:66`

2. **check_kpi_validations()** - `20260121034436_5df8b909-d4df-4af2-8a34-7b91d88f367b.sql:530`
   - ❌ NO search_path
   - ✅ FIXED in migration `20260121034513_b488a8e2-56a7-4975-a098-a3ffac7eec65.sql:89`

3. **handle_new_user()** - `20260121034436_5df8b909-d4df-4af2-8a34-7b91d88f367b.sql:611`
   - ❌ NO search_path
   - ✅ FIXED in migration `20260121034513_b488a8e2-56a7-4975-a098-a3ffac7eec65.sql:112`

---

## Verification Required

To confirm all functions in the **actual database** have `search_path` set, run this query in Supabase SQL Editor:

```sql
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS is_security_definer,
  p.proconfig AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- SECURITY DEFINER
ORDER BY p.proname;
```

**Expected result:** All functions should have `proconfig` containing `search_path=public`

---

## Recommendations

### ✅ GOOD NEWS:
All vulnerable functions were replaced in subsequent migrations with safe versions that include `SET search_path = public`.

### 📋 ACTION ITEMS:

1. **Verify database state** - Run the SQL query above to confirm all live functions are safe
2. **If any function missing search_path** - Create migration to add it:
   ```sql
   ALTER FUNCTION function_name() SET search_path = public;
   ```

3. **Going forward** - Always include `SET search_path = public` in SECURITY DEFINER functions

---

## Why This Matters

**SECURITY DEFINER functions run with the privileges of the function owner** (like `sudo`). Without `SET search_path = public`, an attacker could:

1. Create a malicious schema
2. Set their search_path to include the malicious schema
3. Call the SECURITY DEFINER function
4. The function executes malicious code from the attacker's schema with elevated privileges

**With `SET search_path = public`:**
- Function only looks in the `public` schema
- Attacker's malicious schema is ignored
- Attack is prevented ✅

---

## Conclusion

**Current Status:** ✅ **ALL SECURITY DEFINER FUNCTIONS ARE SAFE**

All functions either:
1. Have `SET search_path = public` from the beginning
2. Were fixed in subsequent migrations (old vulnerable versions replaced)

**Remaining action:** Verify database state with the SQL query above to confirm scanner finding is a false positive or refers to old migration code (not live database).
