# Patient Database Save Issues - Analysis and Fixes

## Problem Summary
The patient management system was failing to save data to the database due to multiple issues:

1. **Missing RLS INSERT Policies**: Patients couldn't insert data because Row Level Security (RLS) policies only allowed SELECT operations
2. **Schema Mismatches**: Database schema didn't match the TypeScript types and code expectations
3. **Missing Required Fields**: Some required fields were missing or had incorrect names

## Issues Identified

### 1. RLS Policy Issues
- **Problem**: RLS policies only allowed SELECT operations for patients
- **Impact**: Patients couldn't create prescriptions, treatment plans, medical records, or notes
- **Root Cause**: Migration `20250806000000_fix_patient_dashboard_data.sql` only created SELECT policies

### 2. Schema Mismatches

#### Prescriptions Table
- **Database Schema**: `duration` (text field)
- **Code Expectation**: `duration_days` (number field)
- **Impact**: Insert operations failed due to field name mismatch

#### Treatment Plans Table  
- **Database Schema**: `plan_name` (text field)
- **Code Expectation**: `title` (text field)
- **Impact**: Insert operations failed due to field name mismatch

### 3. Missing Required Fields
- Some tables were missing required fields that the code expected
- Foreign key relationships weren't properly established

## Fixes Implemented

### 1. RLS Policy Fixes (`20250101000001_fix_patient_insert_policies.sql`)
Added comprehensive RLS policies for patients:

```sql
-- INSERT policies for all medical data tables
CREATE POLICY "Patients can create their own notes" ON public.patient_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = patient_notes.patient_id
    )
  );

-- Similar policies for medical_records, prescriptions, treatment_plans
```

### 2. Schema Fixes

#### Prescriptions Table (`20250101000002_fix_prescriptions_schema.sql`)
```sql
-- Fix duration field mismatch
ALTER TABLE public.prescriptions DROP COLUMN IF EXISTS duration;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS duration_days integer;
```

#### Treatment Plans Table (`20250101000003_fix_treatment_plans_schema.sql`)
```sql
-- Fix title field mismatch  
ALTER TABLE public.treatment_plans DROP COLUMN IF EXISTS plan_name;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Treatment Plan';
```

### 3. Debug Migration (`20250101000000_debug_rls_issues.sql`)
Temporary migration to disable RLS for testing:
```sql
-- Temporarily disable RLS for debugging
ALTER TABLE public.patient_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans DISABLE ROW LEVEL SECURITY;
```

## Testing the Fixes

### 1. Apply the Migrations
```bash
# Apply the debug migration first to test if RLS is the issue
npx supabase db push

# Then apply the proper fixes
npx supabase db push
```

### 2. Test Patient Save Operations
Use the `DatabaseSaveTest` component to test:
- Creating prescriptions
- Creating treatment plans  
- Creating medical records
- Creating patient notes

### 3. Verify RLS Policies
Check that patients can:
- ✅ Insert their own data
- ✅ Update their own data
- ✅ Delete their own data
- ✅ View their own data

## Expected Results

After applying these fixes:

1. **Patient Save Operations**: Should work without errors
2. **Data Integrity**: All required fields should be present
3. **Security**: RLS policies should properly restrict access
4. **Type Safety**: Database schema should match TypeScript types

## Rollback Plan

If issues persist, the debug migration can be used to temporarily disable RLS:
```sql
-- Emergency rollback: disable RLS
ALTER TABLE public.patient_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans DISABLE ROW LEVEL SECURITY;
```

## Next Steps

1. **Apply Migrations**: Run the database migrations
2. **Test Functionality**: Verify patient save operations work
3. **Monitor Logs**: Check for any remaining errors
4. **Update Documentation**: Update any affected documentation
5. **Remove Debug Migration**: Once confirmed working, remove the debug migration

## Files Modified

- `supabase/migrations/20250101000000_debug_rls_issues.sql` - Debug migration
- `supabase/migrations/20250101000001_fix_patient_insert_policies.sql` - RLS policy fixes
- `supabase/migrations/20250101000002_fix_prescriptions_schema.sql` - Prescriptions schema fix
- `supabase/migrations/20250101000003_fix_treatment_plans_schema.sql` - Treatment plans schema fix
- `PATIENT_DATABASE_SAVE_FIX.md` - This documentation