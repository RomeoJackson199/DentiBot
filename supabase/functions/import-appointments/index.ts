import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ImportJobConfig {
  dentist_id: string;
  import_type: 'appointments' | 'patients' | 'treatments' | 'financial';
  filename: string;
  file_size: number;
  timezone: string;
  mapping_config: Record<string, string>;
}

interface ProcessedRow {
  row_number: number;
  raw_data: any;
  processed_data?: any;
  status: 'success' | 'failed' | 'skipped';
  error_message?: string;
  created_record_id?: string;
  created_record_type?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get dentist profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'dentist') {
      return new Response(JSON.stringify({ error: 'Only dentists can import data' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: dentist } = await supabase
      .from('dentists')
      .select('id')
      .eq('profile_id', profile.id)
      .single()

    if (!dentist) {
      return new Response(JSON.stringify({ error: 'Dentist profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'process'
    const import_type = url.searchParams.get('type') || 'appointments'
    const filename = url.searchParams.get('filename') || 'upload.csv'
    const timezone = url.searchParams.get('tz') || 'UTC'

    // Read file data
    const fileData = await req.arrayBuffer()
    const fileSize = fileData.byteLength

    if (action === 'dry-run') {
      return await handleDryRun(dentist.id, fileData, filename, timezone, import_type as any)
    } else if (action === 'commit') {
      return await handleCommit(dentist.id, fileData, filename, timezone, import_type as any)
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Import error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleDryRun(dentist_id: string, fileData: ArrayBuffer, filename: string, timezone: string, import_type: string) {
  const rows = await parseFile(fileData, filename)
  
  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'No data found in file' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const processedRows: ProcessedRow[] = []
  let successCount = 0
  let errorCount = 0
  let warningCount = 0

  for (let i = 0; i < Math.min(rows.length, 100); i++) { // Preview first 100 rows
    const row = rows[i]
    const processedRow = await processRow(row, i + 1, import_type, dentist_id, true)
    processedRows.push(processedRow)
    
    if (processedRow.status === 'success') successCount++
    else if (processedRow.status === 'failed') errorCount++
    else warningCount++
  }

  const preview = processedRows.slice(0, 20).map(row => ({
    row: row.row_number,
    data: row.processed_data || row.raw_data,
    status: row.status,
    messages: row.error_message ? [row.error_message] : []
  }))

  return new Response(JSON.stringify({
    counts: {
      total: rows.length,
      to_create: successCount,
      to_match: 0,
      warnings: warningCount,
      errors: errorCount
    },
    preview
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleCommit(dentist_id: string, fileData: ArrayBuffer, filename: string, timezone: string, import_type: string) {
  const rows = await parseFile(fileData, filename)
  
  // Create import job
  const { data: job, error: jobError } = await supabase
    .from('import_jobs')
    .insert({
      dentist_id,
      filename,
      file_size: fileData.byteLength,
      total_rows: rows.length,
      import_type,
      timezone,
      status: 'processing'
    })
    .select()
    .single()

  if (jobError || !job) {
    throw new Error('Failed to create import job')
  }

  // Process rows in background
  processImportJob(job.id, rows, import_type, dentist_id)

  return new Response(JSON.stringify({
    job_id: job.id,
    message: 'Import started',
    total_rows: rows.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function processImportJob(job_id: string, rows: any[], import_type: string, dentist_id: string) {
  try {
    await supabase
      .from('import_jobs')
      .update({ started_at: new Date().toISOString() })
      .eq('id', job_id)

    let successCount = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const processedRow = await processRow(row, i + 1, import_type, dentist_id, false)
      
      // Save job item
      await supabase
        .from('import_job_items')
        .insert({
          job_id,
          row_number: processedRow.row_number,
          raw_data: processedRow.raw_data,
          processed_data: processedRow.processed_data,
          status: processedRow.status,
          error_message: processedRow.error_message,
          created_record_id: processedRow.created_record_id,
          created_record_type: processedRow.created_record_type
        })

      if (processedRow.status === 'success') successCount++

      // Update progress every 10 rows
      if (i % 10 === 0) {
        await supabase.rpc('update_import_job_progress', { p_job_id: job_id })
      }
    }

    // Final update
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job_id)
    
    await supabase.rpc('update_import_job_progress', { p_job_id: job_id })

  } catch (error) {
    console.error('Job processing error:', error)
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'failed',
        error_details: [{ error: error.message }]
      })
      .eq('id', job_id)
  }
}

async function parseFile(fileData: ArrayBuffer, filename: string): Promise<any[]> {
  const text = new TextDecoder().decode(fileData)
  
  if (filename.endsWith('.csv')) {
    return parseCsv(text)
  }
  
  throw new Error('Unsupported file format')
}

function parseCsv(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }
  
  return rows
}

async function processRow(row: any, rowNumber: number, import_type: string, dentist_id: string, dryRun: boolean): Promise<ProcessedRow> {
  try {
    if (import_type === 'appointments') {
      return await processAppointmentRow(row, rowNumber, dentist_id, dryRun)
    } else if (import_type === 'patients') {
      return await processPatientRow(row, rowNumber, dentist_id, dryRun)
    }
    
    throw new Error('Unsupported import type')
    
  } catch (error) {
    return {
      row_number: rowNumber,
      raw_data: row,
      status: 'failed',
      error_message: error.message
    }
  }
}

async function processAppointmentRow(row: any, rowNumber: number, dentist_id: string, dryRun: boolean): Promise<ProcessedRow> {
  // Map common field names
  const patientName = row['Patient Name'] || row['patient_name'] || row['name'] || ''
  const patientEmail = row['Patient Email'] || row['email'] || row['patient_email'] || ''
  const appointmentDate = row['Date'] || row['appointment_date'] || row['date'] || ''
  const appointmentTime = row['Time'] || row['appointment_time'] || row['time'] || ''
  const reason = row['Reason'] || row['reason'] || row['service'] || 'Consultation'
  const status = row['Status'] || row['status'] || 'confirmed'

  if (!patientName || !appointmentDate) {
    throw new Error('Missing required fields: Patient Name and Date')
  }

  // Parse date and time
  const dateTime = new Date(`${appointmentDate} ${appointmentTime || '09:00'}`)
  if (isNaN(dateTime.getTime())) {
    throw new Error('Invalid date format')
  }

  const processedData = {
    patient_name: patientName,
    patient_email: patientEmail,
    appointment_date: dateTime.toISOString(),
    reason,
    status: normalizeStatus(status),
    duration_minutes: 60,
    urgency: 'medium'
  }

  if (dryRun) {
    return {
      row_number: rowNumber,
      raw_data: row,
      processed_data: processedData,
      status: 'success'
    }
  }

  // Find or create patient
  let patient_id = null
  
  if (patientEmail) {
    const { data: existingPatient } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', patientEmail)
      .eq('role', 'patient')
      .single()
    
    patient_id = existingPatient?.id
  }

  if (!patient_id) {
    // Create patient profile
    const { data: newPatient, error: patientError } = await supabase
      .from('profiles')
      .insert({
        first_name: patientName.split(' ')[0] || patientName,
        last_name: patientName.split(' ').slice(1).join(' ') || '',
        email: patientEmail || `${patientName.toLowerCase().replace(/\s+/g, '.')}@imported.local`,
        role: 'patient'
      })
      .select('id')
      .single()

    if (patientError || !newPatient) {
      throw new Error('Failed to create patient')
    }
    patient_id = newPatient.id
  }

  // Create appointment
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      patient_id,
      dentist_id,
      appointment_date: dateTime.toISOString(),
      reason,
      status: normalizeStatus(status),
      duration_minutes: 60,
      urgency: 'medium',
      patient_name: patientName
    })
    .select('id')
    .single()

  if (appointmentError || !appointment) {
    throw new Error('Failed to create appointment')
  }

  return {
    row_number: rowNumber,
    raw_data: row,
    processed_data: processedData,
    status: 'success',
    created_record_id: appointment.id,
    created_record_type: 'appointment'
  }
}

async function processPatientRow(row: any, rowNumber: number, dentist_id: string, dryRun: boolean): Promise<ProcessedRow> {
  const firstName = row['First Name'] || row['first_name'] || ''
  const lastName = row['Last Name'] || row['last_name'] || ''
  const email = row['Email'] || row['email'] || ''
  const phone = row['Phone'] || row['phone'] || ''
  const dateOfBirth = row['Date of Birth'] || row['dob'] || row['birth_date'] || ''

  if (!firstName || !email) {
    throw new Error('Missing required fields: First Name and Email')
  }

  const processedData = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    date_of_birth: dateOfBirth
  }

  if (dryRun) {
    return {
      row_number: rowNumber,
      raw_data: row,
      processed_data: processedData,
      status: 'success'
    }
  }

  // Check if patient already exists
  const { data: existingPatient } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingPatient) {
    return {
      row_number: rowNumber,
      raw_data: row,
      processed_data: processedData,
      status: 'skipped',
      error_message: 'Patient already exists'
    }
  }

  // Create patient
  const { data: newPatient, error: patientError } = await supabase
    .from('profiles')
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      date_of_birth: dateOfBirth || null,
      role: 'patient'
    })
    .select('id')
    .single()

  if (patientError || !newPatient) {
    throw new Error('Failed to create patient')
  }

  return {
    row_number: rowNumber,
    raw_data: row,
    processed_data: processedData,
    status: 'success',
    created_record_id: newPatient.id,
    created_record_type: 'patient'
  }
}

function normalizeStatus(status: string): string {
  const normalized = status.toLowerCase().trim()
  if (['confirmed', 'scheduled'].includes(normalized)) return 'confirmed'
  if (['completed', 'done'].includes(normalized)) return 'completed'
  if (['cancelled', 'canceled'].includes(normalized)) return 'cancelled'
  if (['pending', 'waiting'].includes(normalized)) return 'pending'
  return 'confirmed'
}