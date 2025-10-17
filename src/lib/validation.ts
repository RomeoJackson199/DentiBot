import { z } from 'zod';

export const businessOnboardingSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().optional().refine(
    (val) => !val || /^\+?[\d\s\-()]+$/.test(val),
    'Invalid phone number'
  ),
  specialtyType: z.enum([
    'dentist',
    'orthodontist',
    'periodontist',
    'endodontist',
    'oral_surgeon',
    'pediatric_dentist',
    'prosthodontist',
    'cosmetic_dentist'
  ], { errorMap: () => ({ message: 'Please select a specialty' }) }),
});

export const patientOnboardingSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string().trim().optional().refine(
    (val) => !val || /^\+?[\d\s\-()]+$/.test(val),
    'Invalid phone number'
  ),
});

export const signInSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type BusinessOnboardingInput = z.infer<typeof businessOnboardingSchema>;
export type PatientOnboardingInput = z.infer<typeof patientOnboardingSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
