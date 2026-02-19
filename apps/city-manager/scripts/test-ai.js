
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
      if (data.whatsappDraft) {
        console.log(`WhatsApp Draft: "${data.whatsappDraft}"`);
      } else {
        console.log('WhatsApp Draft: <empty>');
      }
      if (data.emailDraft) {
        console.log(`Email Draft: "${data.emailDraft}"`);
      } else {
        console.log('Email Draft: <empty>');
      }
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
  console.log(`Artifact Test WhatsApp Draft: "${data.whatsappDraft || '<empty>'}"`);
  console.log(`Artifact Test Email Draft: "${data.emailDraft || '<empty>'}"`);

  console.log('\nTests Completed.');
}

runTests();
