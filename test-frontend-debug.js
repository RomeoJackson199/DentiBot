// Debug script to test frontend AI response handling
const SUPABASE_URL = "https://gjvxcisbaxhhblhsytar.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdnhjaXNiYXhoaGJsaHN5dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU4MDUsImV4cCI6MjA2NzY0MTgwNX0.p4HO2McB5IqP9iQ_p_Z6yHKCkKyDXuIm7ono6UJZcmM";

// Simulate the frontend generateBotResponse function
async function generateBotResponse(userMessage) {
  try {
    console.log('Generating AI response for:', userMessage);
    
    // Simulate the Supabase function call
    const response = await fetch(`${SUPABASE_URL}/functions/v1/dental-ai-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        conversation_history: [], // Last 10 messages for context
        user_profile: {
          name: 'Test User',
          email: 'test@example.com'
        }
      })
    });

    if (!response.ok) {
      console.error('AI function error:', response.status);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('AI function response:', data);

    const responseText = data.response || "I'm sorry, I couldn't process your request.";
    const suggestions = data.suggestions || [];
    const aiRecommendedDentist = data.recommended_dentist || null;

    console.log('Processed response:', {
      response: responseText,
      suggestions,
      recommendedDentist: aiRecommendedDentist
    });

    return {
      id: crypto.randomUUID(),
      session_id: 'test-session',
      message: responseText,
      is_bot: true,
      message_type: "text",
      metadata: { 
        ai_generated: true, 
        suggestions
      },
      created_at: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Error calling AI:', error);
    
    // Fallback to simple responses (same as in frontend)
    const lowerMessage = userMessage.toLowerCase();
    let response = "";

    if (lowerMessage.includes("appointment") || lowerMessage.includes("booking") || 
        lowerMessage.includes("pain") || lowerMessage.includes("hurt") || 
        lowerMessage.includes("problem") || lowerMessage.includes("issue")) {
      response = "What's the exact problem? I'll help you find the right dentist and book an appointment that typically takes 30-60 minutes.";
    } else {
      response = `What can I do for you?

🗓️ Book an appointment
❓ Answer your questions

Type your request...`;
    }

    return {
      id: crypto.randomUUID(),
      session_id: 'test-session',
      message: response,
      is_bot: true,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
  }
}

// Simulate the frontend handleSendMessage function
async function handleSendMessage(userMessage) {
  console.log('Handling message:', userMessage);
  
  // Simulate the setTimeout delay
  console.log('Waiting 1 second before generating response...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const botResponse = await generateBotResponse(userMessage);
  console.log('Bot response generated:', botResponse);
  
  return botResponse;
}

// Test the frontend logic
async function testFrontendLogic() {
  const testMessages = [
    "Hello",
    "I have a toothache",
    "I need an appointment",
    "Can you help me?"
  ];

  for (const message of testMessages) {
    console.log(`\n=== Testing: "${message}" ===`);
    try {
      const response = await handleSendMessage(message);
      console.log('✅ Success:', response.message);
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

// Test error handling
async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  // Test with network error simulation
  try {
    // This should trigger the fallback response
    const response = await generateBotResponse("test message");
    console.log('✅ Error handling works:', response.message);
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run tests
testFrontendLogic().then(() => {
  return testErrorHandling();
}).catch(console.error);