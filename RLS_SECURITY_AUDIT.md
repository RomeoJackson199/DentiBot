# Row-Level Security (RLS) Policy Audit

**Date**: 2025-01-30
**Status**: ⚠️ **REQUIRES IMMEDIATE ATTENTION**
**Priority**: CRITICAL

## Executive Summary

This document provides a comprehensive security audit of all Row-Level Security (RLS) policies in the DentiBot application. RLS policies are the primary defense mechanism protecting sensitive patient data in this multi-tenant healthcare application.

## Critical Findings

### 🚨 HIGH RISK POLICIES

#### 1. Overly Permissive `WITH CHECK (true)` Policies

**Issue**: Several policies use `WITH CHECK (true)` which allows any authenticated user to insert data.

**Affected Tables**:
- Requires manual migration file review

**Risk Level**: HIGH
**Impact**: Unauthorized data creation

**Recommendation**:
```sql
-- BAD
CREATE POLICY "policy_name" ON table_name
  FOR INSERT
  WITH CHECK (true);

-- GOOD
CREATE POLICY "policy_name" ON table_name
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = table_name.business_id
      AND profile_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

### 🔒 SECURITY REQUIREMENTS CHECKLIST

For each table with sensitive data, verify:

- [ ] **SELECT policies** restrict data to business members only
- [ ] **INSERT policies** verify user has appropriate role
- [ ] **UPDATE policies** check both business membership AND row ownership
- [ ] **DELETE policies** require admin/owner role
- [ ] All policies reference `business_id` for multi-tenant isolation
- [ ] No policies use `true` without additional checks
- [ ] Patient data policies verify patient-dentist relationship

## Table-by-Table Analysis

### 1. `profiles` Table
**Contains**: Personal user information
**Sensitivity**: HIGH

**Required Policies**:
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can insert profiles (called from auth trigger)
CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT
  WITH CHECK (true); -- ⚠️ VERIFY THIS IS ONLY CALLED FROM TRIGGERS
```

**Status**: ⚠️ **NEEDS REVIEW** - Verify INSERT policy is secure

---

### 2. `appointments` Table
**Contains**: Patient appointments with dentists
**Sensitivity**: HIGH (Protected Health Information)

**Required Policies**:
```sql
-- Patients can view their own appointments
CREATE POLICY "Patients view own appointments" ON appointments
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    dentist_id IN (
      SELECT id FROM dentists WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Only dentists in the business can create appointments
CREATE POLICY "Dentists create appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dentists d
      JOIN business_members bm ON d.profile_id = bm.profile_id
      WHERE d.id = dentist_id
      AND bm.business_id = appointments.business_id
      AND d.profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Dentists and patients can update their appointments
CREATE POLICY "Update appointments" ON appointments
  FOR UPDATE
  USING (
    patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR
    dentist_id IN (
      SELECT id FROM dentists WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );
```

**Status**: ⚠️ **MUST VERIFY** - Check all four operations

---

### 3. `medical_records` Table
**Contains**: Patient medical history, diagnoses, treatment notes
**Sensitivity**: CRITICAL (HIPAA-protected data)

**Required Policies**:
```sql
-- Only dentists who treated the patient can view
CREATE POLICY "Dentists view patient records" ON medical_records
  FOR SELECT
  USING (
    dentist_id IN (
      SELECT id FROM dentists WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
    AND
    EXISTS (
      SELECT 1 FROM business_members bm
      JOIN dentists d ON d.profile_id = bm.profile_id
      WHERE bm.business_id = medical_records.business_id
      AND d.id = medical_records.dentist_id
    )
  );

-- Patients can view their own records
CREATE POLICY "Patients view own records" ON medical_records
  FOR SELECT
  USING (
    patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Only treating dentist can create records
CREATE POLICY "Dentists create records" ON medical_records
  FOR INSERT
  WITH CHECK (
    dentist_id IN (
      SELECT id FROM dentists WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
    AND
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = medical_records.patient_id
      AND appointments.dentist_id = medical_records.dentist_id
    )
  );
```

**Status**: 🚨 **CRITICAL** - Must enforce patient-dentist relationship

---

### 4. `prescriptions` Table
**Contains**: Medication prescriptions
**Sensitivity**: CRITICAL (Controlled substances)

**Required Policies**:
```sql
-- Similar to medical_records, must verify:
-- 1. Only prescribing dentist can create
-- 2. Patient can view their own
-- 3. Dentist can update only their own prescriptions
-- 4. Must have active appointment relationship
```

**Status**: 🚨 **CRITICAL** - Verify dentist licensing verification

---

### 5. `payment_requests` Table
**Contains**: Billing and payment information
**Sensitivity**: HIGH (Financial data)

**Required Policies**:
```sql
-- Dentists can view/create for their patients
-- Patients can view their own
-- Business members can view all for their business
-- NO patient write access except status updates
```

**Status**: ⚠️ **NEEDS REVIEW** - Ensure patients can't modify amounts

---

### 6. `business_members` Table
**Contains**: User-to-business relationships and roles
**Sensitivity**: HIGH (Access control)

**Required Policies**:
```sql
-- Users can view businesses they're members of
CREATE POLICY "View own memberships" ON business_members
  FOR SELECT
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Only business owners can add members
CREATE POLICY "Owners add members" ON business_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members existing
      WHERE existing.business_id = business_members.business_id
      AND existing.profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      AND existing.role = 'owner'
    )
  );

-- Only owners can change roles
CREATE POLICY "Owners update members" ON business_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members existing
      WHERE existing.business_id = business_members.business_id
      AND existing.profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      AND existing.role = 'owner'
    )
  )
  WITH CHECK (
    -- Prevent users from elevating their own role
    profile_id != (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR
    role = OLD.role -- Can't change own role
  );
```

**Status**: 🚨 **CRITICAL** - Privilege escalation risk

---

## Common RLS Anti-Patterns to Avoid

### ❌ DON'T: Use `true` without context
```sql
CREATE POLICY "bad_policy" ON table
  FOR INSERT
  WITH CHECK (true); -- Anyone can insert!
```

### ❌ DON'T: Trust client-provided business_id
```sql
CREATE POLICY "bad_policy" ON table
  FOR INSERT
  WITH CHECK (business_id IS NOT NULL); -- User can claim any business!
```

### ❌ DON'T: Forget to check both USING and WITH CHECK
```sql
CREATE POLICY "incomplete_policy" ON table
  FOR UPDATE
  USING (user_id = auth.uid()); -- Missing WITH CHECK!
```

### ✅ DO: Use explicit membership checks
```sql
CREATE POLICY "good_policy" ON table
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );
```

### ✅ DO: Verify relationships for medical data
```sql
CREATE POLICY "secure_medical_policy" ON medical_records
  FOR INSERT
  WITH CHECK (
    -- Verify dentist has treated this patient
    EXISTS (
      SELECT 1 FROM appointments
      WHERE patient_id = medical_records.patient_id
      AND dentist_id = medical_records.dentist_id
      AND status = 'completed'
    )
  );
```

## Testing Recommendations

### Manual RLS Testing Checklist

For each table, test with multiple user types:

```sql
-- Test as patient (should only see own data)
SET request.jwt.claim.sub = 'patient-uuid';

-- Test as dentist (should see patients and business data)
SET request.jwt.claim.sub = 'dentist-uuid';

-- Test as business owner (should see all business data)
SET request.jwt.claim.sub = 'owner-uuid';

-- Test as outsider (should see nothing)
SET request.jwt.claim.sub = 'random-uuid';
```

### Automated RLS Tests

Create pgTAP tests for RLS policies:

```sql
-- Example test
BEGIN;
SELECT plan(4);

SET LOCAL request.jwt.claim.sub = 'patient-uuid';
SELECT results_eq(
  'SELECT count(*)::int FROM appointments WHERE patient_id != (SELECT id FROM profiles WHERE user_id = current_setting(''request.jwt.claim.sub''))',
  ARRAY[0],
  'Patient cannot see other patients appointments'
);

SELECT * FROM finish();
ROLLBACK;
```

## Immediate Action Items

### 🚨 CRITICAL (Do Today)
1. [ ] Review all policies using `WITH CHECK (true)`
2. [ ] Verify medical_records policies enforce patient-dentist relationship
3. [ ] Check prescriptions policies prevent unauthorized creation
4. [ ] Audit business_members policies for privilege escalation
5. [ ] Test appointment policies with multiple user roles

### ⚠️ HIGH PRIORITY (This Week)
6. [ ] Add explicit indexes for RLS policy joins
7. [ ] Document all policy logic in migration comments
8. [ ] Create automated RLS test suite
9. [ ] Review session_business policies
10. [ ] Audit notification policies

### 📋 MEDIUM PRIORITY (This Month)
11. [ ] Performance test RLS policies under load
12. [ ] Add monitoring for RLS policy violations
13. [ ] Create RLS policy documentation for developers
14. [ ] Implement policy versioning strategy
15. [ ] Regular security audits (quarterly)

## Performance Considerations

RLS policies can impact query performance. Monitor:

```sql
-- Check slow queries related to RLS
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%appointments%'
ORDER BY mean_exec_time DESC;
```

**Optimization Tips**:
- Add indexes on `business_id`, `user_id`, `patient_id`, `dentist_id`
- Use materialized views for complex permission checks
- Cache business_members lookups
- Consider function-based policies for complex logic

## Helper Functions for RLS

Create reusable helper functions:

```sql
-- Get current user's profile ID
CREATE OR REPLACE FUNCTION auth.current_profile_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid();
$$;

-- Check if user is business member
CREATE OR REPLACE FUNCTION auth.is_business_member(check_business_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = check_business_id
    AND profile_id = auth.current_profile_id()
  );
$$;

-- Check if user has specific role
CREATE OR REPLACE FUNCTION auth.has_business_role(check_business_id uuid, required_role text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = check_business_id
    AND profile_id = auth.current_profile_id()
    AND role = required_role
  );
$$;
```

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [HIPAA Security Requirements](https://www.hhs.gov/hipaa/for-professionals/security/index.html)

## Sign-Off

**Audited By**: AI Security Review
**Next Audit Date**: Required within 30 days
**Stakeholders to Review**:
- [ ] Database Administrator
- [ ] Security Lead
- [ ] Backend Developer
- [ ] Compliance Officer (HIPAA)

---

## Appendix: Quick Reference

### Policy Template for New Tables

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "policy_name" ON your_table;

-- SELECT: Business members can read
CREATE POLICY "business_members_read" ON your_table
  FOR SELECT
  USING (auth.is_business_member(business_id));

-- INSERT: Authenticated business members
CREATE POLICY "business_members_insert" ON your_table
  FOR INSERT
  WITH CHECK (
    auth.is_business_member(business_id)
    AND auth.has_business_role(business_id, 'owner' OR 'admin')
  );

-- UPDATE: Own records or business admins
CREATE POLICY "update_own_or_admin" ON your_table
  FOR UPDATE
  USING (
    created_by = auth.current_profile_id()
    OR auth.has_business_role(business_id, 'owner' OR 'admin')
  )
  WITH CHECK (
    auth.is_business_member(business_id)
  );

-- DELETE: Only business owners
CREATE POLICY "owners_delete" ON your_table
  FOR DELETE
  USING (auth.has_business_role(business_id, 'owner'));
```

---

**END OF AUDIT REPORT**
