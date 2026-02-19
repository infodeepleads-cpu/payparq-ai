// Comprehensive test for all AI task and CRM functionality
async function runComprehensiveTest() {
  console.log("🚀 Running comprehensive AI integration tests...\n");
  
  const tests = [
    {
      name: "Task Addition",
      prompt: "add a task to prepare monthly report",
      expectedAction: "add_task",
      expectedTitle: "prepare monthly report"
    },
    {
      name: "Task Completion", 
      prompt: "complete the task prepare monthly report",
      expectedAction: "complete_task",
      expectedTitle: "prepare monthly report"
    },
    {
      name: "Task Deletion",
      prompt: "delete the task prepare monthly report",
      expectedAction: "delete_task", 
      expectedTitle: "prepare monthly report"
    },
    {
      name: "CRM Contact Addition",
      prompt: "add a new CRM contact John Smith from New York, tier 3, estimated capacity 50, status ENTRY",
      expectedAction: "add_crm_contact",
      expectedContact: {
        decisionMaker: "John Smith",
        city: "New York", 
        tier: 3,
        estimatedCapacity: 50,
        decisionStatus: "ENTRY"
      }
    },
    {
      name: "CRM Contact Update",
      prompt: "update John Smith status to CONTRACT",
      expectedAction: "update_crm_contact",
      expectedContact: {
        decisionMaker: "John Smith",
        decisionStatus: "CONTRACT"
      }
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n📋 Test ${i + 1}: ${test.name}`);
    console.log(`Prompt: "${test.prompt}"`);
    
    try {
      const response = await fetch("http://localhost:3000/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: test.prompt,
          model: "llama-3.3-70b-versatile",
          messages: [],
          tasks: [],
          crmContacts: test.name.includes("Update") ? [
            { id: "1", decisionMaker: "John Smith", city: "New York", tier: 3, estimatedCapacity: 50, decisionStatus: "ENTRY", createdAt: Date.now() }
          ] : []
        })
      });

      if (!response.ok) {
        console.log(`❌ FAIL: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      // Check action
      if (data.action === test.expectedAction) {
        console.log(`✅ PASS: Action received (${data.action})`);
      } else {
        console.log(`❌ FAIL: Expected ${test.expectedAction}, got ${data.action || 'none'}`);
        continue;
      }
      
      // Check title for task operations
      if (test.expectedTitle && data.taskTitle) {
        const titleMatch = data.taskTitle.toLowerCase().includes(test.expectedTitle.toLowerCase());
        console.log(titleMatch ? `✅ PASS: Task title match` : `❌ FAIL: Task title mismatch`);
      }
      
      // Check contact for CRM operations
      if (test.expectedContact && data.crmContact) {
        let contactMatch = true;
        for (const [key, value] of Object.entries(test.expectedContact)) {
          if (data.crmContact[key] !== value) {
            contactMatch = false;
            break;
          }
        }
        console.log(contactMatch ? `✅ PASS: CRM contact data match` : `❌ FAIL: CRM contact data mismatch`);
      }
      
      // Check confirmation message
      if (data.nextStep && data.nextStep.length > 0) {
        console.log(`✅ PASS: Confirmation message received`);
      } else {
        console.log(`❌ FAIL: No confirmation message`);
      }
      
      passed++;
      
    } catch (error) {
      console.log(`❌ FAIL: ${error.message}`);
    }
  }
  
  console.log(`\n🎯 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("🎉 All tests passed! AI integration is working correctly.");
  } else {
    console.log(`⚠️  ${total - passed} tests failed. Please review the implementation.`);
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);