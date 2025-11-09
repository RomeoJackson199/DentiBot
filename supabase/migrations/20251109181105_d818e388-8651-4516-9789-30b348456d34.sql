-- Sanitize AI configurations to remove salon/hairstylist references
UPDATE businesses
SET 
  ai_system_behavior = REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(ai_system_behavior, 'salon', 'clinic'),
        'Salon', 'Clinic'
      ),
      'hairstylist', 'dental professional'
    ),
    'Hairstylist', 'Dental Professional'
  )
WHERE ai_system_behavior ILIKE '%salon%' 
   OR ai_system_behavior ILIKE '%hairstylist%';

UPDATE businesses
SET 
  ai_greeting = REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(ai_greeting, 'salon', 'clinic'),
        'Salon', 'Clinic'
      ),
      'hairstylist', 'dental professional'
    ),
    'Hairstylist', 'Dental Professional'
  )
WHERE ai_greeting ILIKE '%salon%' 
   OR ai_greeting ILIKE '%hairstylist%';

-- Ensure all businesses have healthcare template type
UPDATE businesses
SET template_type = 'healthcare'
WHERE template_type IS NULL OR template_type != 'healthcare';

-- Set default AI configuration for businesses without custom settings
UPDATE businesses
SET 
  ai_system_behavior = 'You are a helpful AI assistant for a healthcare clinic. You help patients schedule appointments, answer questions about services, and provide general information. Always be professional, empathetic, and clear in your communication.',
  ai_greeting = 'Hello! 👋 Welcome to our clinic. I''m your AI assistant. How can I help you today?',
  ai_personality_traits = '["Professional", "Empathetic", "Patient", "Clear"]'::jsonb
WHERE ai_system_behavior IS NULL 
   OR ai_greeting IS NULL 
   OR ai_personality_traits IS NULL
   OR jsonb_array_length(ai_personality_traits) = 0;
