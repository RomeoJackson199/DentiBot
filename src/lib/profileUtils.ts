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
    console.log('Saving profile data for user:', user.id);
    console.log('Profile data to save:', profileData);

    // Validate required fields
    if (!profileData.first_name || !profileData.last_name) {
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
    // Temporarily comment out ai_opt_out until migration is applied
    // if (profileData.ai_opt_out !== undefined) {
    //   cleanData.ai_opt_out = profileData.ai_opt_out;
    // }

    console.log('Cleaned data to save:', cleanData);

    // Save to database
    const { data, error } = await supabase
      .from('profiles')
      .update(cleanData)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Database save error:', error);
      throw error;
    }

    console.log('Database save successful:', data);

    // Verify the save by reading back
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (verifyError) {
      console.error('Verification error:', verifyError);
      throw new Error('Failed to verify saved data');
    }

    console.log('Verified saved data:', verifyData);

    // Also save to localStorage as backup
    localStorage.setItem('profile_backup', JSON.stringify(cleanData));

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
      .select('first_name, last_name, phone, date_of_birth, medical_history, address, emergency_contact')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database load error:', error);
      throw error;
    }

    console.log('Loaded profile data from database:', data);

    const profileData: ProfileData = {
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      phone: data.phone || '',
      date_of_birth: data.date_of_birth || '',
      medical_history: data.medical_history || '',
      address: data.address || '',
      emergency_contact: data.emergency_contact || '',
      ai_opt_out: false // Temporarily set to false until migration is applied
    };

    console.log('Processed profile data:', profileData);

    // Log specific field values for debugging
    console.log('Field values:');
    console.log('- Address:', data.address);
    console.log('- Emergency contact:', data.emergency_contact);
    console.log('- Date of birth:', data.date_of_birth);
    console.log('- Medical history:', data.medical_history);

    return profileData;
  } catch (error) {
    console.error('Profile load failed:', error);
    
    // Try to load from localStorage backup
    const backup = localStorage.getItem('profile_backup');
    if (backup) {
      console.log('Loading from localStorage backup');
      return JSON.parse(backup);
    }
    
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