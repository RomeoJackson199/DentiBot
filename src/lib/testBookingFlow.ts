// Test utility for booking flow verification
import { supabase } from "@/integrations/supabase/client";

export interface TestBookingResult {
  success: boolean;
  message: string;
  appointmentId?: string;
  error?: string;
}

export async function testBookingFlow(): Promise<TestBookingResult> {
  try {
    // 1. Check user authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return {
        success: false,
        message: 'Authentication check failed',
        error: sessionError.message
      };
    }

    if (!session?.user) {
      return {
        success: false,
        message: 'User not authenticated',
        error: 'Please log in to test booking flow'
      };
    }

    // 2. Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: 'User profile not found',
        error: 'Please complete your profile setup'
      };
    }

    // 3. Check if dentists are available
    const { data: dentists, error: dentistError } = await supabase
      .from('dentists')
      .select(`
        id,
        profiles!inner(first_name, last_name)
      `)
      .limit(1);

    if (dentistError || !dentists || dentists.length === 0) {
      return {
        success: false,
        message: 'No dentists available',
        error: 'No dentists found in database'
      };
    }

    // 4. Test appointment creation
    const testAppointment = {
      patient_id: profile.id,
      dentist_id: dentists[0].id,
      appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      reason: 'Test booking flow verification',
      notes: 'This is a test appointment to verify the booking flow',
      urgency: 'medium' as const,
      status: 'confirmed' as const
    };

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(testAppointment)
      .select()
      .single();

    if (appointmentError) {
      return {
        success: false,
        message: 'Failed to create test appointment',
        error: appointmentError.message
      };
    }

    // 5. Clean up test appointment
    await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id);

    return {
      success: true,
      message: 'Booking flow test passed successfully',
      appointmentId: appointment.id
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: 'Test failed with unexpected error',
      error: errorMessage
    };
  }
}

export async function verifyDatabaseConnection(): Promise<TestBookingResult> {
  try {
    // Test basic database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: 'Database connection failed',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'Database connection successful'
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: 'Database connection test failed',
      error: errorMessage
    };
  }
}

export async function checkUserProfile(email: string): Promise<TestBookingResult> {
  try {
    // Look up profile by email (avoids admin API differences)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: 'User not found',
        error: `User ${email} does not exist or profile is not set up`
      };
    }

    return {
      success: true,
      message: `User profile found for ${email}`,
      appointmentId: profile.id
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: 'User profile check failed',
      error: errorMessage
    };
  }
}