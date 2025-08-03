// Simple test to check AI fallback responses without OpenAI API
const SUPABASE_URL = "https://gjvxcisbaxhhblhsytar.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdnhjaXNiYXhoaGJsaHN5dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU4MDUsImV4cCI6MjA2NzY0MTgwNX0.p4HO2McB5IqP9iQ_p_Z6yHKCkKyDXuIm7ono6UJZcmM";

async function testFallbackResponses() {
  const testMessages = [
    "I have a toothache",
    "I need an appointment",
    "Can you recommend a dentist?",
    "I need a cleaning",
    "My child needs dental care",
    "I need braces"
  ];

  for (const message of testMessages) {
    try {
      console.log(`\n--- Testing: "${message}" ---`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/dental-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversation_history: [],
          user_profile: {
            first_name: "Test",
            last_name: "User",
            email: "test@example.com"
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error:', response.status, errorText);
      } else {
        const data = await response.json();
        console.log('✅ Response:', data.response);
        console.log('📋 Suggestions:', data.suggestions);
        console.log('👨‍⚕️ Recommended dentists:', data.recommended_dentist);
        console.log('🔍 Consultation reason:', data.consultation_reason);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
}

testFallbackResponses();