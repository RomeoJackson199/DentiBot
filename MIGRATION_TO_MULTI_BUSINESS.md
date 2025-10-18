# Migration to Multi-Business Platform

## What Changed

The database has been completely rebuilt from a dentist-specific system to a **generic multi-business appointment booking platform**.

### Old Schema (Dentist-Only)
- `dentists` table
- `patients` table  
- `clinic_settings` table
- Dentist-specific appointments

### New Schema (Multi-Business)
- `businesses` - Any type of service business
- `business_members` - Tenant-specific roles (owner, admin, provider, staff, customer)
- `services` - Services offered by each business
- `providers` - Service providers within a business
- `appointments` - Generic appointments with strict tenant isolation
- `profiles` - User profiles (no roles stored here)
- `user_roles` - Global platform roles (admin, provider, customer, staff)

## Data Isolation

**Each business is completely isolated:**
- One user account can be a member of multiple businesses
- Each business membership gets its own `business_members` record
- RLS policies ensure you can ONLY see data for the business you're currently viewing
- All queries must filter by `business_id`

## Components Needing Rebuild

The following components query old tables and need to be rebuilt:

### Broken Components (Old Dentist Schema)
- `AppointmentBooking.tsx` - Queries `dentists` table
- `ClinicalToday.tsx` - Queries old appointments
- `DentistRecommendations.tsx` - Queries `dentists` 
- `EmergencyBookingFlow.tsx` - Queries `dentists`
- `EmergencyTriageForm.tsx` - Queries `dentists`
- `HealthData.tsx` - Queries old appointments
- `NextAppointmentWidget.tsx` - Queries old appointments
- All other dentist-specific components

### How to Rebuild

1. **Get business context:**
```typescript
import { useBusinessContext } from '@/hooks/useBusinessContext';

const { businessInfo, loading } = useBusinessContext();
const businessId = businessInfo?.businessId;
```

2. **Query with business filter:**
```typescript
// Get providers for this business
const { data: providers } = await supabase
  .from('providers')
  .select('*, profiles(*)')
  .eq('business_id', businessId);

// Get appointments for this business
const { data: appointments } = await supabase
  .from('appointments')
  .select('*, services(*), providers(*), profiles!customer_profile_id(*)')
  .eq('business_id', businessId);
```

3. **Check membership role:**
```typescript
const { data: membership } = await supabase
  .from('business_members')
  .select('role')
  .eq('business_id', businessId)
  .eq('profile_id', userProfileId)
  .maybeSingle();

const isOwnerOrAdmin = ['owner', 'admin'].includes(membership?.role);
```

## New Features

- **Multi-tenant:** Support unlimited businesses
- **Generic:** Works for any service business (dentists, lawyers, consultants, etc.)
- **Secure:** Strict RLS with security-definer functions
- **Role-based:** Global + business-specific roles
- **Public booking:** Edge functions for public business pages

## Next Steps

Rebuild components one by one using the new schema, starting with:
1. Business selection/creation UI
2. Generic appointment booking
3. Provider management
4. Service management
5. Customer portal
