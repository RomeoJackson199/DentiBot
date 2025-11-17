# Dental Practice MCP Server

MCP server providing full access to your Supabase dental practice database.

## Features

- **Read any table** with filtering, ordering, and pagination
- **Manage appointments**: create, update, delete, list with filters
- **Full database access**: insert, update, delete records in any table
- **Execute custom queries**: run SELECT queries safely
- **Schema inspection**: get table structure information

## Setup

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Set your Supabase service role key:
```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

You can find your service role key at:
https://supabase.com/dashboard/project/gjvxcisbaxhhblhsytar/settings/api

⚠️ **Important**: The service role key has full database access. Keep it secure and never commit it to version control.

3. Build the server:
```bash
npm run build
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Connect to Claude Desktop

Add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "dental-practice": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key-here"
      }
    }
  }
}
```

## Available Tools

### read_table
Read data from any table with filters, ordering, and pagination.

Example:
```
Read appointments where status is "pending" ordered by date
```

### create_appointment
Create a new appointment with all required fields.

### update_appointment
Update an existing appointment by ID.

### delete_appointment
Delete an appointment by ID.

### list_appointments
List appointments with optional filters (business, dentist, patient, status, date range).

### insert_record
Insert a new record into any table.

### update_record
Update a record in any table by ID.

### delete_record
Delete a record from any table by ID.

### execute_query
Execute custom SELECT queries for advanced operations.

### get_table_schema
Get the structure/schema of any table.

## Security

This server uses the Supabase service role key which bypasses Row Level Security (RLS) policies. It has full access to your database. Use it carefully and only in trusted environments.

## Database Tables

Main tables available:
- `appointments` - Patient appointments
- `profiles` - User profiles
- `dentists` - Dentist information
- `businesses` - Business/clinic information
- `medical_records` - Patient medical records
- `treatment_plans` - Treatment plans
- `payment_requests` - Payment requests
- `appointment_slots` - Available appointment slots
- And many more...

## Example Queries

**List today's appointments:**
```
List appointments where date_from is today
```

**Create an appointment:**
```
Create an appointment for patient [patient_id] with dentist [dentist_id] at [date/time] for [reason]
```

**Get all patients:**
```
Read table profiles where role is patient
```

**Update appointment status:**
```
Update appointment [id] set status to completed
```
