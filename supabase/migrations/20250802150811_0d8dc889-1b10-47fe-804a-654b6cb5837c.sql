-- Fix the search path security issue for the new function
ALTER FUNCTION create_simple_appointment(UUID, UUID, TIMESTAMP WITH TIME ZONE, TEXT, urgency_level) 
SET search_path = 'public';