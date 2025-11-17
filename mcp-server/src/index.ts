#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gjvxcisbaxhhblhsytar.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const server = new Server(
  {
    name: 'dental-practice-db',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'read_table',
        description: 'Read data from any table in the database. Supports filtering, ordering, and pagination.',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Name of the table to read from (e.g., appointments, profiles, dentists, businesses)',
            },
            columns: {
              type: 'string',
              description: 'Comma-separated list of columns to select (default: *)',
              default: '*',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions as key-value pairs (e.g., {"status": "pending", "dentist_id": "uuid"})',
              additionalProperties: true,
            },
            order_by: {
              type: 'string',
              description: 'Column to order by',
            },
            ascending: {
              type: 'boolean',
              description: 'Sort order (true for ascending, false for descending)',
              default: true,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of rows to return',
              default: 100,
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'create_appointment',
        description: 'Create a new appointment',
        inputSchema: {
          type: 'object',
          properties: {
            patient_id: { type: 'string', description: 'Patient profile ID (UUID)' },
            dentist_id: { type: 'string', description: 'Dentist ID (UUID)' },
            business_id: { type: 'string', description: 'Business ID (UUID)' },
            appointment_date: { type: 'string', description: 'Appointment date/time (ISO 8601 format)' },
            reason: { type: 'string', description: 'Reason for appointment' },
            status: { type: 'string', description: 'Appointment status', default: 'pending' },
            urgency: { type: 'string', description: 'Urgency level', default: 'medium' },
            duration_minutes: { type: 'number', description: 'Duration in minutes', default: 60 },
            notes: { type: 'string', description: 'Additional notes' },
          },
          required: ['patient_id', 'dentist_id', 'business_id', 'appointment_date', 'reason'],
        },
      },
      {
        name: 'update_appointment',
        description: 'Update an existing appointment',
        inputSchema: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string', description: 'Appointment ID (UUID)' },
            updates: {
              type: 'object',
              description: 'Fields to update',
              additionalProperties: true,
            },
          },
          required: ['appointment_id', 'updates'],
        },
      },
      {
        name: 'delete_appointment',
        description: 'Delete an appointment',
        inputSchema: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string', description: 'Appointment ID (UUID)' },
          },
          required: ['appointment_id'],
        },
      },
      {
        name: 'list_appointments',
        description: 'List appointments with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            business_id: { type: 'string', description: 'Filter by business ID' },
            dentist_id: { type: 'string', description: 'Filter by dentist ID' },
            patient_id: { type: 'string', description: 'Filter by patient ID' },
            status: { type: 'string', description: 'Filter by status' },
            date_from: { type: 'string', description: 'Filter appointments from this date (ISO 8601)' },
            date_to: { type: 'string', description: 'Filter appointments until this date (ISO 8601)' },
            limit: { type: 'number', description: 'Maximum results', default: 50 },
          },
        },
      },
      {
        name: 'execute_query',
        description: 'Execute a custom SQL query (SELECT only for safety)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'SQL SELECT query to execute',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_table_schema',
        description: 'Get the schema/structure of a table',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name',
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'insert_record',
        description: 'Insert a new record into any table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            data: { type: 'object', description: 'Record data as key-value pairs', additionalProperties: true },
          },
          required: ['table', 'data'],
        },
      },
      {
        name: 'update_record',
        description: 'Update a record in any table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            id: { type: 'string', description: 'Record ID' },
            data: { type: 'object', description: 'Fields to update', additionalProperties: true },
          },
          required: ['table', 'id', 'data'],
        },
      },
      {
        name: 'delete_record',
        description: 'Delete a record from any table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            id: { type: 'string', description: 'Record ID' },
          },
          required: ['table', 'id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'read_table': {
        let query = supabase.from(args.table).select(args.columns || '*');

        if (args.filter) {
          Object.entries(args.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (args.order_by) {
          query = query.order(args.order_by, { ascending: args.ascending ?? true });
        }

        if (args.limit) {
          query = query.limit(args.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'create_appointment': {
        const { data, error } = await supabase.from('appointments').insert(args).select().single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Appointment created successfully:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'update_appointment': {
        const { data, error } = await supabase
          .from('appointments')
          .update(args.updates)
          .eq('id', args.appointment_id)
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Appointment updated successfully:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'delete_appointment': {
        const { error } = await supabase.from('appointments').delete().eq('id', args.appointment_id);

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Appointment ${args.appointment_id} deleted successfully`,
            },
          ],
        };
      }

      case 'list_appointments': {
        let query = supabase.from('appointments').select('*');

        if (args.business_id) query = query.eq('business_id', args.business_id);
        if (args.dentist_id) query = query.eq('dentist_id', args.dentist_id);
        if (args.patient_id) query = query.eq('patient_id', args.patient_id);
        if (args.status) query = query.eq('status', args.status);
        if (args.date_from) query = query.gte('appointment_date', args.date_from);
        if (args.date_to) query = query.lte('appointment_date', args.date_to);

        query = query.order('appointment_date', { ascending: true }).limit(args.limit || 50);

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'execute_query': {
        if (!args.query.trim().toUpperCase().startsWith('SELECT')) {
          throw new Error('Only SELECT queries are allowed for safety');
        }

        const { data, error } = await supabase.rpc('exec_sql', { query: args.query });

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_table_schema': {
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', args.table)
          .eq('table_schema', 'public');

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'insert_record': {
        const { data, error } = await supabase.from(args.table).insert(args.data).select().single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Record created in ${args.table}:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'update_record': {
        const { data, error } = await supabase
          .from(args.table)
          .update(args.data)
          .eq('id', args.id)
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Record updated in ${args.table}:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'delete_record': {
        const { error } = await supabase.from(args.table).delete().eq('id', args.id);

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Record ${args.id} deleted from ${args.table}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Dental Practice MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
