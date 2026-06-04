import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 } // iPhone viewport
  });
  const page = await context.newPage();
  
  try {
    console.log('🔍 Testing date picker sticky state fix...\n');
    console.log('Opening /app in mobile view (375x667)...');
    await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // Take screenshot to see initial state
    console.log('Initial page loaded.\n');
    
    // Look for hamburger or other navigation - on mobile we might need to scroll
    console.log('Looking for "Uredi pretragu" (edit search) button...');
    const editBtn = await page.getByText('Uredi pretragu').first();
    const visible = await editBtn.isVisible().catch(() => false);
    
    if (!visible) {
      console.log('Not visible yet, scrolling to find it...');
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
    }
    
    // Click the edit search button
    console.log('✓ Found button. Clicking "Uredi pretragu"...');
    await editBtn.click();
    await page.waitForTimeout(800);
    console.log('✓ Modal opened\n');
    
    // Find the date picker button (the one with "→" showing start → end time)
    console.log('Looking for date/time picker button in modal...');
    const pickerBtn = await page.locator('button').filter({ hasText: '→' }).first();
    const pickerVisible = await pickerBtn.isVisible().catch(() => false);
    
    if (pickerVisible) {
      console.log('✓ Found date picker button\n');
      
      // FIRST OPEN - click to open dropdown
      console.log('═ FIRST INTERACTION ═');
      console.log('Clicking date picker to open dropdown...');
      await pickerBtn.click();
      await page.waitForTimeout(500);
      
      const selectsVisible1 = await page.locator('select').first().isVisible().catch(() => false);
      console.log(`Dropdown opened on first click: ${selectsVisible1 ? '✓' : '✗'}`);
      
      if (selectsVisible1) {
        console.log('Selecting a date option...');
        await page.locator('select').first().selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        console.log('Closing by clicking "Potvrdi"...');
        await page.click('button:has-text("Potvrdi")');
        await page.waitForTimeout(500);
        console.log('✓ Dropdown closed\n');
      }
    }
    
    // CLOSE AND REOPEN MODAL
    console.log('═ CLOSE & REOPEN MODAL ═');
    console.log('Clicking "Odustani" to close modal...');
    await page.click('button:has-text("Odustani")');
    await page.waitForTimeout(600);
    console.log('✓ Modal closed\n');
    
    console.log('Clicking "Uredi pretragu" again to reopen modal...');
    const editBtn2 = await page.getByText('Uredi pretragu').first();
    await editBtn2.click();
    await page.waitForTimeout(800);
    console.log('✓ Modal reopened\n');
    
    // SECOND OPEN - the critical test
    console.log('═ SECOND INTERACTION (THE TEST) ═');
    console.log('Looking for date picker button in reopened modal...');
    const pickerBtn2 = await page.locator('button').filter({ hasText: '→' }).first();
    const pickerVisible2 = await pickerBtn2.isVisible().catch(() => false);
    
    if (pickerVisible2) {
      console.log('✓ Found button. Attempting to click it...');
      await pickerBtn2.click();
      await page.waitForTimeout(500);
      
      // Check if dropdown actually opened - THIS IS THE KEY TEST
      const selectsVisible2 = await page.locator('select').first().isVisible().catch(() => false);
      
      if (selectsVisible2) {
        console.log('\n✅ SUCCESS: Date picker dropdown OPENED on second attempt!');
        console.log('The sticky state bug is FIXED - component was properly remounted.');
        process.exit(0);
      } else {
        console.log('\n❌ FAILURE: Date picker dropdown did NOT open');
        console.log('The sticky state bug still exists - component state not reset.');
        process.exit(1);
      }
    } else {
      console.log('Could not find picker button in reopened modal');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Test error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
