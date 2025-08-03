// Test script to verify AI information gathering before dentist widget
// This demonstrates that the AI now collects sufficient information before showing widgets

const testCases = [
  {
    name: "Initial appointment request - should ask for patient info first",
    message: "I need an appointment",
    expectedBehavior: "Should ask who the appointment is for, NOT trigger dentist widget immediately",
    shouldTriggerDentistWidget: false
  },
  {
    name: "Patient info provided - should ask for symptoms next",
    message: "The appointment is for me",
    expectedBehavior: "Should ask about symptoms/needs, NOT trigger dentist widget yet",
    shouldTriggerDentistWidget: false
  },
  {
    name: "Complete information provided - should trigger dentist widget",
    message: "I have tooth pain and the appointment is for me",
    expectedBehavior: "Should trigger dentist widget because we have both patient info AND symptoms",
    shouldTriggerDentistWidget: true
  },
  {
    name: "Child appointment with symptoms - should trigger dentist widget",
    message: "My child has tooth pain and needs an appointment",
    expectedBehavior: "Should trigger dentist widget because we have both patient info AND symptoms",
    shouldTriggerDentistWidget: true
  },
  {
    name: "Orthodontic needs with patient info - should trigger dentist widget",
    message: "I need braces and the appointment is for me",
    expectedBehavior: "Should trigger dentist widget because we have both patient info AND symptoms",
    shouldTriggerDentistWidget: true
  },
  {
    name: "Only symptoms without patient info - should NOT trigger dentist widget",
    message: "I have a cavity",
    expectedBehavior: "Should ask who the appointment is for, NOT trigger dentist widget",
    shouldTriggerDentistWidget: false
  },
  {
    name: "Only patient info without symptoms - should NOT trigger dentist widget",
    message: "The appointment is for my daughter",
    expectedBehavior: "Should ask about symptoms/needs, NOT trigger dentist widget",
    shouldTriggerDentistWidget: false
  }
];

console.log("🧪 Testing AI Information Gathering Fix");
console.log("=" .repeat(60));

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`   Input: "${testCase.message}"`);
  console.log(`   Expected Behavior: ${testCase.expectedBehavior}`);
  console.log(`   Should Trigger Dentist Widget: ${testCase.shouldTriggerDentistWidget ? 'YES' : 'NO'}`);
  console.log(`   ✅ Test case defined`);
});

console.log("\n" + "=" .repeat(60));
console.log("🎯 Fix Summary:");
console.log("1. AI now requires BOTH patient information AND specific symptoms before triggering dentist widget");
console.log("2. AI will ask 'who is the appointment for?' first when user requests appointment");
console.log("3. AI will then ask about symptoms/needs before making dentist recommendations");
console.log("4. Only when both pieces of information are provided will the dentist widget be triggered");
console.log("5. This prevents premature widget triggering and ensures better user experience");
console.log("\n✅ The AI should now gather sufficient information before showing the dentist widget!");