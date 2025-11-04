# DentiBot - Quick File Reference

## Project File Structure

```
DentiBot/
├── src/                              # Main source code
│   ├── main.tsx                      # React entry point
│   ├── App.tsx                       # Root router (460 lines)
│   ├── App.css                       # Root styles
│   ├── index.css                     # Global styles
│   ├── vite-env.d.ts                 # Vite type definitions
│   │
│   ├── pages/ (56 files)             # Page components - routing
│   │   ├── Index.tsx                 ⭐ Homepage
│   │   ├── DentistPortal.tsx         ⭐ Provider main portal
│   │   ├── PatientCareHome.tsx       ⭐ Patient main dashboard
│   │   ├── Login.tsx                 - Authentication
│   │   ├── Signup.tsx                - Registration
│   │   ├── CreateBusiness.tsx        - Business setup
│   │   ├── Schedule.tsx              - Scheduling page
│   │   ├── Analytics.tsx             - Practice analytics
│   │   ├── BookAppointmentAI.tsx     - AI booking
│   │   ├── PublicBooking.tsx         - Public booking
│   │   ├── DentistAdminBranding.tsx  - Settings: Branding
│   │   ├── DentistAdminSecurity.tsx  - Settings: Security
│   │   ├── DentistAdminUsers.tsx     - Settings: Users
│   │   ├── PatientAppointmentsPage.tsx - Patient appointments
│   │   ├── PatientPrescriptionsPage.tsx - Patient prescriptions
│   │   ├── PatientBillingPage.tsx    - Patient billing
│   │   ├── PatientTreatmentHistoryPage.tsx - Treatment history
│   │   ├── PatientDocumentsPage.tsx  - Documents
│   │   ├── BusinessPortal.tsx        - Dynamic business portal
│   │   ├── RestaurantOwnerDashboard.tsx - Restaurant features
│   │   ├── WaiterDashboard.tsx       - Waiter interface
│   │   ├── KitchenDashboard.tsx      - Kitchen display
│   │   ├── AdminHomepageManager.tsx  - Content management
│   │   ├── Terms.tsx                 - Terms of service
│   │   ├── PrivacyPolicy.tsx         - Privacy policy
│   │   ├── About.tsx                 - About page
│   │   ├── Support.tsx               - Support page
│   │   ├── Pricing.tsx               - Pricing page
│   │   ├── NotFound.tsx              - 404 page
│   │   ├── Invite.tsx                - Invite flow
│   │   ├── Claim.tsx                 - Account claim
│   │   ├── PaymentSuccess.tsx        - Payment success
│   │   ├── PaymentCancelled.tsx      - Payment cancelled
│   │   ├── Chat.tsx                  - Chat interface
│   │   ├── Messages.tsx              - Messages
│   │   ├── FeatureDetail.tsx         - Feature pages
│   │   └── demo/                     - Demo pages
│   │       └── DemoDentistDashboard.tsx
│   │
│   ├── components/ (organized by domain)
│   │   ├── ui/                       # shadcn/ui components (30+)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ... (20+ more)
│   │   │
│   │   ├── dashboard/               # Dashboard widgets
│   │   │   ├── ClinicalToday.tsx
│   │   │   ├── NextAppointmentWidget.tsx
│   │   │   ├── RecallsQueue.tsx
│   │   │   └── ...
│   │   │
│   │   ├── appointments/            # Appointment management
│   │   │   ├── AppointmentBooking.tsx
│   │   │   ├── AppointmentCalendar.tsx
│   │   │   ├── AppointmentManagement.tsx
│   │   │   ├── AppointmentsList.tsx
│   │   │   ├── RealAppointmentsList.tsx
│   │   │   ├── UnifiedAppointments.tsx
│   │   │   ├── RescheduleDialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── patient/                 # Patient components
│   │   │   ├── PatientDashboard.tsx
│   │   │   ├── PatientManagement.tsx
│   │   │   ├── PatientAppointments.tsx
│   │   │   ├── PatientPortalNav.tsx
│   │   │   ├── PatientPaymentHistory.tsx
│   │   │   └── ...
│   │   │
│   │   ├── medical/                 # Medical records
│   │   │   ├── HealthData.tsx
│   │   │   ├── TreatmentPlanManager.tsx
│   │   │   ├── TreatmentRecordsTable.tsx
│   │   │   ├── PrescriptionManager.tsx
│   │   │   └── ...
│   │   │
│   │   ├── payments/                # Payment handling
│   │   │   ├── PaymentRequestManager.tsx
│   │   │   ├── PaymentRequestForm.tsx
│   │   │   └── ...
│   │   │
│   │   ├── salon/                   # Hair salon features
│   │   │   ├── SoloDashboard.tsx (Type A)
│   │   │   ├── BreakManager.tsx
│   │   │   ├── QuickBooking.tsx
│   │   │   ├── PersonalEarnings.tsx
│   │   │   └── ...
│   │   │
│   │   ├── barbershop/              # Barbershop features
│   │   ├── restaurant/              # Restaurant features
│   │   │
│   │   ├── booking/                 # Booking system
│   │   │   ├── AppointmentBooking.tsx
│   │   │   ├── BookingFlowTest.tsx
│   │   │   ├── BookingRouteHandler.tsx
│   │   │   ├── SimpleAppointmentBooking.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/                    # Authentication
│   │   │   ├── AuthForm.tsx
│   │   │   ├── ProgressiveAuthForm.tsx
│   │   │   ├── AuthCallbackHandler.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── AppShell.tsx
│   │   │   └── ...
│   │   │
│   │   ├── homepage/                # Homepage components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ...
│   │   │
│   │   ├── analytics/               # Analytics widgets
│   │   ├── notifications/           # Notification system
│   │   │   ├── NotificationCenter.tsx
│   │   │   ├── NotificationButton.tsx
│   │   │   ├── NotificationSettings.tsx
│   │   │   └── ...
│   │   │
│   │   ├── onboarding/              # Onboarding flows
│   │   │   ├── WelcomeWizard.tsx
│   │   │   ├── OnboardingPopup.tsx
│   │   │   ├── DentistDemoTour.tsx
│   │   │   ├── OnboardingOrchestrator.tsx
│   │   │   └── ...
│   │   │
│   │   ├── enhanced/                # Performance optimizations
│   │   ├── optimized/               # Optimized components
│   │   ├── accessibility/           # A11y components
│   │   ├── email-templates/         # Email templates
│   │   ├── performance/             # Performance utilities
│   │   ├── pwa/                     # PWA features
│   │   ├── admin/                   # Admin components
│   │   ├── business/                # Business components
│   │   ├── services/                # Service components
│   │   ├── inventory/               # Inventory management
│   │   ├── medical/                 # Medical records
│   │   ├── schedule/                # Schedule components
│   │   ├── messaging/               # Messaging/chat
│   │   ├── mobile/                  # Mobile-specific
│   │   ├── testing/                 # Test components
│   │   ├── staff/                   # Staff management
│   │   ├── states/                  # State components
│   │   ├── empty-states/            # Empty state placeholders
│   │   ├── gdpr/                    # GDPR compliance
│   │   │
│   │   ├── AIConversationDialog.tsx ⭐ AI chat
│   │   ├── DentalChatbot.tsx        ⭐ AI dental chatbot
│   │   ├── EmergencyTriageForm.tsx  ⭐ Emergency triage
│   │   ├── StreamlinedTriage.tsx    ⭐ Triage flow
│   │   ├── EmergencyBookingFlow.tsx ⭐ Emergency booking
│   │   ├── CommandPalette.tsx       - Command search
│   │   ├── Settings.tsx             - Settings page
│   │   ├── ModernSettings.tsx       - Modern settings UI
│   │   ├── NotificationCenter.tsx   - Notifications
│   │   ├── ChangelogPopup.tsx       - Updates popup
│   │   ├── FeedbackWidget.tsx       - Feedback
│   │   ├── DentistManagement.tsx    - Team management
│   │   ├── DentistSelection.tsx     - Dentist picker
│   │   ├── DentistRecommendations.tsx - Recommendations
│   │   ├── AvailabilitySettings.tsx - Availability
│   │   ├── DataImportManager.tsx    - Data import
│   │   ├── ProfileCompletionDialog.tsx - Profile setup
│   │   ├── BusinessPickerDialog.tsx - Business selection
│   │   ├── RoleBasedRouter.tsx      - Role protection
│   │   ├── CookieConsent.tsx        - Cookie consent
│   │   ├── PWAInstallPrompt.tsx     - PWA prompt
│   │   └── ... (100+ more components)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useBusinessContext.tsx   ⭐ Business selection
│   │   ├── useLanguage.tsx          ⭐ 20+ languages
│   │   ├── useAppointments.tsx      - Appointments
│   │   ├── useClinicBranding.tsx    - Branding
│   │   ├── useNotifications.ts      - Notifications
│   │   ├── useLanguageDetection.tsx - Auto language
│   │   ├── useCurrentDentist.ts     - Current user
│   │   ├── useCurrency.tsx          - Currency
│   │   ├── useGDPRAudit.ts          - GDPR audit
│   │   ├── useOptimizedQuery.tsx    - Query optimization
│   │   └── ... (10+ hooks)
│   │
│   ├── contexts/                    # React contexts
│   │   └── TemplateContext.tsx      - Template system
│   │
│   ├── integrations/                # External services
│   │   └── supabase/
│   │       ├── client.ts            - Supabase client
│   │       └── database.types.ts    - Generated types
│   │
│   ├── lib/                         # Utilities & services
│   │   ├── businessTemplates.ts     - Template definitions
│   │   ├── salonTiers.ts            - Salon tier configs
│   │   ├── emailTemplates.ts        - Email designs
│   │   ├── notificationService.ts   - Notifications
│   │   ├── appointmentAvailability.ts - Availability
│   │   ├── appointmentUtils.ts      - Appointment helpers
│   │   ├── medicalRecords.ts        - Medical utilities
│   │   ├── analytics.ts             - Analytics utilities
│   │   ├── security.ts              - Security utilities
│   │   ├── logger.ts                - Logging
│   │   ├── languages.ts             - Language definitions
│   │   ├── constants.ts             - App constants
│   │   ├── errorHandling.ts         - Error handling
│   │   ├── exportUtils.ts           - Data export
│   │   ├── seo.ts                   - SEO utilities
│   │   └── ... (15+ utilities)
│   │
│   ├── types/                       # TypeScript definitions
│   ├── utils/                       # Helper functions
│   ├── styles/                      # Global styles
│   ├── assets/                      # Images, fonts, etc.
│   ├── scripts/                     # Build scripts
│   └── setupTests.ts                # Test configuration
│
├── supabase/                        # Database migrations
│   └── migrations/
│
├── docs/                            # Documentation
│   └── multi-tenancy.md            - Multi-tenant guide
│
├── public/                          # Static assets
├── coverage/                        # Test coverage reports
│
├── Configuration Files
│   ├── vite.config.ts              - Vite configuration
│   ├── tailwind.config.ts          - Tailwind styles
│   ├── tsconfig.json               - TypeScript config
│   ├── tsconfig.app.json           - App TS config
│   ├── jest.config.cjs             - Jest testing
│   ├── eslint.config.js            - Linting
│   ├── postcss.config.js           - CSS processing
│   ├── package.json                - Dependencies
│   ├── package-lock.json           - Lock file
│   ├── index.html                  - HTML template
│   ├── components.json             - shadcn config
│   └── .env                        - Environment variables
│
├── Documentation Files
│   ├── README.md                    ⭐ Main documentation
│   ├── CODEBASE_STRUCTURE_GUIDE.md  ⭐ This structure guide
│   ├── DESIGN_SYSTEM.md             - UI/UX guidelines
│   ├── NOTIFICATION_SYSTEM.md       - Notification architecture
│   ├── DENTIST_DASHBOARD_GUIDE.md   - Provider guide
│   ├── DEPLOYMENT_INSTRUCTIONS.md   - Deployment
│   ├── PRODUCTION_READINESS_IMPROVEMENTS.md
│   ├── SALON_TYPE_A_README.md       - Solo stylist features
│   ├── SALON_TYPE_B_README.md       - Small salon features
│   ├── SALON_TYPE_C_README.md       - Multi-location features
│   ├── SALON_TIER_SWITCHING.md      - Tier switching
│   ├── AI_DENTIST_WIDGET_FIX.md     - AI fixes
│   ├── BUG_AND_SECURITY_REPORT.md   - Security info
│   ├── TEMPLATE_SYSTEM_GUIDE.md     - Template system
│   └── ... (20+ documentation files)
│
├── Test Files
│   ├── test-ai-dentist-widget-fix.js
│   ├── test-ai-natural-conversation.js
│   ├── test-ai-final.js
│   ├── test-database-connection.js
│   ├── test-sliders.html
│   └── ... (20+ test files)
│
├── Git Files
│   ├── .git/                        - Git repository
│   ├── .github/                     - GitHub config
│   ├── .gitignore                  - Ignored files
│   └── .build-check.txt            - Build check
│
└── Root Files
    ├── bun.lockb                   - Bun lock file
    └── .env.example                - Environment template

```

## Key Statistics

- **Total Pages:** 56 page components
- **Total Components:** 150+ reusable components
- **UI Components:** 30+ shadcn/ui components
- **Custom Hooks:** 15+ custom hooks
- **Documentation:** 25+ markdown guides
- **Languages Supported:** 20+ languages
- **Lines of Code:** ~100K+ lines of TypeScript/React

## Quick Navigation

### Main Dashboard Pages
- Patient: `/care` → `PatientCareHome.tsx`
- Provider: `/dentist` → `DentistPortal.tsx`
- Admin: `/dashboard` → `UnifiedDashboard.tsx`

### Critical Features
- AI Chatbot: `DentalChatbot.tsx`
- Appointment Booking: `AppointmentBooking.tsx`, `BookAppointmentAI.tsx`
- Patient Management: `PatientManagement.tsx`
- Settings: `Settings.tsx`, `ModernSettings.tsx`

### Configuration
- Business templates: `src/lib/businessTemplates.ts`
- Salon tiers: `src/lib/salonTiers.ts`
- Email templates: `src/lib/emailTemplates.ts`
- Languages: `src/lib/languages.ts`

