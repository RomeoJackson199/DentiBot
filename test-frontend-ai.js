// Test script to check AI function from frontend perspective
const SUPABASE_URL = "https://gjvxcisbaxhhblhsytar.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdnhjaXNiYXhoaGJsaHN5dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU4MDUsImV4cCI6MjA2NzY0MTgwNX0.p4HO2McB5IqP9iQ_p_Z6yHKCkKyDXuIm7ono6UJZcmM";

async function testFrontendAI() {
  console.log('Testing AI function from frontend perspective...');
  
  const testCases = [
    {
      message: "Hello",
      description: "Simple greeting"
    },
    {
      message: "I have a toothache",
      description: "Pain complaint"
    },
    {
      message: "I need an appointment",
      description: "Appointment request"
    },
    {
      message: "Can you help me?",
      description: "General help request"
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n--- Testing: "${testCase.message}" (${testCase.description}) ---`);
      
      const startTime = Date.now();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/dental-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message,
          conversation_history: [],
          user_profile: {
            first_name: "Test",
            last_name: "User",
            email: "test@example.com"
          }
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error (${response.status}):`, errorText);
        console.error(`⏱️ Response time: ${responseTime}ms`);
      } else {
        const data = await response.json();
        console.log(`✅ Response (${responseTime}ms):`, data.response);
        console.log(`📋 Suggestions:`, data.suggestions);
        console.log(`👨‍⚕️ Recommended dentists:`, data.recommended_dentist);
      }
      
    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
    }
  }
}

// Test with different conversation histories
async function testWithHistory() {
  console.log('\n--- Testing with conversation history ---');
  
  const conversationHistory = [
    { message: "Hello", is_bot: false },
    { message: "Hi! How can I help you today?", is_bot: true },
    { message: "I have a toothache", is_bot: false }
  ];

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/dental-ai-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "It's been hurting for 2 days",
        conversation_history: conversationHistory,
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
      console.log('✅ Response with history:', data.response);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testFrontendAI().then(() => {
  return testWithHistory();
}).catch(console.error);