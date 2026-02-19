// Test task completion with existing tasks
async function testTaskCompletionBetter() {
  console.log("🧪 Testing task completion with existing tasks...\n");
  
  // First, let's add a task
  console.log("Step 1: Adding a task...");
  const addResponse = await fetch("http://localhost:3000/api/ai/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      note: "add a task to prepare monthly report",
      model: "llama-3.3-70b-versatile",
      messages: [],
      tasks: []
    })
  });
  
  const addData = await addResponse.json();
  console.log(`Add result: ${addData.action} - "${addData.taskTitle}"`);
  
  // Now try to complete it
  console.log("\nStep 2: Completing the task...");
  const completeResponse = await fetch("http://localhost:3000/api/ai/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      note: "mark prepare monthly report as completed",
      model: "llama-3.3-70b-versatile",
      messages: [],
      tasks: [
        { id: "1", title: "Prepare monthly report", completed: false, confirmed: false, createdAt: Date.now() }
      ]
    })
  });
  
  const completeData = await completeResponse.json();
  console.log(`Complete result: ${completeData.action} - "${completeData.taskTitle}"`);
  console.log(`Message: "${completeData.nextStep}"`);
  
  // Try different phrasings
  const phrasings = [
    "finish the task prepare monthly report",
    "complete prepare monthly report",
    "mark prepare monthly report as done"
  ];
  
  for (let i = 0; i < phrasings.length; i++) {
    console.log(`\nStep ${i + 3}: Testing phrasing "${phrasings[i]}"...`);
    const response = await fetch("http://localhost:3000/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: phrasings[i],
        model: "llama-3.3-70b-versatile",
        messages: [],
        tasks: [
          { id: "1", title: "Prepare monthly report", completed: false, confirmed: false, createdAt: Date.now() }
        ]
      })
    });
    
    const data = await response.json();
    console.log(`Result: ${data.action} - "${data.taskTitle}"`);
  }
}

testTaskCompletionBetter().catch(console.error);