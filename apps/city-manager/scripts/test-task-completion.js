// Test script for task completion functionality
async function testTaskCompletion() {
  const testCases = [
    {
      prompt: "complete the task call my boss about the project",
      expectedAction: "complete_task",
      expectedTitle: "call my boss about the project"
    },
    {
      prompt: "mark review quarterly report as done",
      expectedAction: "complete_task",
      expectedTitle: "review quarterly report"
    }
  ];

  console.log("🧪 Testing task completion functionality...\n");

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`Test ${i + 1}: "${test.prompt}"`);
    
    try {
      const response = await fetch("http://localhost:3000/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: test.prompt,
          model: "llama-3.3-70b-versatile",
          messages: [],
          tasks: [
            { id: "1", title: "Call my boss about the project", completed: false, confirmed: false, createdAt: Date.now() },
            { id: "2", title: "Review quarterly report", completed: false, confirmed: false, createdAt: Date.now() }
          ]
        })
      });

      if (!response.ok) {
        console.log(`❌ FAIL: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      // Check if action is correct
      if (data.action === test.expectedAction) {
        console.log(`✅ PASS: Action received (${data.action})`);
      } else {
        console.log(`❌ FAIL: Expected ${test.expectedAction}, got ${data.action || 'none'}`);
      }
      
      // Check if task title is present
      if (data.taskTitle) {
        console.log(`✅ PASS: Task title received: "${data.taskTitle}"`);
      } else {
        console.log(`❌ FAIL: No task title received`);
      }
      
      // Check confirmation message
      if (data.nextStep && data.nextStep.toLowerCase().includes("completed")) {
        console.log(`✅ PASS: Confirmation message: "${data.nextStep}"`);
      } else {
        console.log(`⚠️  WARN: No clear completion confirmation in: "${data.nextStep}"`);
      }
      
      console.log("");
      
    } catch (error) {
      console.log(`❌ FAIL: ${error.message}\n`);
    }
  }
  
  console.log("🎯 Task completion tests completed!");
}

// Run the test
testTaskCompletion().catch(console.error);