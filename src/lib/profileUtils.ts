import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  medical_history: string;
  address: string;
  emergency_contact: string;
  ai_opt_out?: boolean;
}

export const saveProfileData = async (user: User, profileData: ProfileData) => {
  try {
    // Minimal logging to avoid exposing PII
    console.log('Saving profile for user:', user.id);

    // Validate required fields
    if (!profileData.first_name?.trim() || !profileData.last_name?.trim()) {
      throw new Error('First name and last name are required');
    }

    // Clean and prepare data - only include fields that exist in the database
    const cleanData: Record<string, unknown> = {
      first_name: profileData.first_name.trim(),
      last_name: profileData.last_name.trim(),
      phone: profileData.phone?.trim() || null,
      date_of_birth: profileData.date_of_birth || null,
      medical_history: profileData.medical_history?.trim() || null,
    };

    // Only add address and emergency_contact if they exist in the database
    // These fields were added in a later migration
    if (profileData.address !== undefined) {
      cleanData.address = profileData.address.trim() || null;
    }
    if (profileData.emergency_contact !== undefined) {
      cleanData.emergency_contact = profileData.emergency_contact.trim() || null;
    }
    // Re-enabled after migration applied
    if (profileData.ai_opt_out !== undefined) {
      cleanData.ai_opt_out = profileData.ai_opt_out;
    }

    console.log('Cleaned data to save:', cleanData);

    // Save to database (update, then insert if missing)
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update(cleanData)
      .eq('user_id', user.id)
      .select();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    if (!updateData || updateData.length === 0) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, ...cleanData });
      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }
    }

    // Verify the save by reading back
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, date_of_birth, medical_history, address, emergency_contact, ai_opt_out')
      .eq('user_id', user.id)
      .maybeSingle();

    if (verifyError) {
      console.error('Verification error:', verifyError);
      throw new Error('Failed to verify saved data');
    }

    console.log('Verified saved data:', verifyData);

    // Removed localStorage backup for security - sensitive PII should not be stored locally

    return { success: true, data: verifyData };
  } catch (error) {
    console.error('Profile save failed:', error);
    throw error;
  }
};

export const loadProfileData = async (user: User): Promise<ProfileData> => {
  try {
    console.log('Loading profile data for user:', user.id);

    // Try to load from database first
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, date_of_birth, medical_history, address, emergency_contact, ai_opt_out')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Database load error:', error);
      throw error;
    }

    const profileData: ProfileData = {
      first_name: data?.first_name || '',
      last_name: data?.last_name || '',
      phone: data?.phone || '',
      date_of_birth: data?.date_of_birth || '',
      medical_history: data?.medical_history || '',
      address: data?.address || '',
      emergency_contact: data?.emergency_contact || '',
      ai_opt_out: data?.ai_opt_out || false
    };

    return profileData;
  } catch (error) {
    console.error('Profile load failed:', error);
    
    // Removed localStorage fallback for security - sensitive PII should not be stored locally
    throw error;
  }
};

export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('Database connection successful');
    return { success: true };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return { success: false, error };
  }
};