import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  [key: string]: string;
}

interface ImportRequest {
  csvData: string;
  fieldMapping: Record<string, string>;
  importType: 'patients' | 'appointments' | 'inventory';
  dentistId: string;
  filename: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { csvData, fieldMapping, importType, dentistId, filename }: ImportRequest = await req.json();

    // Create import session
    const { data: importSession, error: sessionError } = await supabase
      .from('import_sessions')
      .insert({
        dentist_id: dentistId,
        filename,
        import_type: importType,
        field_mapping: fieldMapping,
        status: 'processing',
        created_by_user_id: req.headers.get('x-user-id')
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to create import session:', sessionError);
      return new Response(JSON.stringify({ error: 'Failed to create import session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse CSV data
    const rows = parseCSV(csvData);
    const totalRecords = rows.length;

    // Update session with total count
    await supabase
      .from('import_sessions')
      .update({ total_records: totalRecords })
      .eq('id', importSession.id);

    let successCount = 0;
    let failureCount = 0;
    const errors: any[] = [];

    // Process each row based on import type
    if (importType === 'patients') {
      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const profileData = mapRowToProfile(row, fieldMapping);
          
          // Check if profile already exists by email
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', profileData.email)
            .single();

          if (existing) {
            errors.push({
              row: i + 1,
              error: `Profile with email ${profileData.email} already exists`,
              data: row
            });
            failureCount++;
            continue;
          }

          // Create profile with incomplete status for imported patients
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              ...profileData,
              import_session_id: importSession.id,
              profile_completion_status: 'incomplete',
              role: 'patient'
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            errors.push({
              row: i + 1,
              error: profileError.message,
              data: row
            });
            failureCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Row processing error:', error);
          errors.push({
            row: i + 1,
            error: error.message,
            data: rows[i]
          });
          failureCount++;
        }
      }
    }

    // Update final session status
    await supabase
      .from('import_sessions')
      .update({
        successful_records: successCount,
        failed_records: failureCount,
        status: failureCount > 0 ? 'completed' : 'completed',
        error_details: errors,
        completed_at: new Date().toISOString()
      })
      .eq('id', importSession.id);

    return new Response(JSON.stringify({
      success: true,
      sessionId: importSession.id,
      totalRecords,
      successCount,
      failureCount,
      errors: errors.slice(0, 10) // Return first 10 errors for preview
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Import processing error:', error);
    return new Response(JSON.stringify({ 
      error: 'Import processing failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function parseCSV(csvData: string): CSVRow[] {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: CSVRow = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

function mapRowToProfile(row: CSVRow, fieldMapping: Record<string, string>): any {
  const profile: any = {};
  
  // Map fields based on field mapping configuration
  Object.entries(fieldMapping).forEach(([csvField, profileField]) => {
    if (row[csvField]) {
      if (profileField === 'date_of_birth' && row[csvField]) {
        // Handle date format conversion
        const dateValue = new Date(row[csvField]);
        if (!isNaN(dateValue.getTime())) {
          profile[profileField] = dateValue.toISOString().split('T')[0];
        }
      } else {
        profile[profileField] = row[csvField].trim();
      }
    }
  });

  // Ensure required fields have values
  if (!profile.email) {
    throw new Error('Email is required for profile creation');
  }

  // Generate user_id for imported patients (they'll need to register later)
  profile.user_id = crypto.randomUUID();
  
  return profile;
}