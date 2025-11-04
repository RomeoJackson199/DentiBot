# DentiBot/Caberu - Quick Start Understanding Guide

## What is DentiBot?

**Caberu** is an AI-powered, enterprise-grade dental and service practice management platform. It's a single web application that serves multiple user types (patients, dentists, salons, restaurants) with role-based dashboards and customizable templates.

## 5-Minute Overview

### The Big Picture
- **Frontend:** React 18 + TypeScript + Vite (SPA)
- **Backend:** Supabase (PostgreSQL + real-time subscriptions)
- **Deployment:** Static host (Vercel, Netlify, etc.)
- **Architecture:** Multi-tenant with role-based access control

### Three Main User Types
1. **Patients** - Book appointments, view records, pay bills
2. **Providers** - Manage practice, patients, schedules, inventory
3. **Admins** - System configuration and multi-location management

## Essential Files to Understand

### The Core (Read These First)
1. **`/src/App.tsx`** (460 lines)
   - Root router configuration
   - All routes defined here
   - Business gate logic
   - Authentication state management

2. **`/src/pages/Index.tsx`**
   - Homepage for non-authenticated users
   - Entry point for the application
   - Links to login/signup

3. **`/src/pages/DentistPortal.tsx`**
   - Main provider dashboard
   - Tabs-based navigation for dentist features
   - Shows clinical, business, ops sections

4. **`/src/pages/PatientCareHome.tsx`**
   - Patient main dashboard
   - Appointments, prescriptions, billing
   - Health records access

### Key Components (Check These Next)
5. **`/src/components/UnifiedDashboard.tsx`**
   - Role-based dashboard router
   - Determines which dashboard to show

6. **`/src/components/DentalChatbot.tsx`** ⭐
   - AI-powered chatbot for patient triage
   - Emergency assessment
   - Medical information gathering

7. **`/src/components/PatientManagement.tsx`** (73KB)
   - Provider's patient database interface
   - Search, filter, edit patients
   - Very comprehensive

8. **`/src/components/PatientDashboard.tsx`** (73KB)
   - Patient's view of their data
   - Appointments, medical history
   - Mirror of PatientManagement but patient-facing

9. **`/src/components/appointments/AppointmentBooking.tsx`**
   - Traditional appointment booking
   - Calendar interface
   - Availability checking

10. **`/src/components/booking/BookAppointmentAI.tsx`**
    - AI-powered booking experience
    - Conversational flow
    - Emergency triage integration

### State Management & Configuration
11. **`/src/hooks/useBusinessContext.tsx`**
    - Business/clinic selection
    - Multi-tenant awareness
    - Current business state

12. **`/src/hooks/useLanguage.tsx`**
    - Multi-language support (20+ languages)
    - Translation system
    - Language detection

13. **`/src/contexts/TemplateContext.tsx`**
    - Business template system
    - Different UI for different business types

14. **`/src/lib/businessTemplates.ts`**
    - Template definitions
    - Which features for which business types

15. **`/src/lib/salonTiers.ts`**
    - Salon tier configurations
    - Type A (solo), B (small), C (multi-location)

### Supporting Services
16. **`/src/lib/notificationService.ts`**
    - Email/SMS notifications
    - Appointment reminders
    - Real-time updates

17. **`/src/integrations/supabase/client.ts`**
    - Supabase client setup
    - Database connection
    - Real-time subscriptions

## Project Structure at a Glance

```
/src
├── pages/           56 pages (routes)
├── components/      150+ components (organized by feature)
│   ├── ui/         30+ base components
│   ├── appointments/
│   ├── patient/
│   ├── medical/
│   ├── salon/
│   └── ...
├── hooks/          15+ custom hooks
├── contexts/       State management
├── integrations/   Supabase integration
├── lib/            Utilities and services
├── types/          TypeScript types
└── styles/         Global CSS
```

## Key Features Explained

### Appointment System
- **AI Booking:** `BookAppointmentAI.tsx` - Conversational
- **Traditional Booking:** `AppointmentBooking.tsx` - Calendar
- **Management:** `AppointmentManagement.tsx` - Provider view
- **Calendar:** `AppointmentCalendar.tsx` - Visual calendar

### Patient Management
- **Provider View:** `PatientManagement.tsx` - 73KB component
- **Patient View:** `PatientDashboard.tsx` - 73KB component
- **Health Data:** `HealthData.tsx` - Medical records
- **Prescriptions:** `PrescriptionManager.tsx`

### AI & Intelligence
- **Chatbot:** `DentalChatbot.tsx` ⭐
- **Triage:** `EmergencyTriageForm.tsx`
- **AI Conversation:** `AIConversationDialog.tsx`
- **Writing Assistant:** `AIWritingAssistant.tsx`

### Business Management (Dentist)
- **Settings:** `Settings.tsx` / `ModernSettings.tsx`
- **Branding:** `DentistAdminBranding.tsx`
- **Users:** `DentistAdminUsers.tsx`
- **Security:** `DentistAdminSecurity.tsx`
- **Availability:** `AvailabilitySettings.tsx`

### Salon Features (Type A/B/C)
- **Type A (Solo):** `SoloDashboard.tsx`
- **Break Manager:** `BreakManager.tsx`
- **Earnings:** `PersonalEarnings.tsx`
- **Quick Booking:** `QuickBooking.tsx`

### Notifications & Engagement
- **Notification Center:** `NotificationCenter.tsx`
- **Notification Settings:** `NotificationSettings.tsx`
- **Toast Notifications:** Uses Sonner library
- **Email Notifications:** `notificationService.ts`

## Common Routes

### Patient
```
/care                    Patient dashboard
/care/appointments       Appointments list
/care/prescriptions      Prescriptions
/care/history            Treatment history
/billing                 Billing & payments
/docs                    Documents
/account/*              Account settings
```

### Dentist/Provider
```
/dentist                 Provider portal
/dentist/clinical/*      Clinical records
/dentist/business/*      Billing & payments
/dentist/ops/*          Operations & inventory
/dentist/settings       Settings
```

### Public
```
/                        Homepage
/signup                  Registration
/login                   Login
/pricing                 Pricing page
/terms                   Terms
/privacy                 Privacy policy
/dentists               Dentist listings
```

## Data Flow

### Authentication
1. User arrives at `/`
2. App checks `supabase.auth.getSession()`
3. If no user → shows homepage
4. If user → redirects to `/dashboard`
5. Dashboard shows UnifiedDashboard based on role

### Business Selection
1. User logs in
2. App checks `business_members` table
3. If multiple businesses → shows BusinessPickerDialog
4. Selected business stored in `session_business` table
5. All queries scoped to selected business

### Appointment Booking
1. Patient starts booking (AI or traditional)
2. System checks availability
3. Sends appointment to database
4. Email notification triggered
5. Calendar updated in real-time via subscriptions

## Technology Stack Quick Reference

### Frontend
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Fast bundler
- Tailwind CSS - Styling
- shadcn/ui - Component library
- React Router v6 - Routing
- React Query - Data fetching
- Framer Motion - Animations

### Backend
- Supabase - Backend-as-a-service
- PostgreSQL - Database
- RLS - Row level security
- Real-time subscriptions

### Key Libraries
- React Hook Form + Zod - Forms
- Recharts - Charts
- date-fns - Dates
- Lucide React - Icons
- cmdk - Command palette
- react-joyride - User tours

## Quick Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build           # Build for production
npm run preview         # Preview build

# Code Quality
npm run lint            # Check for issues
npm run lint:fix        # Auto-fix issues
npm test               # Run tests
npm run test:watch     # Watch mode testing

# Type Checking
npm run fix:types      # Fix TypeScript errors
```

## Database Overview

### Key Tables
- `profiles` - User profiles
- `businesses` - Clinics/practices
- `business_members` - User-business relationships
- `appointments` - Appointment data
- `patients` - Patient information
- `treatments` - Treatment records
- `services` - Service offerings
- `payments` - Payment records
- `notifications` - Notification history

## Where to Start Exploring

1. **First:** Read `/src/App.tsx` - understand routing
2. **Second:** Check `/src/pages/Index.tsx` - see homepage
3. **Third:** Look at `/src/pages/DentistPortal.tsx` - provider UI
4. **Fourth:** Check `/src/pages/PatientCareHome.tsx` - patient UI
5. **Fifth:** Read `/src/hooks/useBusinessContext.tsx` - multi-tenant logic
6. **Sixth:** Check `/src/components/DentalChatbot.tsx` - AI features

## Important Files for Different Tasks

### Adding a New Feature
- Start with `/src/lib/businessTemplates.ts` - check if feature fits
- Create component in `/src/components/{feature}/`
- Add route in `/src/App.tsx`
- Add API calls via `/src/integrations/supabase/client.ts`

### Fixing Bugs
- Check browser console for errors
- Look at `/src/lib/errorHandling.ts` for error utils
- Use `/src/lib/logger.ts` for debugging
- Check Supabase RLS policies for auth issues

### Customizing UI
- Tailwind classes are primary styling
- shadcn/ui components in `/src/components/ui/`
- Global styles in `/src/styles/`
- Themes in `tailwind.config.ts`

### Adding Languages
- Edit `/src/lib/languages.ts`
- Add translations in `useLanguage()` hook
- All UI text uses `useLanguage()` hook

### Multi-tenant Logic
- Business selection in `/src/hooks/useBusinessContext.tsx`
- Database scoping in Supabase RLS policies
- Template selection in `/src/contexts/TemplateContext.tsx`

## Architecture Highlights

### Multi-Tenancy
- Session-based business selection
- Row Level Security (RLS) for data isolation
- Business scope in all queries
- Support for multiple businesses per user

### Role-Based Access
- `useRole()` hook gets current user role
- `RoleBasedRouter` component for route protection
- RLS policies enforce at database level

### Real-time Updates
- Supabase subscriptions for live data
- Automatic UI refresh when data changes
- Perfect for collaborative features

### Performance
- Lazy loading with Suspense
- Code splitting by route
- React Query caching
- Optimized components in `/src/components/optimized/`

## Documentation Files

For deeper understanding, check:
- `DESIGN_SYSTEM.md` - UI/UX guidelines
- `NOTIFICATION_SYSTEM.md` - How notifications work
- `PRODUCTION_READINESS_IMPROVEMENTS.md` - Enterprise features
- `SALON_TYPE_A_README.md` - Solo stylist features
- `docs/multi-tenancy.md` - Multi-tenant architecture

---

## Summary

DentiBot/Caberu is a sophisticated, production-ready practice management system. The codebase is well-organized with:
- Clear separation of concerns
- Comprehensive component library
- Robust state management
- Enterprise security features
- Extensive documentation

Start with `App.tsx`, understand the routing, then explore the main dashboards. The codebase is very readable and follows modern React best practices.

Happy exploring!
