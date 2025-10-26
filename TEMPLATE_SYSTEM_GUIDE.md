# Business Template System Guide

## Overview

The Business Template System allows businesses to customize the platform based on their industry type. Each template controls which features are available and customizes the terminology used throughout the application.

## Available Templates

### 1. Dental Clinic (Default)
- **Features**: All features enabled (prescriptions, treatment plans, medical records, etc.)
- **Terminology**: Patients, Dentists, Treatments, Clinic
- **Use Case**: Dental practices with full medical capabilities

### 2. Hair Salon
- **Features**: Services, appointments, photo upload, payments
- **Disabled**: Prescriptions, treatment plans, medical records, urgency levels
- **Terminology**: Clients, Stylists, Services, Salon
- **Use Case**: Hair salons and barbershops

### 3. Personal Training
- **Features**: Sessions, workout plans (treatment plans), progress tracking, photos
- **Disabled**: Prescriptions, medical records
- **Terminology**: Clients, Trainers, Training Packages, Gym
- **Use Case**: Personal trainers and fitness coaches

### 4. Beauty Salon
- **Features**: Services, appointments, photo portfolio, payments
- **Disabled**: Prescriptions, treatment plans, medical records
- **Terminology**: Clients, Specialists, Services, Salon
- **Use Case**: Beauty salons, spas, nail salons

### 5. Medical Practice
- **Features**: All medical features enabled
- **Terminology**: Patients, Doctors, Services, Practice
- **Use Case**: General medical practitioners, clinics

### 6. Generic Business
- **Features**: Basic appointments, services, photos, payments
- **Disabled**: All medical-specific features
- **Terminology**: Customers, Providers, Services, Business
- **Use Case**: Any other appointment-based business

## How to Use

### For New Businesses

1. During signup, users are prompted to select a business template
2. The `BusinessCreationDialog` component handles this flow:
   - Step 1: Choose template
   - Step 2: Enter business details
3. Template is saved to `businesses.template_type` in database

### For Existing Businesses

1. Go to **Admin** → **Branding & Customization**
2. Scroll to **Business Template** section
3. Select a new template (warning dialog will appear)
4. Save changes
5. **Important**: Page will reload to apply new template

### Changing Templates

When changing templates:
- **Features may be hidden** but data is NOT deleted
- Example: Switching from Dental to Hair Salon will hide prescriptions, but existing prescription records remain in the database
- You can switch back at any time to restore access to hidden features

## For Developers

### Using Templates in Components

```typescript
import { useBusinessTemplate } from '@/hooks/useBusinessTemplate';

function MyComponent() {
  const { template, hasFeature, t } = useBusinessTemplate();

  // Check if feature is enabled
  if (hasFeature('prescriptions')) {
    // Render prescription UI
  }

  // Use template terminology
  return (
    <div>
      <h1>{t('customerPlural')}</h1> {/* "Patients" or "Clients" etc. */}
    </div>
  );
}
```

### Feature Gating

Always wrap template-specific features:

```typescript
{hasFeature('treatmentPlans') && (
  <TreatmentPlanManager />
)}

{hasFeature('prescriptions') && (
  <PrescriptionManager />
)}
```

### Navigation Items

Filter navigation based on template:

```typescript
const navItems = [
  { label: t('dashboard'), path: '/' },
  { label: t('appointmentPlural'), path: '/appointments' },
  hasFeature('prescriptions') && { label: 'Prescriptions', path: '/prescriptions' },
  hasFeature('treatmentPlans') && { label: 'Treatment Plans', path: '/treatment-plans' },
].filter(Boolean);
```

## Database Schema

### businesses table

```sql
template_type text NOT NULL DEFAULT 'dentist'
CHECK (template_type IN ('dentist', 'hairdresser', 'personal_trainer', 'beauty_salon', 'medical', 'generic'))
```

### Default Value

All existing businesses default to `'dentist'` template for backward compatibility.

## Files

### Core System
- `src/lib/businessTemplates.ts` - Template configurations
- `src/hooks/useBusinessTemplate.tsx` - Template hook
- `src/hooks/useBusinessContext.tsx` - Business context (includes template loading)

### UI Components
- `src/components/BusinessTemplateSelector.tsx` - Template selection UI
- `src/components/BusinessCreationDialog.tsx` - New business creation flow
- `src/pages/DentistAdminBranding.tsx` - Template change UI

### Database
- Migration: Adds `template_type` column to `businesses` table

## Terminology Mappings

| Concept | Dentist | Hairdresser | Personal Trainer | Beauty Salon | Medical | Generic |
|---------|---------|-------------|------------------|--------------|---------|---------|
| Customer | Patient | Client | Client | Client | Patient | Customer |
| Provider | Dentist | Stylist | Trainer | Specialist | Doctor | Provider |
| Service | Treatment | Service | Training Package | Service | Service | Service |
| Business | Clinic | Salon | Gym | Salon | Practice | Business |

## Preview Customer Experience

Business owners can preview the customer booking flow:

1. Go to **Dashboard**
2. Find **Services & Products** card
3. Click **Preview Customer Booking**
4. Opens public booking page in new tab

## Best Practices

1. **Always use terminology helpers**: Use `t('customer')` instead of hardcoding "Patient"
2. **Feature gate consistently**: Check features at the component level, not deep in the code
3. **Test template changes**: Switch templates in staging to ensure nothing breaks
4. **Document template-specific behavior**: Add comments when features behave differently per template
5. **Preserve data**: Never delete data when hiding features - users may switch back

## Future Enhancements

- [ ] Custom templates (user-defined)
- [ ] Template-specific email templates
- [ ] Template-specific dashboard layouts
- [ ] Industry-specific default services
- [ ] Template marketplace
