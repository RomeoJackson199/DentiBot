// Test script to check AI function
// WARNING: This file contains test credentials - DO NOT use in production
const SUPABASE_URL = process.env.SUPABASE_URL || "https://gjvxcisbaxhhblhsytar.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdnhjaXNiYXhoaGJsaHN5dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU4MDUsImV4cCI6MjA2NzY0MTgwNX0.p4HO2McB5IqP9iQ_p_Z6yHKCkKyDXuIm7ono6UJZcmM";

async function testAIFunction() {
  try {
    console.log('Testing AI function...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/dental-ai-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Hello, I have a toothache",
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
      console.error('AI function error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('AI function response:', data);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Test profile saving
async function testProfileSaving() {
  try {
    console.log('Testing profile saving...');
    
    // This would require authentication, so we'll just test the endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Profile endpoint status:', response.status);
    
  } catch (error) {
    console.error('Profile test failed:', error);
  }
}

// Run tests
testAIFunction();
testProfileSaving();