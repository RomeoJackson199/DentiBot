# 🎉 Caberu Onboarding System

## Overview

The Caberu onboarding system provides a comprehensive first-time user experience for new dentists, including:

1. **7-Step Onboarding Flow** - Collects practice information
2. **Demo Data Generation** - Creates realistic sample data
3. **Interactive Product Tour** - Guides users through key features
4. **Progress Tracker** - Shows setup completion status

## Architecture

### Components

#### 1. `OnboardingOrchestrator` (`src/components/onboarding/OnboardingOrchestrator.tsx`)

**Purpose**: Main controller that manages the onboarding flow

**Features**:
- Detects first-time dentist users
- Shows onboarding wizard for new users
- Offers demo data generation after onboarding
- Auto-triggers product tour after demo data creation

**Triggers**:
- Automatically shows for dentists who haven't completed onboarding
- Only appears on dentist routes (`/dentist/*`)
- Checks `profiles.onboarding_completed` flag

**Flow**:
```
New Dentist Signup
  ↓
OnboardingOrchestrator checks status
  ↓
Show DentistOnboardingFlow (if not completed)
  ↓
User completes 7 steps
  ↓
Show DemoDataPrompt
  ↓
Demo data generated
  ↓
Auto-start Product Tour
```

#### 2. `DentistOnboardingFlow` (`src/components/onboarding/DentistOnboardingFlow.tsx`)

**Purpose**: 7-step wizard to collect practice information

**Steps**:
1. **Welcome & Role Confirmation** - Select role (dentist, hygienist, admin, receptionist)
2. **Practice Information** - Name, type, specialty
3. **Location & Contact** - Address, phone, email
4. **Working Hours** - Operating schedule for each day
5. **Team Size** - Number of dentists, hygienists, receptionists
6. **Services Offered** - Select all applicable services
7. **Goals** - What the dentist wants to achieve with Caberu

**Data Saved To**: `profiles.onboarding_data` (JSONB field)

**Validation**:
- Steps 1-2 require all fields to proceed
- Other steps are optional but encouraged

#### 3. `DemoDataPrompt` (`src/components/onboarding/DemoDataPrompt.tsx`)

**Purpose**: Offers to generate realistic demo data

**What It Creates**:
- **15 Demo Patients** - With realistic names, contact info, DOB, insurance
- **25 Sample Appointments** - Mix of past (40%), today (30%), and future (30%)
- **Medical Records** - 2-3 records per patient with treatments and prescriptions

**Features**:
- Progress indicator during generation
- Success screen with stats
- Option to skip
- "Skip" preference saved to localStorage
- All demo data is marked for easy identification and removal

**Demo Data Markers**:
- Patients: `medical_notes` contains "Demo patient"
- Appointments: `notes` contains "Demo appointment"
- Medical Records: `notes` contains "Demo medical record"

#### 4. `OnboardingProgressTracker` (`src/components/onboarding/OnboardingProgressTracker.tsx`)

**Purpose**: Floating widget showing setup completion

**Tracked Steps**:
1. ✅ Complete Your Profile
2. ✅ Set Your Availability
3. ✅ Add Demo Data
4. ✅ Add Your First Patient
5. ✅ Take the Product Tour

**Features**:
- Real-time progress percentage
- Action buttons to complete each step
- Minimizable to a floating button
- Auto-dismisses when 100% complete
- Can be permanently dismissed

**Display Logic**:
- Shows on dentist portal pages
- Hidden when progress is 100%
- Hidden if user dismisses it

#### 5. `DentistDemoTour` (`src/components/DentistDemoTour.tsx`)

**Purpose**: Interactive Joyride-based product tour

**Tour Steps**:
1. Welcome message
2. Dashboard Overview
3. Quick Stats Cards
4. Today's Appointments List
5. Patient Management
6. Appointment Scheduling
7. Staff Management
8. Patient Messages
9. Settings & Profile
10. Completion message

**Features**:
- Uses react-joyride for smooth tooltips
- Highlights UI elements with data-tour attributes
- Skip button available
- Progress indicator
- Marks completion in localStorage

**Auto-Start**:
- Automatically starts after demo data generation
- Can be manually triggered via "Start Tour" button
- Won't show if already completed

## Database Schema

### Required Fields

#### `profiles` table:
```sql
onboarding_completed: BOOLEAN DEFAULT false
demo_data_generated: BOOLEAN DEFAULT false
onboarding_data: JSONB -- Stores all onboarding wizard data
role: TEXT -- 'dentist', 'hygienist', 'admin', 'receptionist'
```

### Demo Data Identification

All demo data includes marker text for easy filtering:
- Patients: `WHERE medical_notes LIKE '%Demo patient%'`
- Appointments: `WHERE notes LIKE '%Demo appointment%'`
- Medical Records: `WHERE notes LIKE '%Demo medical record%'`

## Utilities

### `generateDemoData()` (`src/lib/demoDataGenerator.ts`)

**Function**: Creates all demo data

**Parameters**:
```typescript
{
  businessId: string;
  userId: string;
  numberOfPatients?: number; // Default: 15
  numberOfAppointments?: number; // Default: 25
}
```

**Returns**:
```typescript
{
  success: boolean;
  message: string;
  data?: {
    patientsCreated: number;
    appointmentsCreated: number;
    medicalRecordsCreated: number;
  };
  error?: string;
}
```

### `clearDemoData()` (`src/lib/demoDataGenerator.ts`)

**Function**: Removes all demo data

**Parameters**:
```typescript
{
  businessId: string;
  userId: string;
}
```

**Notes**:
- Safely deletes appointments, medical records, then patients
- Updates `profiles.demo_data_generated` to false

## Integration Points

### DentistPortal (`src/pages/DentistPortal.tsx`)

The onboarding system integrates into the main dentist portal:

```tsx
// 1. Import progress tracker
import { OnboardingProgressTracker } from "@/components/onboarding/OnboardingProgressTracker";

// 2. Add to render tree
<OnboardingProgressTracker
  userId={user.id}
  businessId={businessInfo.id}
  onStartTour={() => setShowDemoTour(true)}
/>

// 3. Tour auto-start logic
useEffect(() => {
  const shouldStartTour = localStorage.getItem('should-start-tour') === 'true';
  if (shouldStartTour && !completed) {
    setShowDemoTour(true);
    localStorage.removeItem('should-start-tour');
  }
}, []);
```

### App.tsx

The OnboardingOrchestrator is globally rendered:

```tsx
import { OnboardingOrchestrator } from "@/components/onboarding/OnboardingOrchestrator";

<OnboardingOrchestrator user={user} />
```

5. **Demo Data Prompt Appears**
   - User can generate or skip
6. **Demo Data Generated** (if user chooses)
   - 15 patients, 25 appointments created
   - `profiles.demo_data_generated` = true
   - Page refreshes to load data
7. **Product Tour Auto-Starts**
   - Guides through all features
   - User can skip or complete
8. **Progress Tracker Shows**
   - Floating widget with completion percentage
   - Encourages completing remaining steps

### Returning User

- OnboardingOrchestrator checks completion status
- If completed, nothing shows
- Progress tracker shows until 100% complete
- Demo data remains unless manually cleared

## LocalStorage Keys

```javascript
// Tour completion
'dentist-tour-completed': 'true' | null

// Demo data skip preference
'demo-data-skipped': 'true' | null

// Tour auto-start flag (temporary)
'should-start-tour': 'true' | null

// Progress tracker dismissal
'onboarding-tracker-dismissed': 'true' | null
```

## Customization

### Changing Number of Demo Items

Edit `src/components/onboarding/DemoDataPrompt.tsx`:

```tsx
const result = await generateDemoData({
  businessId,
  userId,
  numberOfPatients: 20, // Change this
  numberOfAppointments: 30, // Change this
});
```

### Adding New Onboarding Steps

Edit `src/components/onboarding/DentistOnboardingFlow.tsx`:

```tsx
const steps = [
  // ... existing steps
  {
    title: "New Step",
    description: "Step description",
    icon: YourIcon,
    content: (
      <div>
        {/* Your form fields */}
      </div>
    ),
  },
];
```

### Adding Tour Steps

Edit `src/components/DentistDemoTour.tsx`:

```tsx
const steps: Step[] = [
  // ... existing steps
  {
    target: '[data-tour="new-element"]',
    content: (
      <div>
        <h3>New Feature</h3>
        <p>Description</p>
      </div>
    ),
    placement: "bottom",
  },
];
```

**Remember to add the data attribute to your UI element**:
```tsx
<div data-tour="new-element">
  Your content
</div>
```

### Customizing Progress Tracker Steps

Edit `src/components/onboarding/OnboardingProgressTracker.tsx`:

```tsx
const newSteps: OnboardingStep[] = [
  // ... existing steps
  {
    id: "new-step",
    title: "New Step Title",
    description: "What user needs to do",
    icon: YourIcon,
    completed: checkIfCompleted(),
    action: () => navigate("/some-route"),
    actionLabel: "Action Button Text",
  },
];
```

## Testing

### Testing Onboarding Flow

1. Create a new dentist account
2. Navigate to `/dentist/dashboard`
3. Onboarding wizard should appear
4. Complete all 7 steps
5. Demo data prompt should appear
6. Generate demo data
7. Product tour should auto-start
8. Progress tracker should appear in bottom-right

### Resetting Onboarding State

To test the flow again:

```sql
-- Reset profile flags
UPDATE profiles
SET
  onboarding_completed = false,
  demo_data_generated = false,
  onboarding_data = null
WHERE user_id = 'YOUR_USER_ID';
```

```javascript
// Clear localStorage
localStorage.removeItem('dentist-tour-completed');
localStorage.removeItem('demo-data-skipped');
localStorage.removeItem('should-start-tour');
localStorage.removeItem('onboarding-tracker-dismissed');
```

### Testing Demo Data Cleanup

```typescript
import { clearDemoData } from '@/lib/demoDataGenerator';

await clearDemoData(businessId, userId);
```

## Troubleshooting

### Onboarding Not Showing

**Check**:
1. Is user role = 'dentist'?
2. Is `profiles.onboarding_completed` = false?
3. Are you on a dentist route (`/dentist/*`)?
4. Check browser console for errors

### Demo Data Prompt Not Showing

**Check**:
1. Is `profiles.onboarding_completed` = true?
2. Is `profiles.demo_data_generated` = false?
3. Did user click "Skip for Now"? (check localStorage)

### Tour Not Auto-Starting

**Check**:
1. Is `should-start-tour` in localStorage?
2. Was page refreshed after demo data generation?
3. Is `dentist-tour-completed` already true?

### Progress Tracker Not Showing

**Check**:
1. Is user on `/dentist/*` route?
2. Was it dismissed? (check localStorage)
3. Is progress already 100%?

## Future Enhancements

### Potential Improvements

1. **Video Tutorials** - Embed video walkthroughs in onboarding
2. **Contextual Help** - Show relevant tips based on user actions
3. **Progress Rewards** - Badges or achievements for completing steps
4. **Smart Tips** - AI-powered suggestions based on practice data
5. **Advanced Demo Scenarios** - Generate data based on specialty
6. **Multi-language Support** - Translate onboarding for international users
7. **Analytics** - Track which steps users skip or struggle with
8. **A/B Testing** - Test different onboarding flows
9. **Interactive Checklists** - More granular setup tasks
10. **Social Proof** - Show success stories during onboarding

## Metrics to Track

For optimizing the onboarding experience:

- **Completion Rate**: % of users who complete onboarding
- **Time to Complete**: Average time for full onboarding
- **Demo Data Adoption**: % who generate demo data
- **Tour Completion**: % who complete product tour
- **Drop-off Points**: Where users exit the flow
- **Feature Activation**: Which features users try first

## Support

If users have issues with onboarding:

1. Check browser console for errors
2. Verify database schema matches documentation
3. Test with a fresh account
4. Review localStorage for conflicting flags
5. Check Supabase RLS policies for profile access

## Credits

Built with:
- **React Joyride** - Interactive product tours
- **Framer Motion** - Smooth animations
- **Shadcn/ui** - Beautiful UI components
- **Supabase** - Backend and database
- **date-fns** - Date manipulation for demo data

---

**Last Updated**: 2025-11-10
**Version**: 1.0.0
