
async function testCRM() {
  console.log('Testing CRM actions...');
  const url = 'http://localhost:3000/api/ai/suggest';

  // Helper to send request
  const send = async (note, content, model = 'llama-3.1-8b-instant') => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content }],
          note,
          model
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('Request failed:', e.message);
      return null;
    }
  };

  // Test 1: Add CRM Contact
  console.log('\n--- Test 1: Add Contact ---');
  const addData = await send(
    'Add contact: John Doe, Paris, Decision Maker, Whale tier, 5000 capacity, entry status',
    'Add a new contact: John Doe from Paris, he is a decision maker for a big corporation (whale tier 7), estimated capacity 5000, status is entry.'
  );

  if (addData) {
    console.log('Action:', addData.action);
    console.log('Contact:', JSON.stringify(addData.crmContact, null, 2));
    
    if (addData.action === 'add_crm_contact' && addData.crmContact) {
      console.log('✅ PASS: Add action received');
      if (addData.crmContact.decisionMaker === 'John Doe' || addData.crmContact.decisionMaker === 'John Doe') {
         console.log('✅ PASS: Name match');
      }
      if (addData.crmContact.tier === 7) {
         console.log('✅ PASS: Tier match');
      }
    } else {
      console.log('❌ FAIL: Incorrect action or missing contact data');
    }
  }

  // Test 2: Update CRM Contact
  console.log('\n--- Test 2: Update Contact ---');
  const updateData = await send(
    'Update John Doe status to CONTRACT',
    'Update John Doe, set status to CONTRACT.',
    'llama-3.3-70b-versatile'
  );

  if (updateData) {
    console.log('Action:', updateData.action);
    console.log('Contact:', JSON.stringify(updateData.crmContact, null, 2));

    if (updateData.action === 'update_crm_contact' && updateData.crmContact) {
      console.log('✅ PASS: Update action received');
      if (updateData.crmContact.decisionStatus === 'CONTRACT') {
        console.log('✅ PASS: Status update match');
      }
    } else {
      console.log('❌ FAIL: Incorrect action or missing update data');
    }
  }
}

testCRM();
