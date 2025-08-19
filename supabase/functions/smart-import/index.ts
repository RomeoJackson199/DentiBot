import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface SmartImportResult {
  imported: number;
  patients_created: number;
  appointments_created: number;
  profiles_updated: number;
  errors: string[];
  job_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Smart import function called')
    
    // Get auth user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User authenticated:', user.id)

    // Get dentist profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'dentist') {
      console.error('User is not a dentist:', profile?.role)
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
      console.error('Dentist profile not found for profile:', profile.id)
      return new Response(JSON.stringify({ error: 'Dentist profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Dentist found:', dentist.id)

    const body = await req.json()
    const { file_content, detected_type, field_mapping, filename } = body

    if (!file_content || !detected_type) {
      console.error('Missing required data:', { file_content: !!file_content, detected_type })
      return new Response(JSON.stringify({ error: 'Missing file content or detected type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Processing smart import for type:', detected_type)

    const result = await processSmartImport(
      dentist.id,
      file_content,
      detected_type,
      field_mapping || {},
      filename || 'unknown.csv'
    )

    console.log('Import completed:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Smart import error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Import failed',
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processSmartImport(
  dentist_id: string,
  fileContent: string,
  detectedType: string,
  fieldMapping: Record<string, string>,
  filename: string
): Promise<SmartImportResult> {
  console.log('Processing smart import:', { detectedType, filename, fieldMappingCount: Object.keys(fieldMapping).length })
  
  const lines = fileContent.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return row
  })

  console.log(`Parsed ${rows.length} rows from file`)

  const result: SmartImportResult = {
    imported: 0,
    patients_created: 0,
    appointments_created: 0,
    profiles_updated: 0,
    errors: []
  }

  // Create import job for tracking
  const { data: job, error: jobError } = await supabase
    .from('import_jobs')
    .insert({
      dentist_id,
      filename,
      file_size: fileContent.length,
      total_rows: rows.length,
      import_type: detectedType,
      status: 'processing'
    })
    .select()
    .single()

  if (jobError || !job) {
    console.error('Failed to create import job:', jobError)
    throw new Error('Failed to create import job')
  }

  result.job_id = job.id
  console.log('Created import job:', job.id)

  // Process each row intelligently
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    
    try {
      if (detectedType === 'patients') {
        await processSmartPatient(row, fieldMapping, dentist_id)
        result.patients_created++
      } else if (detectedType === 'appointments') {
        await processSmartAppointment(row, fieldMapping, dentist_id)
        result.appointments_created++
      } else if (detectedType === 'treatments') {
        await processSmartTreatment(row, fieldMapping, dentist_id)
      }
      
      result.imported++
      
      // Save job item for tracking
      await supabase
        .from('import_job_items')
        .insert({
          job_id: job.id,
          row_number: i + 1,
          raw_data: row,
          status: 'success'
        })

    } catch (error) {
      console.error(`Row ${i + 1} failed:`, error)
      result.errors.push(`Row ${i + 1}: ${error.message}`)
      
      await supabase
        .from('import_job_items')
        .insert({
          job_id: job.id,
          row_number: i + 1,
          raw_data: row,
          status: 'failed',
          error_message: error.message
        })
    }
  }

  // Update job completion
  await supabase
    .from('import_jobs')
    .update({ 
      status: result.errors.length > 0 ? 'completed' : 'completed',
      completed_at: new Date().toISOString(),
      successful_rows: result.imported,
      failed_rows: result.errors.length,
      processed_rows: rows.length
    })
    .eq('id', job.id)

  console.log('Import completed:', result)
  return result
}

async function processSmartPatient(
  row: any,
  fieldMapping: Record<string, string>,
  dentist_id: string
) {
  // Extract patient data using smart mapping
  const patientData = extractMappedData(row, fieldMapping, {
    first_name: ['first_name', 'name'],
    last_name: ['last_name'],
    email: ['email'],
    phone: ['phone'],
    date_of_birth: ['dob'],
    address: ['address'],
    insurance_provider: ['insurance']
  })

  // Handle name field if no separate first/last
  if (!patientData.first_name && patientData.name) {
    const nameParts = patientData.name.split(' ')
    patientData.first_name = nameParts[0]
    patientData.last_name = nameParts.slice(1).join(' ')
  }

  // Validate required fields
  if (!patientData.first_name) {
    throw new Error('Patient name is required')
  }

  // Generate email if missing
  if (!patientData.email) {
    const nameSlug = `${patientData.first_name}.${patientData.last_name || 'patient'}`
      .toLowerCase().replace(/[^a-z.]/g, '')
    patientData.email = `${nameSlug}@imported.local`
  }

  // Check if patient already exists
  const { data: existingPatient } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', patientData.email)
    .eq('role', 'patient')
    .single()

  if (existingPatient) {
    // Update existing patient
    await supabase
      .from('profiles')
      .update({
        first_name: patientData.first_name,
        last_name: patientData.last_name,
        phone: patientData.phone,
        date_of_birth: patientData.date_of_birth,
        address: patientData.address,
        insurance_provider: patientData.insurance_provider,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPatient.id)
    
    return existingPatient.id
  }

  // Create new patient
  const { data: newPatient, error: patientError } = await supabase
    .from('profiles')
    .insert({
      first_name: patientData.first_name,
      last_name: patientData.last_name,
      email: patientData.email,
      phone: patientData.phone,
      date_of_birth: patientData.date_of_birth,
      address: patientData.address,
      insurance_provider: patientData.insurance_provider,
      role: 'patient'
    })
    .select('id')
    .single()

  if (patientError || !newPatient) {
    throw new Error(`Failed to create patient: ${patientError?.message}`)
  }

  return newPatient.id
}

async function processSmartAppointment(
  row: any,
  fieldMapping: Record<string, string>,
  dentist_id: string
) {
  // Extract appointment data
  const appointmentData = extractMappedData(row, fieldMapping, {
    patient_name: ['name', 'patient_name'],
    patient_email: ['email', 'patient_email'],
    date: ['date'],
    time: ['time'],
    reason: ['reason', 'service', 'procedure'],
    status: ['status'],
    notes: ['notes', 'comments']
  })

  // Validate required fields
  if (!appointmentData.patient_name || !appointmentData.date) {
    throw new Error('Patient name and date are required')
  }

  // Parse date and time
  let appointmentDateTime: Date
  try {
    const dateStr = appointmentData.date
    const timeStr = appointmentData.time || '09:00'
    appointmentDateTime = new Date(`${dateStr} ${timeStr}`)
    
    if (isNaN(appointmentDateTime.getTime())) {
      throw new Error('Invalid date format')
    }
  } catch (error) {
    throw new Error('Invalid date/time format')
  }

  // Find or create patient
  let patient_id: string | null = null

  if (appointmentData.patient_email) {
    const { data: existingPatient } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', appointmentData.patient_email)
      .eq('role', 'patient')
      .single()
    
    patient_id = existingPatient?.id || null
  }

  // Create patient if not found
  if (!patient_id) {
    const nameParts = appointmentData.patient_name.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ')
    
    const email = appointmentData.patient_email || 
      `${firstName}.${lastName || 'patient'}@imported.local`.toLowerCase().replace(/[^a-z.@]/g, '')

    const { data: newPatient, error: patientError } = await supabase
      .from('profiles')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: 'patient'
      })
      .select('id')
      .single()

    if (patientError || !newPatient) {
      throw new Error(`Failed to create patient: ${patientError?.message}`)
    }
    
    patient_id = newPatient.id
  }

  // Create appointment
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      patient_id,
      dentist_id,
      appointment_date: appointmentDateTime.toISOString(),
      reason: appointmentData.reason || 'Consultation',
      status: normalizeStatus(appointmentData.status),
      notes: appointmentData.notes,
      duration_minutes: 60,
      urgency: 'medium',
      patient_name: appointmentData.patient_name
    })
    .select('id')
    .single()

  if (appointmentError || !appointment) {
    throw new Error(`Failed to create appointment: ${appointmentError?.message}`)
  }

  return appointment.id
}

async function processSmartTreatment(
  row: any,
  fieldMapping: Record<string, string>,
  dentist_id: string
) {
  // Extract treatment data
  const treatmentData = extractMappedData(row, fieldMapping, {
    patient_name: ['name', 'patient_name'],
    procedure: ['procedure', 'treatment', 'service'],
    cost: ['cost', 'price', 'fee', 'amount'],
    date: ['date', 'treatment_date'],
    tooth: ['tooth', 'tooth_number'],
    notes: ['notes', 'description']
  })

  // Implementation for treatment plans
  console.log('Processing treatment:', treatmentData)
  // Add treatment plan logic here
}

function extractMappedData(
  row: any,
  fieldMapping: Record<string, string>,
  targetFields: Record<string, string[]>
): any {
  const result: any = {}

  for (const [targetField, possibleFields] of Object.entries(targetFields)) {
    // First try direct mapping
    for (const [originalField, mappedField] of Object.entries(fieldMapping)) {
      if (possibleFields.includes(mappedField) && row[originalField]) {
        result[targetField] = row[originalField]
        break
      }
    }

    // If not found, try fuzzy matching on original field names
    if (!result[targetField]) {
      for (const possibleField of possibleFields) {
        for (const [originalField, value] of Object.entries(row)) {
          if (originalField.toLowerCase().includes(possibleField.toLowerCase()) && value) {
            result[targetField] = value
            break
          }
        }
        if (result[targetField]) break
      }
    }
  }

  return result
}

function normalizeStatus(status: string): string {
  if (!status) return 'confirmed'
  
  const normalized = status.toLowerCase().trim()
  if (['confirmed', 'scheduled', 'booked'].includes(normalized)) return 'confirmed'
  if (['completed', 'done', 'finished'].includes(normalized)) return 'completed'
  if (['cancelled', 'canceled', 'cancelled'].includes(normalized)) return 'cancelled'
  if (['pending', 'waiting', 'tentative'].includes(normalized)) return 'pending'
  return 'confirmed'
}