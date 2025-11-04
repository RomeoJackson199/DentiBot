# DentiBot/Caberu - Codebase Overview

## 1. PROJECT OVERVIEW

**Project Name:** Caberu (formerly DentiBot)  
**Type:** Complete Dental/Service Practice Management System  
**Description:** An AI-powered, production-ready platform for managing dental practices and service-based businesses. It's a multi-tenant system supporting multiple business types including dental clinics, hair salons, restaurants, and other service providers.

### Key Positioning
- **AI-Powered:** Includes AI chatbot for patient triage and support
- **Enterprise-Ready:** HIPAA compliant, GDPR-ready, with Row Level Security (RLS)
- **Multi-Tenant:** Supports multiple business types (Type A, B, C for salons; plus dental, restaurant, etc.)
- **Mobile-First:** Progressive Web App (PWA) for mobile devices
- **Real-time:** Real-time subscriptions and notifications

---

## 2. TECH STACK

### Frontend
- **React 18.3** - UI framework with hooks and concurrent features
- **TypeScript 5.9** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool with HMR
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - High-quality React components on Radix UI
- **Framer Motion** - Animations
- **React Router v6** - Client-side routing
- **React Hook Form + Zod** - Form handling with validation

### Backend & Database
- **Supabase** - PostgreSQL database with real-time subscriptions
- **PostgREST** - Auto-generated REST API
- **Row Level Security (RLS)** - Multi-tenant data isolation

### State Management
- **TanStack React Query v5** - Server state with caching
- **Context API** - Application-level state
- **Custom Hooks** - Business logic encapsulation

### Additional Libraries
- **Recharts** - Data visualization
- **date-fns** - Date manipulation  
- **Lucide React** - Icon library
- **cmdk** - Command palette
- **Mapbox GL** - Map integration
- **react-joyride** - User tours
- **sonner** - Toast notifications

---

## 3. MAIN PAGES/ROUTES

### Public Routes
```
/                           - Homepage with hero section
/signup                     - User registration
/login                      - User authentication  
/dentists                   - Dentist profiles/listing
/about                      - About page
/pricing                    - Pricing plans
/terms                      - Terms of service
/privacy                    - Privacy policy
/support                    - Support/help page
/:slug                      - Business portal (dynamic)
```

### Authentication & Onboarding
```
/invite                     - Dentist invitation flow
/claim                      - Account claim flow
/create-business            - Create new business setup
/google-calendar-callback   - Google Calendar integration
```

### Patient Portal Routes
```
/care                       - Patient care home/dashboard
/care/appointments          - View/manage appointments
/care/prescriptions         - View prescriptions
/care/history              - Treatment history
/billing                    - Billing & payments
/docs                       - Documents
/account/profile            - Account profile settings
/account/insurance          - Insurance information
/account/privacy            - Privacy settings
/account/help               - Help & support
```

### Dentist/Provider Routes
```
/dentist/*                  - Main dentist portal (tab-based)
/dentist/clinical/*         - Clinical records & appointments
/dentist/business/*         - Business/billing section
/dentist/ops/*              - Operations/inventory
/dentist/settings           - Admin settings
/dentist-services           - Service configuration
```

### Business/Admin Routes
```
/dashboard                  - Unified dashboard (role-based)
/admin/homepage-manager     - Homepage content management
/admin/setup-mp             - Multi-provider setup
/restaurant/owner           - Restaurant owner dashboard
/restaurant/waiter          - Waiter management
/restaurant/kitchen         - Kitchen display system
```

### Booking & Appointments
```
/book-appointment-ai        - AI-powered booking flow
/public/booking            - Public booking page
/order                      - Table ordering (restaurant)
```

### Demo & Testing
```
/demo/dentist              - Dentist demo dashboard
/language-test             - Language/translation test
/chat                      - Chat interface test
```

---

## 4. WEBSITE STRUCTURE & MAIN COMPONENTS

### Core Architecture

```
src/
├── pages/                    # Page components (56 page files)
│   ├── Index.tsx            - Homepage
│   ├── DentistPortal.tsx    - Main dentist dashboard
│   ├── PatientCareHome.tsx  - Patient home
│   ├── Login.tsx            - Auth
│   ├── Signup.tsx           - Registration
│   ├── CreateBusiness.tsx   - Business setup
│   ├── Analytics.tsx        - Practice analytics
│   ├── Schedule.tsx         - Scheduling
│   ├── BookAppointmentAI.tsx - AI booking
│   └── ... (52 more pages)
│
├── components/              # React components (organized by domain)
│   ├── ui/                  - Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── ... (30+ UI components)
│   │
│   ├── dashboard/           - Dashboard widgets
│   ├── appointments/        - Appointment management
│   ├── patient/             - Patient-specific components
│   ├── medical/             - Medical records
│   ├── payments/            - Payment handling
│   ├── salon/               - Hair salon features (Type A, B, C)
│   ├── barbershop/          - Barbershop features
│   ├── restaurant/          - Restaurant features
│   ├── booking/             - Booking components
│   ├── auth/                - Authentication
│   ├── layout/              - Layout wrappers
│   ├── homepage/            - Homepage components
│   ├── analytics/           - Analytics widgets
│   ├── notifications/       - Notification system
│   ├── onboarding/          - Onboarding flows
│   ├── enhanced/            - Enhanced/optimized components
│   ├── optimized/           - Performance optimizations
│   ├── accessibility/       - A11y components
│   ├── email-templates/     - Email template components
│   └── ... (20+ more directories)
│
├── hooks/                   # Custom React hooks
│   ├── useBusinessContext.tsx - Business/clinic selection
│   ├── useLanguage.tsx      - Multi-language support
│   ├── useAppointments.tsx  - Appointment management
│   ├── useClinicBranding.tsx - Branding customization
│   ├── useNotifications.ts  - Notification system
│   ├── useLanguageDetection.tsx - Auto language detection
│   └── ... (10+ hooks)
│
├── contexts/                # React contexts
│   └── TemplateContext.tsx  - Business template system
│
├── integrations/            # External services
│   └── supabase/
│       ├── client.ts        - Supabase client config
│       └── database.types.ts - Generated types
│
├── lib/                     # Utility functions & services
│   ├── businessTemplates.ts - Business type templates
│   ├── salonTiers.ts       - Salon tier levels (Type A, B, C)
│   ├── emailTemplates.ts   - Email templates
│   ├── notificationService.ts - Notifications
│   ├── appointmentAvailability.ts - Availability logic
│   ├── medicalRecords.ts   - Medical record utilities
│   ├── analytics.ts        - Analytics utilities
│   ├── security.ts         - Security utilities
│   ├── logger.ts           - Logging
│   └── ... (15+ utilities)
│
├── types/                   # TypeScript definitions
├── utils/                   # Utility functions
├── styles/                  # Global styles
└── App.tsx                  # Root router configuration
```

---

## 5. KEY FEATURES & COMPONENTS

### Patient Features
- **Appointment Booking** - AI-powered or traditional booking
- **Appointment Management** - View, reschedule, cancel appointments
- **Medical Records** - Digital health records access
- **Prescriptions** - View and track prescriptions
- **Billing & Payments** - Track payments, view invoices
- **Treatment History** - View past treatments
- **Documents** - Access medical documents
- **Account Management** - Profile, insurance, privacy settings

### Provider/Dentist Features
- **Unified Dashboard** - Role-based dashboard system
- **Clinical Dashboard** - Patient records, treatment plans
- **Appointment Management** - Schedule, manage appointments
- **Patient Management** - Complete patient database
- **Inventory Management** - Track supplies and materials
- **Analytics & Reporting** - Practice metrics and insights
- **Payment Processing** - Billing and invoice management
- **Staff Management** - Team and provider management
- **Settings & Configuration** - Clinic branding, availability, services
- **AI Triage** - Emergency/urgency assessment

### Business/Salon Features (Multi-tier)
- **Type A (Solo Stylist)** - Personal dashboard, break manager, earnings tracking
- **Type B (Small Salon)** - Team management, chair/station management
- **Type C (Multiple Locations)** - Multi-location management, analytics

### Restaurant Features
- **Owner Dashboard** - Overview of orders and operations
- **Waiter Dashboard** - Table management and orders
- **Kitchen Display System** - Order viewing and preparation
- **Table Ordering** - Customer-facing ordering interface

### AI & Automation
- **AI Chatbot** - DentalChatbot component for patient triage
- **AI Booking Flow** - Intelligent appointment booking
- **Emergency Triage** - AI-powered urgency assessment
- **AI Writing Assistant** - Help compose messages
- **Natural Language Processing** - For patient communication

### Notifications & Engagement
- **Notification Center** - Centralized notifications
- **SMS/Email Reminders** - Appointment reminders
- **Real-time Updates** - Via Supabase subscriptions
- **Notification Settings** - User preferences
- **Email Templates** - Customizable email designs

### Additional Features
- **Multi-language Support** - 20+ languages
- **Dark/Light Mode** - Theme switching
- **GDPR Compliance** - Data export, privacy controls
- **Security** - HIPAA compliance, encryption, RLS
- **PWA Support** - Installable web app
- **Mobile Responsive** - Mobile-first design
- **Accessibility** - WCAG 2.1 AA compliant
- **Data Import/Export** - Bulk data management
- **Command Palette** - Keyboard shortcuts
- **Onboarding Flows** - Welcome wizard system

---

## 6. AUTHENTICATION & USER ROLES

### User Types
- **Patients** - Book appointments, access health records
- **Dentists/Providers** - Manage practice, patients, schedules
- **Admin** - System configuration, multi-location management
- **Staff** - Support team (optional)
- **Guests** - Public booking access

### Auth Implementation
- Supabase Auth (email/password, social providers)
- Session management with business selection
- Role-based access control (RBAC)
- RLS (Row Level Security) for data isolation

---

## 7. KEY FILES & COMPONENT OVERVIEW

### Main Entry Points
- `/src/main.tsx` - React app entry
- `/src/App.tsx` - Router configuration (460 lines)
- `/src/index.html` - HTML template

### Major Page Components
| Page | File | Purpose |
|------|------|---------|
| Homepage | `Index.tsx` | Public landing page |
| Patient Dashboard | `PatientCareHome.tsx` | Patient home |
| Dentist Portal | `DentistPortal.tsx` | Provider dashboard |
| Login | `Login.tsx` | Authentication |
| Sign Up | `Signup.tsx` | Registration |
| Admin Panel | `AdminHomepageManager.tsx` | Content management |

### Core Component Categories

**Patient Components:**
- `PatientDashboard.tsx` (73KB) - Main patient interface
- `PatientManagement.tsx` (73KB) - For providers
- `PatientAppointments.tsx` - Appointment list

**Appointment Components:**
- `AppointmentBooking.tsx` - Traditional booking
- `BookAppointmentAI.tsx` - AI-powered booking
- `AppointmentCalendar.tsx` - Calendar view
- `AppointmentManagement.tsx` - Management interface
- `EmergencyTriageForm.tsx` - Emergency assessment

**Dashboard Components:**
- `UnifiedDashboard.tsx` - Role-based dashboard
- `DentistPortal.tsx` - Provider portal
- `ClinicalToday.tsx` - Today's clinical view

**Dental/Medical:**
- `TreatmentPlanManager.tsx` - Treatment plans
- `PrescriptionManager.tsx` - Prescriptions
- `HealthData.tsx` - Medical records
- `EmergencyTriageForm.tsx` - Triage/assessment

**Salon Features:**
- `SoloDashboard.tsx` - Type A dashboard
- `BreakManager.tsx` - Break scheduling
- `PersonalEarnings.tsx` - Earnings tracking
- `QuickBooking.tsx` - Fast rebooking

**Business/Admin:**
- `DentistAdminBranding.tsx` - Branding customization
- `DentistAdminSecurity.tsx` - Security settings
- `DentistAdminUsers.tsx` - User management
- `Settings.tsx` - General settings

**AI/Automation:**
- `DentalChatbot.tsx` - AI chat interface
- `AIConversationDialog.tsx` - AI conversations
- `StreamlinedTriage.tsx` - Triage flow
- `EmergencyBookingFlow.tsx` - Emergency booking

**Payments:**
- `PaymentRequestManager.tsx` - Payment requests
- `PatientPaymentHistory.tsx` - Payment history
- `PaymentSuccess.tsx` - Success page

**Other:**
- `NotificationCenter.tsx` - Notifications
- `CommandPalette.tsx` - Command search
- `WelcomeWizard.tsx` - Onboarding
- `ChangelogPopup.tsx` - Updates notification

### UI Component Library (shadcn/ui)
30+ pre-built components including:
- Button, Card, Dialog, Form, Input
- Table, Tabs, Select, Checkbox
- Avatar, Badge, Breadcrumb
- Dropdown, Popover, Tooltip
- Accordion, Collapsible, Drawer
- And more...

---

## 8. STATE MANAGEMENT

### Context API
- `TemplateContext` - Business template state
- `BusinessProvider` - Business/clinic selection
- Language context - Multi-language support

### React Query
- Server-state caching and synchronization
- Automatic refetching
- Optimistic updates
- Real-time subscriptions via Supabase

### Custom Hooks
- `useBusinessContext()` - Business selection and switching
- `useLanguage()` - Multi-language support (20+ languages)
- `useAppointments()` - Appointment management
- `useNotifications()` - Notification system
- `useClinicBranding()` - Custom branding

---

## 9. DATABASE & INTEGRATIONS

### Supabase Integration
- PostgreSQL database with RLS
- Real-time subscriptions
- Email authentication
- Social provider auth (Google, GitHub, etc.)

### Key Tables
- `profiles` - User profiles
- `businesses` - Clinic/practice info
- `business_members` - User-business relationships
- `appointments` - Appointment data
- `patients` - Patient information
- `treatments` - Treatment records
- `prescriptions` - Prescription data
- `payments` - Payment records
- `services` - Service offerings
- `availability` - Availability settings
- `notifications` - Notification records
- `recurring_appointments` - Auto-rebooking
- And more...

### Third-party Integrations
- Google Calendar sync
- Mapbox for location services
- Email service (for notifications)
- Possible payment processor (Stripe likely)

---

## 10. BUILD & DEPLOYMENT

### Scripts
```bash
npm run dev           # Development server
npm run build         # Production build
npm run preview       # Preview production build
npm run lint          # Linting
npm run test          # Run tests
npm run test:watch    # Watch mode testing
npm run test:coverage # Coverage report
```

### Build Config
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **TypeScript** - Type checking
- **Jest** - Testing framework

### Deployment Options
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Render, Railway

---

## 11. DOCUMENTATION

Key documentation files in repository:
- `README.md` - Main documentation
- `DESIGN_SYSTEM.md` - UI/UX guidelines
- `NOTIFICATION_SYSTEM.md` - Notification architecture
- `DENTIST_DASHBOARD_GUIDE.md` - Provider walkthrough
- `DEPLOYMENT_INSTRUCTIONS.md` - Deployment guides
- `PRODUCTION_READINESS_IMPROVEMENTS.md` - Enterprise features
- `SALON_TYPE_A_README.md` - Solo stylist features
- `SALON_TYPE_B_README.md` - Small salon features
- `SALON_TYPE_C_README.md` - Multi-location features
- `SALON_TIER_SWITCHING.md` - Tier switching guide
- `docs/multi-tenancy.md` - Multi-tenant architecture

---

## 12. KEY ARCHITECTURAL PATTERNS

### Multi-Tenancy
- Business-scoped data access
- Session-based business selection
- RLS policies for isolation
- Support for multiple businesses per user

### Role-Based Access
- Patient, Provider, Admin roles
- `RoleBasedRouter` component for route protection
- RLS database policies for role enforcement

### Template System
- Business template variations (Type A, B, C)
- Template-based UI rendering
- Switchable templates for different business models

### Lazy Loading
- Suspense-based code splitting
- Route-based lazy loading
- Progressive performance optimization

### Real-time Updates
- Supabase subscriptions
- WebSocket connections
- Auto-refresh capabilities

---

## 13. SUMMARY

**Caberu** is a comprehensive, enterprise-grade practice management platform designed for dental practices and service-based businesses. It features:

✅ **Complete Feature Set** - Scheduling, patient records, billing, inventory, analytics  
✅ **AI Integration** - Chatbot, triage, intelligent booking  
✅ **Multi-Tenant Architecture** - Support for multiple businesses and user roles  
✅ **Enterprise Security** - HIPAA compliance, encryption, Row Level Security  
✅ **Mobile-First Design** - PWA with responsive design  
✅ **Customization** - Business types (Dental, Salon Type A/B/C, Restaurant, Barbershop)  
✅ **Scalability** - Modern tech stack with real-time capabilities  
✅ **Internationalization** - 20+ language support  
✅ **Accessibility** - WCAG 2.1 AA compliant  

The codebase is well-organized with clear separation of concerns, comprehensive component library, and extensive documentation. It's production-ready and designed to scale for dental practices of various sizes.

