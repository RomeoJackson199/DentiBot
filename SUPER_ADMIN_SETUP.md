# Super Admin Dashboard Setup Guide

## Overview

The Super Admin Dashboard provides comprehensive oversight and management capabilities for the entire Caberu platform. This includes:

- **System Overview**: Real-time statistics and health metrics
- **Business Management**: View all businesses, create businesses on behalf of users
- **User Management**: Search and view all users across all businesses
- **Error Tracking**: Monitor and resolve system errors
- **Audit Logging**: Complete audit trail of all super admin actions

## Access

The Super Admin Dashboard is accessible at: **`/super-admin`**

Only users with the `super_admin` role can access this dashboard. All other users will be redirected to the home page.

## Initial Setup

### 1. Run Database Migration

First, apply the database migration that creates the necessary tables and functions:

```bash
# Using Supabase CLI
supabase db push
```

Or manually run the migration file:
```
supabase/migrations/20251110000000_add_super_admin_system.sql
```

### 2. Grant Super Admin Role

To make a user a super admin, you need to insert a record into the `user_roles` table:

**Option A: Using Supabase Dashboard**

1. Go to your Supabase Dashboard
2. Navigate to Table Editor → `user_roles`
3. Click "Insert row"
4. Fill in:
   - `user_id`: The UUID of the user (from `auth.users` table)
   - `role`: Select `super_admin`
5. Click "Save"

**Option B: Using SQL**

```sql
-- Replace 'user-email@example.com' with the actual email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE email = 'user-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

**Option C: Using Edge Function (Recommended)**

Create and run the following edge function:

```bash
# Create the function
supabase functions new make-super-admin

# Deploy it
supabase functions deploy make-super-admin
```

Edge function code:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { email } = await req.json()

  // Get user by email
  const { data: user } = await supabaseAdmin.auth.admin.getUserByEmail(email)

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'User not found' }),
      { status: 404 }
    )
  }

  // Add super_admin role
  const { error } = await supabaseAdmin
    .from('user_roles')
    .insert({
      user_id: user.id,
      role: 'super_admin'
    })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }

  return new Response(
    JSON.stringify({ success: true, message: `${email} is now a super admin` }),
    { status: 200 }
  )
})
```

### 3. Verify Access

1. Log in as the user you granted super admin role to
2. Navigate to `/super-admin`
3. You should see the Super Admin Dashboard

## Features

### 1. System Overview
- View platform-wide statistics
- Monitor system health
- Track growth metrics
- Quick access to common tasks

### 2. Business Management
- View all businesses with key metrics:
  - Member count
  - Patient count
  - Appointment statistics
  - Active status
- Search and filter businesses
- Create new businesses on behalf of users
- View business creation date and owner information

### 3. User Management
- View all users across all businesses
- Search by name, email, or phone
- See user's business memberships and roles
- Expandable rows to view detailed business associations

### 4. Error Tracking
- Monitor system errors in real-time
- Filter by resolved/unresolved status
- View error details including:
  - Stack traces
  - User and business context
  - Severity levels (low, medium, high, critical)
  - URLs and metadata
- Mark errors as resolved
- Track resolution history

### 5. Audit Logging
- Complete audit trail of all super admin actions
- View who performed what action and when
- See IP addresses and user agents
- Track resource changes with full details
- Permanent, tamper-proof logging

## Creating a Business for a User

1. Navigate to the "Businesses" tab
2. Click "Create Business" button
3. Fill in the form:
   - Business name
   - Owner's first and last name
   - Owner's email (invitation will be sent)
   - Business type (dental, medical, salon, wellness)
   - Template type
4. Click "Create Business"

The system will:
- Create the business record
- Create or link the owner's profile
- Send an invitation email to the owner
- Add the owner as a business member with 'owner' role
- Log the action in the audit log

## Error Reporting

Throughout the application, you can report errors to the super admin dashboard using the `useReportError` hook:

```typescript
import { useReportError } from '@/hooks/useSuperAdmin';

const reportError = useReportError();

try {
  // Your code
} catch (error) {
  reportError.mutate({
    error_type: 'API_ERROR',
    error_message: error.message,
    stack_trace: error.stack,
    severity: 'high',
    metadata: { /* additional context */ }
  });
}
```

## Security Considerations

- All super admin actions are logged with user identity, timestamp, and IP address
- Audit logs cannot be deleted or modified
- Access is strictly controlled by the `is_super_admin()` function
- Row-level security ensures only super admins can view sensitive data
- Consider implementing:
  - Two-factor authentication for super admin accounts
  - IP whitelisting
  - Session timeout policies
  - Regular security audits

## Database Tables

### `super_admin_audit_log`
Stores all super admin actions with full context.

### `system_errors`
Stores application errors with severity levels, resolution status, and metadata.

### `user_roles`
Extended to include `super_admin` role type.

## Functions

### `is_super_admin()`
Returns true if the current user has super admin privileges.

### `get_all_businesses_admin()`
Returns all businesses with aggregated metrics.

### `get_all_users_admin(search_query)`
Returns all users with their business memberships and roles.

### `get_system_stats()`
Returns platform-wide statistics.

### `log_super_admin_action(...)`
Logs a super admin action to the audit trail.

## Troubleshooting

### "Access denied. Super admin privileges required."
- Verify the user has the `super_admin` role in the `user_roles` table
- Check that the user is logged in
- Ensure the migration was applied successfully

### Dashboard not loading
- Check browser console for errors
- Verify all component files are present
- Check that the route is properly configured in `App.tsx`

### Can't create businesses
- Verify the `create-healthcare-business` edge function is deployed
- Check Supabase function logs for errors
- Ensure the user has proper permissions

## Support

For issues or questions about the Super Admin Dashboard, contact the development team or check the project documentation.

## Changelog

- **2025-11-10**: Initial super admin dashboard implementation
  - System overview with real-time stats
  - Business management with creation capabilities
  - User management across all businesses
  - Error tracking and resolution
  - Complete audit logging system
