# Dentist Dashboard - Adding Prescriptions and Treatment Plans

## How to Add Prescriptions and Treatment Plans

The functionality to add prescriptions and treatment plans is available in the **Patients** section of the dentist dashboard. Here's how to access it:

### Step-by-Step Guide

1. **Access Dentist Dashboard**
   - Log in to the application as a dentist
   - Navigate to the Dentist Dashboard

2. **Go to Patients Tab**
   - In the dentist dashboard, click on the **"Patients"** tab
   - This will show you a list of all your patients

3. **Select a Patient**
   - Click on any patient from the list to view their detailed profile
   - This will open the patient's comprehensive profile view

4. **Access Prescriptions or Treatment Plans**
   - In the patient profile, you'll see several tabs:
     - **Overview** - General patient information
     - **Prescriptions** - Manage patient prescriptions
     - **Treatment Plans** - Manage treatment plans
     - **Medical Records** - View medical records
     - **Notes** - Patient notes
     - **Appointments** - Appointment history
     - **Dentist Profile** - Your profile information

5. **Add New Prescription**
   - Click on the **"Prescriptions"** tab
   - Click the **"Add Prescription"** button
   - Fill in the prescription details:
     - Medication name
     - Dosage
     - Frequency
     - Duration
     - Instructions (optional)
     - Expiry date (optional)
   - Click **"Add Prescription"** to save

6. **Add New Treatment Plan**
   - Click on the **"Treatment Plans"** tab
   - Click the **"Add Treatment Plan"** button
   - Fill in the treatment plan details:
     - Plan name
     - Description
     - Diagnosis
     - Treatment goals (can add multiple)
     - Procedures (can add multiple)
     - Estimated cost
     - Estimated duration
     - Priority level
     - Target completion date
     - Notes
   - Click **"Add Treatment Plan"** to save

### Troubleshooting

If you can't see the "Add Prescription" or "Add Treatment Plan" buttons:

1. **Make sure you're logged in as a dentist**
   - Only dentists can access this functionality
   - Check that your account has dentist privileges

2. **Verify you're in the correct section**
   - You must be in the **Patients** tab of the dentist dashboard
   - You must have selected a specific patient

3. **Check database connection**
   - Ensure the application is properly connected to the database
   - Check for any error messages in the browser console

4. **Clear browser cache**
   - Try refreshing the page
   - Clear browser cache and cookies if needed

### Features Available

**Prescriptions:**
- Add new prescriptions with detailed medication information
- Edit existing prescriptions
- Change prescription status (active, completed, discontinued)
- View prescription history

**Treatment Plans:**
- Create comprehensive treatment plans
- Add multiple treatment goals and procedures
- Set priority levels and completion dates
- Track treatment progress
- Edit and update treatment plans

### Database Tables

The following database tables are used for this functionality:
- `prescriptions` - Stores prescription data
- `treatment_plans` - Stores treatment plan data
- `medical_records` - Stores medical records
- `patient_notes` - Stores patient notes
- `appointment_follow_ups` - Stores follow-up appointments

All tables have proper Row Level Security (RLS) policies to ensure data privacy and access control.