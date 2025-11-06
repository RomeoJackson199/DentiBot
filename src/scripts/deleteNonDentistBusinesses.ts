import { supabase } from '@/integrations/supabase/client';

/**
 * Delete all businesses that are not dentist/healthcare clinics
 * Keeps only businesses with template_type = 'dentist' or 'healthcare'
 */
export async function deleteNonDentistBusinesses() {
  try {
    // First, get all businesses
    const { data: allBusinesses, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, slug, template_type');

    if (fetchError) throw fetchError;

    console.log('All businesses:', allBusinesses);

    // Filter to get non-dentist businesses
    const nonDentistBusinesses = allBusinesses?.filter(
      (b) => b.template_type !== 'dentist' && b.template_type !== 'healthcare'
    ) || [];

    console.log('Businesses to delete:', nonDentistBusinesses);

    if (nonDentistBusinesses.length === 0) {
      console.log('No non-dentist businesses found to delete');
      return { success: true, deletedCount: 0 };
    }

    const businessIdsToDelete = nonDentistBusinesses.map((b) => b.id);

    // Delete related data first (to avoid foreign key constraints)
    
    // Delete homepage settings
    await supabase
      .from('homepage_settings')
      .delete()
      .in('business_id', businessIdsToDelete);

    // Delete business services
    await supabase
      .from('business_services')
      .delete()
      .in('business_id', businessIdsToDelete);

    // Delete business members
    await supabase
      .from('business_members')
      .delete()
      .in('business_id', businessIdsToDelete);

    // Delete appointments
    await supabase
      .from('appointments')
      .delete()
      .in('business_id', businessIdsToDelete);

    // Delete appointment slots
    await supabase
      .from('appointment_slots')
      .delete()
      .in('business_id', businessIdsToDelete);

    // Delete session business entries
    await supabase
      .from('session_business')
      .delete()
      .in('business_id', businessIdsToDelete);

    // Finally, delete the businesses themselves
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .in('id', businessIdsToDelete);

    if (deleteError) throw deleteError;

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
