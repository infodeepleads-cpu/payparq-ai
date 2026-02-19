// Test script for task addition functionality
async function testTaskAddition() {
  const testCases = [
    {
      prompt: "hi llama can you add a task to call my boss about the project",
      expectedAction: "add_task",
      expectedTitle: "call my boss about the project"
    },
    {
      prompt: "add a task to review the quarterly report",
      expectedAction: "add_task", 
      expectedTitle: "review the quarterly report"
    },
    {
      prompt: "please create a task for team meeting tomorrow",
      expectedAction: "add_task",
      expectedTitle: "team meeting tomorrow"
    }
  ];

  console.log("🧪 Testing task addition functionality...\n");

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
          tasks: []
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
      if (data.nextStep && data.nextStep.toLowerCase().includes("added")) {
        console.log(`✅ PASS: Confirmation message: "${data.nextStep}"`);
      } else {
        console.log(`⚠️  WARN: No clear confirmation in: "${data.nextStep}"`);
      }
      
      console.log("");
      
    } catch (error) {
      console.log(`❌ FAIL: ${error.message}\n`);
    }
  }
  
  console.log("🎯 Task addition tests completed!");
}

// Run the test
testTaskAddition().catch(console.error);