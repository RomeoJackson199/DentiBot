// Comprehensive test to verify all AI improvements
const SUPABASE_URL = "https://gjvxcisbaxhhblhsytar.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdnhjaXNiYXhoaGJsaHN5dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU4MDUsImV4cCI6MjA2NzY0MTgwNX0.p4HO2McB5IqP9iQ_p_Z6yHKCkKyDXuIm7ono6UJZcmM";

async function testAIImprovements() {
  console.log('🧪 Testing AI Improvements...\n');

  const testCases = [
    {
      message: "I have a toothache",
      expected: {
        hasSpecificResponse: true,
        hasRecommendDentistSuggestion: true,
        hasNoDentistNames: true
      }
    },
    {
      message: "I need an appointment",
      expected: {
        hasSpecificResponse: true,
        hasSkipPatientSelection: true,
        hasNoDentistNames: true
      }
    },
    {
      message: "My child needs dental care",
      expected: {
        hasSpecificResponse: true,
        hasRecommendDentistSuggestion: true,
        hasNoDentistNames: true
      }
    },
    {
      message: "I need braces",
      expected: {
        hasSpecificResponse: true,
        hasRecommendDentistSuggestion: true,
        hasNoDentistNames: true
      }
    }
  ];

  let passedTests = 0;
  let totalTests = 0;

  for (const testCase of testCases) {
    try {
      console.log(`📝 Testing: "${testCase.message}"`);
      
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

      if (!response.ok) {
        console.error('❌ Error:', response.status);
        continue;
      }

      const data = await response.json();
      totalTests++;

      // Test 1: Check if response is specific and helpful
      const isSpecific = data.response && 
        data.response.length > 50 && 
        !data.response.includes("I'm here to help") &&
        data.response.includes("Can you tell me");
      
      if (isSpecific === testCase.expected.hasSpecificResponse) {
        console.log('✅ Response is specific and helpful');
        passedTests++;
      } else {
        console.log('❌ Response is too generic');
      }

      // Test 2: Check suggestions
      const hasRecommendDentist = data.suggestions && data.suggestions.includes('recommend-dentist');
      const hasSkipPatient = data.suggestions && data.suggestions.includes('skip-patient-selection');
      
      if (testCase.expected.hasRecommendDentistSuggestion && hasRecommendDentist) {
        console.log('✅ Has recommend-dentist suggestion');
        passedTests++;
      } else if (testCase.expected.hasSkipPatientSelection && hasSkipPatient) {
        console.log('✅ Has skip-patient-selection suggestion');
        passedTests++;
      } else {
        console.log('❌ Missing expected suggestion');
      }

      // Test 3: Check for no dentist names in response
      const hasNoDentistNames = !data.response.includes('Dr.') && 
        !data.response.includes('Firdaws') &&
        !data.response.includes('Virginie') &&
        !data.response.includes('Justine');
      
      if (hasNoDentistNames === testCase.expected.hasNoDentistNames) {
        console.log('✅ No specific dentist names in response');
        passedTests++;
      } else {
        console.log('❌ Response contains specific dentist names');
      }

      // Test 4: Check for duplicate suggestions
      const uniqueSuggestions = [...new Set(data.suggestions)];
      if (data.suggestions.length === uniqueSuggestions.length) {
        console.log('✅ No duplicate suggestions');
        passedTests++;
      } else {
        console.log('❌ Has duplicate suggestions');
      }

      console.log(`📋 Response: ${data.response.substring(0, 100)}...`);
      console.log(`🔧 Suggestions: ${data.suggestions}`);
      console.log(`👨‍⚕️ Recommended dentists: ${data.recommended_dentist}`);
      console.log('---\n');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  console.log(`🎯 Test Results: ${passedTests}/${totalTests * 4} checks passed`);
  
  if (passedTests === totalTests * 4) {
    console.log('🎉 All AI improvements are working correctly!');
  } else {
    console.log('⚠️ Some issues still need to be addressed');
  }
}

testAIImprovements();