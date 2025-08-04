const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

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
      estimated_duration_weeks: 4,
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