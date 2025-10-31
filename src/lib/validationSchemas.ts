/**
 * Centralized Zod validation schemas for the application
 * Ensures consistent validation across all forms
 */

import { z } from "zod";

// ==================== COMMON SCHEMAS ====================

export const emailSchema = z.string()
  .email("Please enter a valid email address")
  .min(1, "Email is required")
  .max(255, "Email is too long");

export const phoneSchema = z.string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    "Please enter a valid phone number")
  .optional()
  .or(z.literal(''));

export const nameSchema = z.string()
  .min(1, "Name is required")
  .max(100, "Name is too long")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens and apostrophes");

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number");

export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date (YYYY-MM-DD)");

export const timeSchema = z.string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)");

// ==================== USER & AUTHENTICATION ====================

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  dateOfBirth: dateSchema.optional(),
  address: z.string().max(500, "Address is too long").optional(),
  emergencyContact: z.string().max(255, "Emergency contact is too long").optional(),
  medicalHistory: z.string().max(5000, "Medical history is too long").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// ==================== APPOINTMENT BOOKING ====================

export const appointmentBookingSchema = z.object({
  dentistId: z.string().uuid("Please select a valid dentist"),
  appointmentDate: dateSchema,
  appointmentTime: timeSchema,
  reason: z.string()
    .min(3, "Please provide a reason for your visit")
    .max(500, "Reason is too long"),
  duration: z.number()
    .int("Duration must be a whole number")
    .min(15, "Minimum appointment duration is 15 minutes")
    .max(240, "Maximum appointment duration is 4 hours"),
  urgency: z.enum(['low', 'medium', 'high', 'emergency'], {
    errorMap: () => ({ message: "Please select a valid urgency level" }),
  }),
  notes: z.string()
    .max(1000, "Notes are too long")
    .optional(),
  isEmergency: z.boolean().optional(),
});

export const emergencyTriageSchema = z.object({
  painLevel: z.number()
    .int("Pain level must be a whole number")
    .min(0, "Pain level must be between 0 and 10")
    .max(10, "Pain level must be between 0 and 10"),
  symptoms: z.array(z.string()).min(1, "Please select at least one symptom"),
  duration: z.enum(['less_than_hour', 'few_hours', 'day', 'few_days', 'week_or_more']),
  description: z.string()
    .min(10, "Please provide more details about your condition")
    .max(2000, "Description is too long"),
  hasSwelling: z.boolean(),
  hasBleeding: z.boolean(),
  hasFever: z.boolean(),
  canEat: z.boolean(),
  canSleep: z.boolean(),
});

// ==================== MEDICAL RECORDS ====================

export const medicalRecordSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  diagnosis: z.string()
    .min(3, "Diagnosis is required")
    .max(1000, "Diagnosis is too long"),
  treatment: z.string()
    .min(3, "Treatment details are required")
    .max(2000, "Treatment details are too long"),
  notes: z.string()
    .max(5000, "Notes are too long")
    .optional(),
  followUpDate: dateSchema.optional(),
  attachments: z.array(z.string()).optional(),
});

export const prescriptionSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  medication: z.string()
    .min(2, "Medication name is required")
    .max(200, "Medication name is too long"),
  dosage: z.string()
    .min(1, "Dosage is required")
    .max(100, "Dosage description is too long"),
  frequency: z.string()
    .min(1, "Frequency is required")
    .max(200, "Frequency description is too long"),
  duration: z.string()
    .min(1, "Duration is required")
    .max(100, "Duration description is too long"),
  instructions: z.string()
    .max(1000, "Instructions are too long")
    .optional(),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
});

export const treatmentPlanSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  title: z.string()
    .min(3, "Treatment plan title is required")
    .max(200, "Title is too long"),
  description: z.string()
    .min(10, "Please provide a detailed description")
    .max(5000, "Description is too long"),
  estimatedCost: z.number()
    .nonnegative("Cost cannot be negative")
    .optional(),
  estimatedDuration: z.string()
    .max(100, "Duration description is too long")
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['proposed', 'approved', 'in_progress', 'completed', 'cancelled']),
  startDate: dateSchema.optional(),
  expectedCompletionDate: dateSchema.optional(),
});

// ==================== BUSINESS & DENTIST ====================

export const businessCreationSchema = z.object({
  name: z.string()
    .min(2, "Business name is required")
    .max(200, "Business name is too long"),
  slug: z.string()
    .min(3, "URL slug is required")
    .max(50, "URL slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  businessType: z.enum(['dental', 'salon', 'gym', 'medical', 'generic']),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string()
    .max(500, "Address is too long")
    .optional(),
  description: z.string()
    .max(2000, "Description is too long")
    .optional(),
  websiteUrl: z.string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal('')),
});

export const dentistProfileSchema = z.object({
  specialization: z.string()
    .max(200, "Specialization is too long")
    .optional(),
  licenseNumber: z.string()
    .max(100, "License number is too long")
    .optional(),
  yearsOfExperience: z.number()
    .int("Years of experience must be a whole number")
    .min(0, "Years of experience cannot be negative")
    .max(70, "Years of experience is too high")
    .optional(),
  bio: z.string()
    .max(2000, "Bio is too long")
    .optional(),
  languages: z.array(z.string()).optional(),
  availability: z.object({
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
    saturday: z.boolean(),
    sunday: z.boolean(),
  }).optional(),
});

// ==================== PAYMENT ====================

export const paymentRequestSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  amountCents: z.number()
    .int("Amount must be a whole number")
    .positive("Amount must be greater than zero"),
  description: z.string()
    .min(3, "Description is required")
    .max(500, "Description is too long"),
  dueDate: dateSchema.optional(),
  invoiceNumber: z.string()
    .max(50, "Invoice number is too long")
    .optional(),
  notes: z.string()
    .max(1000, "Notes are too long")
    .optional(),
});

// ==================== INVENTORY ====================

export const inventoryItemSchema = z.object({
  name: z.string()
    .min(2, "Item name is required")
    .max(200, "Item name is too long"),
  category: z.string()
    .max(100, "Category name is too long")
    .optional(),
  quantity: z.number()
    .int("Quantity must be a whole number")
    .nonnegative("Quantity cannot be negative"),
  minThreshold: z.number()
    .int("Threshold must be a whole number")
    .nonnegative("Threshold cannot be negative"),
  unitCostCents: z.number()
    .int("Cost must be a whole number")
    .nonnegative("Cost cannot be negative")
    .optional(),
  supplier: z.string()
    .max(200, "Supplier name is too long")
    .optional(),
  notes: z.string()
    .max(1000, "Notes are too long")
    .optional(),
});

// ==================== NOTIFICATIONS ====================

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  appointmentReminders: z.boolean(),
  promotions: z.boolean(),
  newsletters: z.boolean(),
  quietHoursStart: timeSchema.optional(),
  quietHoursEnd: timeSchema.optional(),
});

// ==================== CHAT & MESSAGES ====================

export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message is too long"),
  attachments: z.array(z.string()).optional(),
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Validate data against a schema and return typed result
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors: Record<string, string[]> = {};
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });
    return { success: false, errors };
  }
}

/**
 * Get user-friendly error messages from Zod errors
 */
export function getValidationErrorMessages(
  error: z.ZodError
): Record<string, string> {
  const messages: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    messages[path] = err.message;
  });
  return messages;
}

// ==================== TYPE EXPORTS ====================

export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type AppointmentBookingData = z.infer<typeof appointmentBookingSchema>;
export type EmergencyTriageData = z.infer<typeof emergencyTriageSchema>;
export type MedicalRecordData = z.infer<typeof medicalRecordSchema>;
export type PrescriptionData = z.infer<typeof prescriptionSchema>;
export type TreatmentPlanData = z.infer<typeof treatmentPlanSchema>;
export type BusinessCreationData = z.infer<typeof businessCreationSchema>;
export type DentistProfileData = z.infer<typeof dentistProfileSchema>;
export type PaymentRequestData = z.infer<typeof paymentRequestSchema>;
export type InventoryItemData = z.infer<typeof inventoryItemSchema>;
export type NotificationPreferencesData = z.infer<typeof notificationPreferencesSchema>;
export type ChatMessageData = z.infer<typeof chatMessageSchema>;
