import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      // Read any table
      case 'read_table': {
        const { table, columns = '*', filter, order_by, ascending = true, limit = 100 } = params;
        let query = supabase.from(table).select(columns);

        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (order_by) {
          query = query.order(order_by, { ascending });
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        result = { success: true, data };
        break;
      }

      // Create appointment
      case 'create_appointment': {
        const { patient_id, dentist_id, business_id, appointment_date, reason, status, urgency, duration_minutes, notes } = params;
        const { data, error } = await supabase
          .from('appointments')
          .insert({
            patient_id,
            dentist_id,
            business_id,
            appointment_date,
            reason: reason || 'General consultation',
            status: status || 'pending',
            urgency: urgency || 'medium',
            duration_minutes: duration_minutes || 60,
            notes,
          })
          .select()
          .single();

        if (error) throw error;
        result = { success: true, data };
        break;
      }

      // Update appointment
      case 'update_appointment': {
        const { appointment_id, updates } = params;
        const { data, error } = await supabase
          .from('appointments')
          .update(updates)
          .eq('id', appointment_id)
          .select()
          .single();

        if (error) throw error;
        result = { success: true, data };
        break;
      }

      // Delete appointment
      case 'delete_appointment': {
        const { appointment_id } = params;
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointment_id);

        if (error) throw error;
        result = { success: true, message: `Appointment ${appointment_id} deleted` };
        break;
      }

      // List appointments with filters
      case 'list_appointments': {
        const { business_id, dentist_id, patient_id, status, date_from, date_to, limit = 50 } = params;
        let query = supabase.from('appointments').select('*');

        if (business_id) query = query.eq('business_id', business_id);
        if (dentist_id) query = query.eq('dentist_id', dentist_id);
        if (patient_id) query = query.eq('patient_id', patient_id);
        if (status) query = query.eq('status', status);
        if (date_from) query = query.gte('appointment_date', date_from);
        if (date_to) query = query.lte('appointment_date', date_to);

        query = query.order('appointment_date', { ascending: true }).limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        result = { success: true, data };
        break;
      }

      // Execute custom SQL SELECT query
      case 'execute_query': {
        const { query } = params;
        if (!query.trim().toUpperCase().startsWith('SELECT')) {
          throw new Error('Only SELECT queries are allowed');
        }

        const { data, error } = await supabase.rpc('exec_sql', { query });
        if (error) throw error;
        result = { success: true, data };
        break;
      }

      // Get table schema
      case 'get_table_schema': {
        const { table } = params;
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', table)
          .eq('table_schema', 'public');

        if (error) throw error;
        result = { success: true, data };
        break;
      }

      // Insert record
      case 'insert_record': {
        const { table, data: recordData } = params;
        const { data, error } = await supabase
          .from(table)
          .insert(recordData)
          .select()
          .single();

        if (error) throw error;
        result = { success: true, data };
        break;
      }

      // Update record
      case 'update_record': {
        const { table, id, data: recordData } = params;
        const { data, error } = await supabase
          .from(table)
          .update(recordData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        result = { success: true, data };
        break;
      }

      // Delete record
      case 'delete_record': {
        const { table, id } = params;
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;
        result = { success: true, message: `Record ${id} deleted from ${table}` };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Database API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
