# Database API Edge Function

HTTP API to access your Supabase database. Supports both **GET** (read-only) and **POST** (all operations) methods. Alternative to the MCP server for web/HTTP access.

## Endpoint

```
GET/POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api
```

## GET Requests (Read-Only)

Use query parameters for simple read operations:

### Search Patients
```bash
curl "https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api?action=search_patients&name=John&limit=10"
```

### Lookup Patient by Phone
```bash
curl "https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api?action=lookup_patient_by_phone&phone=%2B1234567890"
```

### Search Dentists
```bash
curl "https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api?action=search_dentists&specialization=orthodontics&limit=5"
```

### List Appointments
```bash
curl "https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api?action=list_appointments&business_id=uuid-here&status=pending"
```

### Read Any Table
```bash
curl "https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api?action=read_table&table=profiles&limit=10"
```

## POST Requests (All Operations)

Use JSON body for write operations and complex queries:

### Read Table
```bash
curl -X POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "read_table",
    "table": "appointments",
    "limit": 10
  }'
```

### Create Appointment
```bash
curl -X POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_appointment",
    "patient_id": "uuid-here",
    "dentist_id": "uuid-here",
    "business_id": "uuid-here",
    "appointment_date": "2025-12-01T10:00:00Z",
    "reason": "Dental checkup"
  }'
```

### List Appointments with Filters
```bash
curl -X POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list_appointments",
    "business_id": "uuid-here",
    "status": "pending",
    "limit": 20
  }'
```

### Update Appointment
```bash
curl -X POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update_appointment",
    "appointment_id": "uuid-here",
    "updates": {
      "status": "confirmed",
      "notes": "Patient confirmed"
    }
  }'
```

### Get Table Schema
```bash
curl -X POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_table_schema",
    "table": "appointments"
  }'
```

### Search Patients
```bash
curl -X POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "search_patients",
    "name": "John",
    "phone": "555",
    "limit": 10
  }'
```

### Get Patient Details
```bash
curl -X POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_patient",
    "patient_id": "uuid-here"
  }'
```

### Lookup Patient by Phone
```bash
curl -X POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "lookup_patient_by_phone",
    "phone": "+1234567890"
  }'
```

### Get Dentist Full Profile
```bash
curl -X POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_dentist",
    "dentist_id": "uuid-here"
  }'
```

### Search Dentists
```bash
curl -X POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "search_dentists",
    "name": "Smith",
    "specialization": "orthodontics",
    "business_id": "uuid-here"
  }'
```

## Available Actions

### GET-Supported (Read-Only)
- `read_table` - Read from any table with filters
- `list_appointments` - List appointments with filters
- `search_patients` - Search patients by name, phone, email, DOB
- `lookup_patient_by_phone` - Quick phone lookup (for voice AI)
- `search_dentists` - Search dentists by name, specialization, business

### All Actions (POST)
**Appointments**
- `create_appointment` - Create new appointment
- `update_appointment` - Update existing appointment
- `delete_appointment` - Delete appointment
- `list_appointments` - List appointments with filters

**Patients**
- `search_patients` - Search patients by name, phone, email, DOB
- `get_patient` - Get full patient details with history
- `lookup_patient_by_phone` - Quick phone lookup (for voice AI)

**Dentists**
- `search_dentists` - Search dentists by name, specialization, business
- `get_dentist` - Get full dentist profile with bio, stats, availability

**General Database**
- `read_table` - Read from any table with filters
- `insert_record` - Insert into any table
- `update_record` - Update any record
- `delete_record` - Delete any record
- `get_table_schema` - Get table structure
- `execute_query` - Run custom SELECT queries

## Security

This function uses the service role key and bypasses RLS. Use with caution.
