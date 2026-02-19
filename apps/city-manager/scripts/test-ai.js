
// Using standard fetch available in Node 18+

async function testProvider(name, model) {
  console.log(`\nTesting ${name} (${model})...`);
  try {
    const response = await fetch('http://localhost:3000/api/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Say "hello world" only.' }],
        model: model, // This triggers the specific provider logic in route.ts
        note: 'Integration Test'
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ ${name} Failed: ${response.status} ${response.statusText}`);
      console.error(`Error details: ${text}`);
      return false;
    }

    const data = await response.json();
    if (data.nextStep) {
      // Success if we get a response
      console.log(`✅ ${name} Success! Response: "${data.nextStep.substring(0, 100).replace(/\n/g, ' ')}..."`);
      return true;
    } else {
      console.error(`❌ ${name} Invalid response structure:`, data);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${name} Connection Error: ${error.message}`);
    if (error.cause) console.error('Cause:', error.cause);
    return false;
  }
}

async function runTests() {
  console.log('Starting Integration Tests for AI Providers...');
  
  // Test 1: Gemini (Google)
  await testProvider('Gemini', 'gemini-1.5-flash');

  // Test 2: Groq (Llama)
  // The route.ts logic checks for "llama", "mixtral", or "gemma2" in the model name
  await testProvider('Groq', 'llama-3.1-8b-instant');
  await testProvider('Groq', 'llama-3.3-70b-versatile');

  // Test 3: Artifact removal check
  console.log('\nTesting artifact removal with meeting reminder note...');
  const response = await fetch('http://localhost:3000/api/ai/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Please create a reminder and email subject for a meeting today at 12:00.' }],
      model: 'llama-3.3-70b-versatile',
      note: 'Reminder: Meeting today at 12:00\nSubject: Meeting Today at 12:00'
    })
  });
  const data = await response.json();
  console.log(`Artifact Test nextStep: "${(data.nextStep || '').substring(0, 80)}..."`);
  
  // Test 4: Task Addition
  console.log('\nTesting task addition...');
  const taskResponse = await fetch('http://localhost:3000/api/ai/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Please add a task to call my boss.' }],
      model: 'llama-3.1-8b-instant',
      note: 'Add task: Call my boss'
    })
  });
  const taskData = await taskResponse.json();
  console.log(`Task Test nextStep: "${(taskData.nextStep || '').substring(0, 80)}..."`);
  if (taskData.action === 'add_task' && taskData.taskTitle === 'Call my boss') {
    console.log('✅ Task Addition Action received correctly!');
  } else {
    console.log(`❌ Task Addition Failed. Action: ${taskData.action}, Title: ${taskData.taskTitle}`);
  }

  // Test 5: Task Completion
  console.log('\nTesting task completion...');
  const completeResponse = await fetch('http://localhost:3000/api/ai/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Mark "Call my boss" as completed.' }],
      model: 'llama-3.1-8b-instant',
      tasks: [{ id: '1', title: 'Call my boss', completed: false }],
      note: 'Complete task: Call my boss'
    })
  });
  const completeData = await completeResponse.json();
  if (completeData.action === 'complete_task' && completeData.taskTitle === 'Call my boss') {
    console.log('✅ Task Completion Action received correctly!');
  } else {
    console.log(`❌ Task Completion Failed. Action: ${completeData.action}, Title: ${completeData.taskTitle}`);
  }

  // Test 6: Task Deletion
  console.log('\nTesting task deletion...');
  const deleteResponse = await fetch('http://localhost:3000/api/ai/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Remove the "Call my boss" task.' }],
      model: 'llama-3.1-8b-instant',
      tasks: [{ id: '1', title: 'Call my boss', completed: true }],
      note: 'Delete task: Call my boss'
    })
  });
  const deleteData = await deleteResponse.json();
  if (deleteData.action === 'delete_task' && deleteData.taskTitle === 'Call my boss') {
    console.log('✅ Task Deletion Action received correctly!');
  } else {
    console.log(`❌ Task Deletion Failed. Action: ${deleteData.action}, Title: ${deleteData.taskTitle}`);
  }

  console.log('\nTests Completed.');
}

runTests();
