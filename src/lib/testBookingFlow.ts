// Test utilities for booking flow
export interface BookingTestData {
  dentistId: string;
  patientId: string;
  appointmentDate: string;
  duration: number;
  reason: string;
}

export interface MockBookingResponse {
  success: boolean;
  appointmentId?: string;
  error?: string;
}

// Mock booking flow for testing
export const testBookingFlow = async (data: BookingTestData): Promise<MockBookingResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock validation
  if (!data.dentistId || !data.patientId) {
    return {
      success: false,
      error: 'Missing required fields',
    };
  }
  
  // Mock successful booking
  return {
    success: true,
    appointmentId: `apt-${Date.now()}`,
  };
};

export const generateMockAppointmentSlots = (date: string) => {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    slots.push({
      time: `${hour}:00`,
      available: Math.random() > 0.3, // 70% chance of being available
    });
    slots.push({
      time: `${hour}:30`,
      available: Math.random() > 0.3,
    });
  }
  return slots;
};

export const verifyDatabaseConnection = async (): Promise<boolean> => {
  // Mock database connection check
  return new Promise(resolve => {
    setTimeout(() => resolve(true), 1000);
  });
};

export const checkUserProfile = async (userId: string): Promise<any> => {
  // Mock user profile check
  return {
    id: userId,
    exists: true,
    valid: true,
  };
};