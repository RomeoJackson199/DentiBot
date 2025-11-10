// Simple in-memory mock API for development and testing
// Provides basic endpoints for appointments, booking, medical records and analytics

import { v4 as uuidv4 } from 'uuid';

// ----- Types -----
export interface MockAppointment {
  id: string;
  appointment_date: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  notes?: string;
  dentist: {
    id: string;
    specialty?: string;
    profile: {
      id: string;
      first_name: string;
      last_name: string;
      phone?: string;
    };
  };
}

interface MockApiResponse<T> {
  data: T | null;
  error: string | null;
}

// ----- In-memory stores -----
const appointments: MockAppointment[] = [
  {
    id: uuidv4(),
    appointment_date: new Date().toISOString(),
    reason: 'Routine check-up',
    status: 'confirmed',
    urgency: 'low',
    dentist: {
      id: 'd1',
      specialty: 'General',
      profile: {
        id: 'p1',
        first_name: 'Alice',
        last_name: 'Smith',
        phone: '555-1234'
      }
    }
  },
];

const medicalRecords: Record<string, unknown[]> = {};

// ----- Helpers -----
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function simulate<T>(fn: () => T): Promise<MockApiResponse<T>> {
  try {
    await delay(200);
    const data = fn();
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

export async function getAppointments(): Promise<MockApiResponse<MockAppointment[]>> {
  return simulate(() => appointments);
}

export async function getAppointmentsWithRetry(retries = 3): Promise<MockApiResponse<MockAppointment[]>> {
  let lastError: string | null = null;
  for (let i = 0; i < retries; i++) {
    const res = await getAppointments();
    if (!res.error) return res;
    lastError = res.error;
  }
  return { data: null, error: lastError || 'Failed to load appointments' };
}

export async function bookAppointment(): Promise<MockApiResponse<{ confirmationId: string }>> {
  return simulate(() => {
    const confirmationId = uuidv4();
    appointments.push({
      id: confirmationId,
      appointment_date: new Date().toISOString(),
      reason: 'Emergency appointment',
      status: 'confirmed',
      urgency: 'high',
      dentist: {
        id: 'd1',
        specialty: 'General',
        profile: {
          id: 'p1',
          first_name: 'Alice',
          last_name: 'Smith',
          phone: '555-1234'
        }
      }
    });
    return { confirmationId };
  });
}

export async function saveMedicalRecord(record: Record<string, unknown>): Promise<MockApiResponse<Record<string, unknown>>> {
  return simulate(() => {
    const patientId = String(record.patientId);
    const list = medicalRecords[patientId] || [];
    const stored = { id: uuidv4(), ...record };
    list.push(stored);
    medicalRecords[patientId] = list;
    return stored;
  });
}

export async function getAnalytics(): Promise<MockApiResponse<{ totalVisits: number; streak: number }>> {
  return simulate(() => ({ totalVisits: 5, streak: 3 }));
}

export async function getTriageInfo(): Promise<MockApiResponse<{ message: string }>> {
  return simulate(() => ({ message: 'Triage system operational' }));
}

