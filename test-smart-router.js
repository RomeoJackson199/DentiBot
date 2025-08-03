// Test script to check smart router functionality
const SUPABASE_URL = "https://gjvxcisbaxhhblhsytar.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdnhjaXNiYXhoaGJsaHN5dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU4MDUsImV4cCI6MjA2NzY0MTgwNX0.p4HO2McB5IqP9iQ_p_Z6yHKCkKyDXuIm7ono6UJZcmM";

async function testSmartRouter() {
  const testCases = [
    // Dental-related questions (should route to dental-ai-chat)
    {
      message: "I have a toothache",
      expected: "dental-ai-chat",
      description: "Dental pain"
    },
    {
      message: "I need an appointment with a dentist",
      expected: "dental-ai-chat", 
      description: "Dental appointment"
    },
    {
      message: "Can you recommend a dentist?",
      expected: "dental-ai-chat",
      description: "Dentist recommendation"
    },
    {
      message: "I need braces",
      expected: "dental-ai-chat",
      description: "Orthodontic treatment"
    },
    {
      message: "J'ai mal aux dents",
      expected: "dental-ai-chat",
      description: "French dental pain"
    },
    
    // General questions (should route to general-ai-chat)
    {
      message: "What's the weather like today?",
      expected: "general-ai-chat",
      description: "Weather question"
    },
    {
      message: "How do I cook pasta?",
      expected: "general-ai-chat",
      description: "Cooking question"
    },
    {
      message: "What is the capital of France?",
      expected: "general-ai-chat",
      description: "Geography question"
    },
    {
      message: "Can you help me with math?",
      expected: "general-ai-chat",
      description: "Math question"
    },
    {
      message: "Hello, how are you?",
      expected: "general-ai-chat",
      description: "General greeting"
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n--- Testing: "${testCase.message}" (${testCase.description}) ---`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/smart-ai-router`, {
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error:', response.status, errorText);
      } else {
        const data = await response.json();
        const actualRoute = data.routed_to;
        const isCorrect = actualRoute === testCase.expected;
        
        console.log(`✅ Response: ${data.response}`);
        console.log(`🛣️  Routed to: ${actualRoute} (expected: ${testCase.expected})`);
        console.log(`📊 Is dental: ${data.is_dental}`);
        console.log(`🎯 Correct routing: ${isCorrect ? '✅' : '❌'}`);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
}

testSmartRouter();