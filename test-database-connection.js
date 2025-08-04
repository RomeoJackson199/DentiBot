import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with actual credentials
const supabaseUrl = "https://gjvxcisbaxhhblhsytar.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdnhjaXNiYXhoaGJsaHN5dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU4MDUsImV4cCI6MjA2NzY0MTgwNX0.p4HO2McB5IqP9iQ_p_Z6yHKCkKyDXuIm7ono6UJZcmM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test 1: Check if treatment_plans table exists and has correct schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'treatment_plans')
      .eq('table_schema', 'public');

    if (schemaError) {
      console.error('Error checking schema:', schemaError);
      return;
    }

    console.log('Treatment plans table schema:');
    schemaData.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // Test 2: Try to insert a test treatment plan
    const testTreatmentPlan = {
      patient_id: '00000000-0000-0000-0000-000000000000', // Test patient ID
      dentist_id: '00000000-0000-0000-0000-000000000000', // Test dentist ID
      title: 'Test Treatment Plan',
      description: 'This is a test treatment plan',
      diagnosis: 'Test diagnosis',
      priority: 'normal',
      estimated_cost: 100.00,
      estimated_duration: '4 weeks',
      start_date: new Date().toISOString(),
      status: 'active'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('treatment_plans')
      .insert(testTreatmentPlan)
      .select();

    if (insertError) {
      console.error('Error inserting test treatment plan:', insertError);
    } else {
      console.log('Successfully inserted test treatment plan:', insertData);
      
      // Clean up - delete the test record
      const { error: deleteError } = await supabase
        .from('treatment_plans')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.error('Error deleting test record:', deleteError);
      } else {
        console.log('Successfully cleaned up test record');
      }
    }

  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

testDatabaseConnection();