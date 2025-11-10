# Booking Flow Test Plan

## Test Scenario: Complete Booking Flow from Triage to Confirmation

### Prerequisites:
1. User is authenticated (using Romeo@caberu.be)
2. Database is properly configured
3. At least one dentist exists in the database

### Test Steps:

#### 1. Access Emergency Triage
- Navigate to `/emergency-triage`
- Verify the landing page loads correctly
- Click "Start Emergency Assessment"

#### 2. Complete Triage Assessment
- Answer all triage questions
- Verify urgency level is calculated correctly
- Verify "Book Appointment" button appears

#### 3. Booking Interface
- Click "Book Appointment"
- Verify the booking form loads with:
  - Date picker (with minimum date validation)
  - Time selector (with predefined slots)
  - Reason dropdown (with common dental reasons)
  - Notes textarea (optional)
  - Urgency level display
  - Confirm button (disabled until required fields filled)

#### 4. Fill Booking Form
- Select a date (tomorrow or later)
- Select a time slot
- Choose a reason for visit
- Add optional notes
- Verify urgency level is displayed correctly
- Click "Confirm Appointment"

#### 5. Backend Integration
- Verify appointment is saved to database with:
  - patient_id (from authenticated user)
  - dentist_id (from available dentists)
  - appointment_date (combined date + time)
  - reason (from form)
  - notes (from form)
  - urgency (from triage assessment)
  - status ('confirmed')

#### 6. Confirmation Screen
- Verify confirmation screen shows:
  - Success message with checkmark
  - Confirmation ID (appointment ID from database)
  - Formatted date and time
  - Patient name (from user profile)
  - Dentist name (from selected dentist)
  - Reason for visit
  - Urgency level badge
  - Timestamp of booking
  - "What to expect next" section
  - "Return to Dashboard" button
  - "Book Another Appointment" button

#### 7. Database Verification
- Check appointments table for new record
- Verify all fields are populated correctly
- Verify timestamps are set

### Expected Results:
- Complete booking flow works end-to-end
- UI is clean and professional
- No "//:" placeholder text appears
- Confirmation screen shows all required information
- Database integration works correctly
- User can return to dashboard or book another appointment

### Test Data:
- User: Romeo@caberu.be
- Date: August 3, 2025 (or later)
- Time: Any available slot
- Reason: "Routine Check-up" or "Tooth Pain"
- Notes: "Test booking from triage flow"

### Success Criteria:
- ✅ Booking interface is complete (no placeholders)
- ✅ Confirmation screen shows success message and details
- ✅ Timestamps are displayed correctly
- ✅ Return-to-dashboard button works
- ✅ Backend integration saves booking data
- ✅ No guest mode placeholders remain