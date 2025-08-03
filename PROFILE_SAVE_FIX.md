# Profile Save Fix

## Issue Identified

The profile save functionality was failing because the code was trying to save an `ai_opt_out` field that doesn't exist in the database. The migration `20250804120000_add_reviews_and_ai_opt_out.sql` was created but never applied to the database.

## Root Cause

1. The migration file `supabase/migrations/20250804120000_add_reviews_and_ai_opt_out.sql` exists but hasn't been applied
2. The code in `src/lib/profileUtils.ts` and `src/components/Settings.tsx` was trying to save/update the `ai_opt_out` field
3. The database schema doesn't include the `ai_opt_out` column, causing database errors

## Changes Made

### 1. Fixed ProfileData Interface (`src/lib/profileUtils.ts`)
- Made `ai_opt_out` optional: `ai_opt_out?: boolean`
- Commented out the `ai_opt_out` field in the save function
- Updated the load function to not select the non-existent field
- Set a default value of `false` for `ai_opt_out` in loaded data

### 2. Fixed Settings Component (`src/components/Settings.tsx`)
- Made `ai_opt_out` optional in the UserProfile interface
- Commented out the database update in `updateAiOptOut` function
- The UI will still work, but the setting won't persist until migration is applied

### 3. Fixed AI Opt-Out Prompt (`src/components/AiOptOutPrompt.tsx`)
- Commented out database operations that reference the non-existent field
- The component will still render but won't interact with the database

## Current Status

✅ **Profile save functionality now works** - users can save their personal information without errors

⚠️ **AI opt-out feature is temporarily disabled** - the UI exists but doesn't persist changes until migration is applied

## Next Steps

### Option 1: Apply the Migration (Recommended)

1. **Login to Supabase CLI:**
   ```bash
   npx supabase login
   ```

2. **Apply the migration:**
   ```bash
   npx supabase db push
   ```

3. **Regenerate TypeScript types:**
   ```bash
   npx supabase gen types typescript --project-id gjvxcisbaxhhblhsytar --schema public > src/integrations/supabase/types.ts
   ```

4. **Re-enable the ai_opt_out functionality:**
   - Uncomment the `ai_opt_out` field in `src/lib/profileUtils.ts`
   - Uncomment the database operations in `src/components/Settings.tsx`
   - Uncomment the database operations in `src/components/AiOptOutPrompt.tsx`

### Option 2: Remove AI Opt-Out Feature

If the AI opt-out feature is not needed, you can:

1. Remove the `ai_opt_out` field from all interfaces
2. Remove the AI opt-out UI components
3. Delete the migration file

## Testing

You can test the profile save functionality using:
- `test-profile-save-fixed.html` - Tests the basic profile save without ai_opt_out
- The main application's Settings page should now work for saving personal information

## Files Modified

- `src/lib/profileUtils.ts` - Fixed ProfileData interface and save/load functions
- `src/components/Settings.tsx` - Fixed UserProfile interface and updateAiOptOut function
- `src/components/AiOptOutPrompt.tsx` - Commented out database operations
- `test-profile-save-fixed.html` - Created test file for verification

## Database Schema

Current profiles table columns:
- id
- user_id
- email
- first_name
- last_name
- phone
- date_of_birth
- role
- medical_history
- preferred_language
- created_at
- updated_at
- address
- emergency_contact

Missing column (needs migration):
- ai_opt_out (BOOLEAN DEFAULT FALSE)