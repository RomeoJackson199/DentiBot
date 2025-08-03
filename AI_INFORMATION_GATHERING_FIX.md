# AI Information Gathering Fix

## Problem Identified

The AI was **immediately triggering the dentist widget** whenever it detected certain keywords (like "tooth pain", "braces", "cavity"), without gathering sufficient information about the patient's needs first. This created a poor user experience where users would see dentist recommendations before the AI understood:

1. **Who the appointment is for** (patient themselves, child, partner, etc.)
2. **What specific symptoms or needs** they have
3. **The complete context** of their situation

## Root Cause

In `supabase/functions/dental-ai-chat/index.ts`, the logic was:

```typescript
// ❌ OLD LOGIC - Immediate triggering
if (hasChildSymptoms) {
  recommendedDentists.push('Virginie Pauwels', 'Emeline Hubin');
} else if (hasOrthodonticNeeds) {
  recommendedDentists.push('Justine Peters', 'Anne-Sophie Haas');
} else if (hasGeneralDentalNeeds) {
  recommendedDentists.push('Firdaws Benhsain');
} else {
  // Default recommendation for general consultation
  recommendedDentists.push('Firdaws Benhsain');
}

// ❌ This would trigger the widget immediately
if (recommendedDentists.length > 0 && !suggestions.includes('skip-patient-selection')) {
  suggestions.push('recommend-dentist');
}
```

The AI would trigger the dentist widget based on **any single keyword detection**, without requiring both patient information AND specific symptoms.

## Solution Applied

### 1. Updated Logic to Require Both Pieces of Information

**New Logic:**
```typescript
// ✅ NEW LOGIC - Requires both patient info AND symptoms
const hasSpecificDentalNeeds = hasChildSymptoms || hasOrthodonticNeeds || hasGeneralDentalNeeds;
const hasPatientInfo = lowerMessage.includes('moi') || lowerMessage.includes('me') || 
                      lowerMessage.includes('myself') || lowerMessage.includes('voor mij') ||
                      lowerMessage.includes('for me') || lowerMessage.includes('ma fille') ||
                      lowerMessage.includes('mon fils') || lowerMessage.includes('my daughter') ||
                      lowerMessage.includes('my son') || lowerMessage.includes('mijn dochter') ||
                      lowerMessage.includes('mijn zoon') || /\d+\s*(ans|years|jaar)/.test(lowerMessage) ||
                      lowerMessage.includes('ma femme') || lowerMessage.includes('mon mari') ||
                      lowerMessage.includes('my wife') || lowerMessage.includes('my husband');

// ✅ Only recommend dentists when we have BOTH specific needs AND patient information
if (hasSpecificDentalNeeds && hasPatientInfo) {
  if (hasChildSymptoms) {
    recommendedDentists.push('Virginie Pauwels', 'Emeline Hubin');
  } else if (hasOrthodonticNeeds) {
    recommendedDentists.push('Justine Peters', 'Anne-Sophie Haas');
  } else if (hasGeneralDentalNeeds) {
    recommendedDentists.push('Firdaws Benhsain');
  }
}
```

### 2. Updated AI Guidelines

**Before:**
```
- If they ask for an appointment for themselves: go directly to dentist recommendations
- For new appointment for yourself: skip patient selection and go directly to dentist recommendations
```

**After:**
```
- FOR NEW APPOINTMENTS: Collect sufficient information first before making dentist recommendations
  - Ask first who the appointment is for (patient themselves, child, partner, etc.)
  - Then ask about specific symptoms or needs
  - WAIT for their response before making dentist recommendations
- COLLECT INFORMATION FIRST before making dentist recommendations
```

## How It Works Now

### Step-by-Step Process:

1. **User says**: "I need an appointment"
2. **AI responds**: "I can help you book an appointment. Who is this appointment for - you, your child, or someone else?"
3. **User says**: "It's for me"
4. **AI responds**: "Thank you. What type of dental care are you looking for? Do you have any specific symptoms or concerns?"
5. **User says**: "I have tooth pain"
6. **AI triggers dentist widget**: Now that we have BOTH patient info AND symptoms

### Test Cases:

| Input | Patient Info? | Symptoms? | Should Trigger Widget? |
|-------|---------------|-----------|----------------------|
| "I need an appointment" | ❌ | ❌ | ❌ |
| "The appointment is for me" | ✅ | ❌ | ❌ |
| "I have tooth pain" | ❌ | ✅ | ❌ |
| "I have tooth pain and it's for me" | ✅ | ✅ | ✅ |
| "My child has tooth pain" | ✅ | ✅ | ✅ |

## Benefits

1. **Better User Experience**: Users get a natural conversation flow
2. **More Accurate Recommendations**: AI has complete context before making recommendations
3. **Reduced Confusion**: No premature widget triggering
4. **Professional Interaction**: Mimics how a real dental office would gather information

## Files Modified

1. **`supabase/functions/dental-ai-chat/index.ts`**:
   - Updated dentist recommendation logic to require both patient info AND symptoms
   - Updated AI guidelines in all three languages (English, French, Dutch)
   - Removed immediate widget triggering based on single keywords

## Verification

To test the fix:
1. Start the application
2. Send "I need an appointment" - should ask who it's for
3. Send "It's for me" - should ask about symptoms
4. Send "I have tooth pain" - should trigger dentist widget
5. Send "I have tooth pain and it's for me" - should trigger dentist widget immediately

✅ **The AI now properly gathers information before showing the dentist widget!**