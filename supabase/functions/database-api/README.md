# Database API Edge Function

HTTP API to access your Supabase database. Alternative to the MCP server for web/HTTP access.

## Endpoint

```
POST https://gjvxcisbaxhhblhsytar.supabase.co/functions/v1/database-api
```

## Usage Examples

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

## Available Actions

- `read_table` - Read from any table with filters
- `create_appointment` - Create new appointment
- `update_appointment` - Update existing appointment
- `delete_appointment` - Delete appointment
- `list_appointments` - List appointments with filters
- `insert_record` - Insert into any table
- `update_record` - Update any record
- `delete_record` - Delete any record
- `get_table_schema` - Get table structure
- `execute_query` - Run custom SELECT queries

## Security

This function uses the service role key and bypasses RLS. Use with caution.
