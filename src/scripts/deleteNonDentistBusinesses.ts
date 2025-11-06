import { supabase } from '@/integrations/supabase/client';

/**
 * Delete all businesses that are not dentist/healthcare clinics
 * Keeps only businesses with template_type = 'healthcare'
 */
export async function deleteNonDentistBusinesses() {
  try {
    // Get current user to check ownership
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // First, get all businesses owned by the user
    const { data: allBusinesses, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, slug, template_type')
      .eq('owner_profile_id', profile.id);

    if (fetchError) throw fetchError;

    console.log('All your businesses:', allBusinesses);

    // Filter to get non-healthcare businesses
    const nonDentistBusinesses = allBusinesses?.filter(
      (b) => b.template_type !== 'healthcare'
    ) || [];

    console.log('Businesses to delete:', nonDentistBusinesses);

    if (nonDentistBusinesses.length === 0) {
      console.log('No non-healthcare businesses found to delete');
      return { success: true, deletedCount: 0, message: 'No non-healthcare businesses found' };
    }

    const businessIdsToDelete = nonDentistBusinesses.map((b) => b.id);

    // Delete each business one by one with all its related data
    for (const business of nonDentistBusinesses) {
      console.log(`Deleting business: ${business.name} (${business.slug})`);
      
      // Delete all related data
      await supabase.from('homepage_settings').delete().eq('business_id', business.id);
      await supabase.from('business_services').delete().eq('business_id', business.id);
      await supabase.from('appointment_slots').delete().eq('business_id', business.id);
      await supabase.from('dentist_availability').delete().eq('business_id', business.id);
      await supabase.from('dentist_vacation_days').delete().eq('business_id', business.id);
      await supabase.from('dentist_capacity_settings').delete().eq('business_id', business.id);
      await supabase.from('appointment_types').delete().eq('business_id', business.id);
      await supabase.from('medical_records').delete().eq('business_id', business.id);
      await supabase.from('treatment_plans').delete().eq('business_id', business.id);
      await supabase.from('payment_requests').delete().eq('business_id', business.id);
      await supabase.from('appointments').delete().eq('business_id', business.id);
      await supabase.from('messages').delete().eq('business_id', business.id);
      await supabase.from('product_sales').delete().eq('business_id', business.id);
      await supabase.from('patient_preferences').delete().eq('business_id', business.id);
      await supabase.from('restaurant_staff_roles').delete().eq('business_id', business.id);
      await supabase.from('restaurant_staff_codes').delete().eq('business_id', business.id);
      await supabase.from('business_members').delete().eq('business_id', business.id);
      await supabase.from('session_business').delete().eq('business_id', business.id);
      
      // Finally delete the business itself
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', business.id);

      if (deleteError) {
        console.error(`Error deleting business ${business.name}:`, deleteError);
        throw deleteError;
      }
    }

    console.log(`Successfully deleted ${nonDentistBusinesses.length} non-dentist businesses`);
    
    return { 
      success: true, 
      deletedCount: nonDentistBusinesses.length,
      deletedBusinesses: nonDentistBusinesses.map(b => ({ name: b.name, slug: b.slug }))
    };
  } catch (error) {
    console.error('Error deleting non-dentist businesses:', error);
    throw error;
  }
}
