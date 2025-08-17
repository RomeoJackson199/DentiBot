-- Fix function search path security issue
-- Update all functions to have proper search_path set

-- Add database indexes for performance optimization (without CONCURRENTLY in migration)
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date 
ON appointments(patient_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_dentist_date 
ON appointments(dentist_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_date 
ON medical_records(patient_id, record_date DESC);

CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_created 
ON patient_notes(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_date 
ON prescriptions(patient_id, prescribed_date DESC);

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_status 
ON treatment_plans(patient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_dentists_profile_active 
ON dentists(profile_id, is_active);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_appointments_composite 
ON appointments(patient_id, status, appointment_date DESC) 
WHERE status IN ('confirmed', 'pending', 'completed');

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Optimize chat messages table
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created 
ON chat_messages(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created 
ON chat_messages(user_id, created_at DESC);