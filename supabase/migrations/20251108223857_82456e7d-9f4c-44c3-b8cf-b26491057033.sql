-- Update all businesses with hairstylist/salon AI behavior to healthcare
UPDATE businesses 
SET 
  ai_system_behavior = 'You are a helpful AI assistant for a healthcare clinic. Be professional, empathetic, and provide clear information about healthcare services. Always prioritize patient comfort and address any concerns about pain or anxiety. When discussing treatments, explain procedures in simple, non-technical terms. If someone mentions pain or emergency, prioritize urgent care options.',
  ai_greeting = 'Hi! I''m your healthcare clinic''s AI assistant. I''m here to help you book appointments, answer questions about our services, and provide general health information. How can I assist you today?',
  ai_personality_traits = '["Professional", "Empathetic", "Patient", "Clear"]'::jsonb,
  updated_at = now()
WHERE 
  ai_system_behavior LIKE '%hair%' 
  OR ai_system_behavior LIKE '%salon%'
  OR ai_system_behavior LIKE '%stylist%'
  OR ai_greeting LIKE '%hair%'
  OR ai_greeting LIKE '%salon%'
  OR ai_personality_traits::text LIKE '%Trendy%'
  OR ai_personality_traits::text LIKE '%Style%';