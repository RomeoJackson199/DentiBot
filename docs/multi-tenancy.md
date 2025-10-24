# Multi-Tenancy Architecture

This document explains the multi-tenancy implementation in Dentibot, using Supabase/PostgreSQL with Row-Level Security (RLS).

## Overview

Dentibot supports multiple dental clinics (businesses) in a single database using:
- **Business-scoped tables**: All tenant data includes a `business_id` column
- **Row-Level Security (RLS)**: PostgreSQL policies enforce business-level data isolation
- **JWT/Session context**: Current business is stored in JWT claims and/or `session_business` table
- **Membership model**: Users can belong to multiple businesses with different roles

## Key Components

### 1. Database Schema

#### Business Members Table
```sql
CREATE TABLE business_members (
  id uuid PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id),
  business_id uuid REFERENCES businesses(id),
  role text CHECK (role IN ('owner', 'admin', 'dentist', 'assistant', 'staff')),
  UNIQUE(profile_id, business_id)
);
```

#### Business-Scoped Tables
All tenant tables have `business_id` column:
- `appointments`
- `medical_records`
- `treatment_plans`
- `payment_requests`
- `dentist_availability`
- `dentist_vacation_days`
- `appointment_slots`

### 2. RLS Policies

Example policy for appointments:
```sql
CREATE POLICY "Business members can view appointments"
  ON appointments FOR SELECT
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM profiles WHERE user_id = auth.uid()),
      business_id
    )
  );
```

### 3. Helper Functions

#### `get_current_business_id()`
Returns the current business ID from JWT claim or `session_business` table.

#### `is_business_member(profile_id, business_id)`
Security definer function to check if a user is a member of a business.

## Frontend Integration

### 1. Business Context Hook

```typescript
import { useBusinessContext } from '@/hooks/useBusinessContext';

function MyComponent() {
  const { 
    businessId,        // Current business ID
    businessName,      // Current business name
    membershipRole,    // User's role in current business
    memberships,       // All businesses user belongs to
    switchBusiness     // Function to switch business
  } = useBusinessContext();
  
  // Use businessId in queries
}
```

### 2. Business-Scoped Queries

#### Option A: Manual filtering
```typescript
const { data } = await supabase
  .from('appointments')
  .select('*')
  .eq('business_id', businessId);
```

#### Option B: Helper utilities
```typescript
import { getBusinessScopedQuery, addBusinessContext } from '@/lib/businessScopedSupabase';

// Read
const query = await getBusinessScopedQuery('appointments');
const { data } = await query.select('*');

// Write
const newAppointment = await addBusinessContext({
  patient_id: '...',
  dentist_id: '...',
  // business_id is automatically added
});

await supabase.from('appointments').insert(newAppointment);
```

### 3. Business Selector Component

```typescript
import { BusinessSelector } from '@/components/BusinessSelector';

// In navigation/header
<BusinessSelector />
```

Shows dropdown for users with multiple businesses.

### 4. Business Picker on Login

For users with multiple memberships, `useBusinessContext` automatically:
1. Loads all memberships
2. Auto-selects first business if none selected
3. Calls `set-current-business` edge function to stamp JWT

## Edge Function: set-current-business

**Endpoint**: `POST /functions/v1/set-current-business`

**Request**:
```json
{
  "businessId": "uuid",
  // OR
  "businessSlug": "clinic-name"
}
```

**Response**:
```json
{
  "success": true,
  "businessId": "uuid",
  "role": "dentist",
  "message": "Business context set successfully"
}
```

**What it does**:
1. Validates user is a member of the business
2. Updates `session_business` table
3. Returns business context

## Adding a New Tenant Table

When adding a new table that should be business-scoped:

1. **Add `business_id` column**:
```sql
ALTER TABLE my_new_table ADD COLUMN business_id uuid REFERENCES businesses(id) NOT NULL;
CREATE INDEX idx_my_new_table_business ON my_new_table(business_id);
```

2. **Create RLS policies**:
```sql
CREATE POLICY "Business members can access"
  ON my_new_table FOR ALL
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM profiles WHERE user_id = auth.uid()),
      business_id
    )
  );
```

3. **Update frontend**:
- Add table name to `BUSINESS_SCOPED_TABLES` in `src/lib/businessScopedSupabase.ts`
- Use business context in queries

## Security Considerations

### ✅ DO:
- Always filter by `business_id` in queries
- Use RLS policies on all tenant tables
- Validate business membership before operations
- Use `getBusinessScopedQuery` helper for consistency

### ❌ DON'T:
- Trust client-provided `business_id` values
- Bypass RLS with service role key in client code
- Store sensitive business data in JWT (use session table)
- Allow users to see other businesses' data

## Testing Multi-Tenancy

### Test Cases:
1. **Cross-tenant isolation**: User A (Business X) cannot read/write Business Y data
2. **Business switching**: Switching business updates context and grants correct access
3. **Public endpoints**: Public booking routes work correctly with business slug
4. **Membership validation**: Non-members cannot access business data

### Test Query:
```sql
-- As User A, try to access Business B data (should return 0 rows)
SELECT * FROM appointments WHERE business_id = '<business-b-id>';
```

## Troubleshooting

### "No business context set" error
- User hasn't selected a business yet
- Call `switchBusiness(businessId)` from `useBusinessContext`

### Queries return empty results
- Check RLS policies are correctly filtering by `business_id`
- Verify user is a member: `SELECT * FROM business_members WHERE profile_id = '...'`
- Check session: `SELECT * FROM session_business WHERE user_id = auth.uid()`

### Can't insert records
- Ensure `business_id` is included in insert data
- Use `addBusinessContext()` helper to automatically add it

## Migration Rollback

If you need to rollback multi-tenancy:

```sql
-- Remove business_id columns
ALTER TABLE appointments DROP COLUMN business_id;
ALTER TABLE medical_records DROP COLUMN business_id;
-- etc.

-- Drop business_members table
DROP TABLE business_members CASCADE;

-- Drop helper functions
DROP FUNCTION get_current_business_id();
DROP FUNCTION is_business_member(uuid, uuid);

-- Restore old RLS policies (see migration backup)
```

## Performance Considerations

- All tenant tables have indexes on `business_id`
- RLS policies use security definer functions to avoid N+1 queries
- Session business is cached in memory by frontend context
- Consider partitioning for very large datasets (>10M rows per table)

## Future Enhancements

- Business-level settings and customization
- Cross-business reporting (with explicit permission)
- Business invitations and onboarding flow
- Audit logging per business
