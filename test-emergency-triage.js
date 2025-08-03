const puppeteer = require('puppeteer');

async function testEmergencyTriage() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Testing emergency triage page...');
    
    // Navigate to the emergency triage page
    await page.goto('http://localhost:5173/emergency-triage', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait for the page to load
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Check if the page loaded correctly
    const title = await page.$eval('h1', el => el.textContent);
    console.log('Page title:', title);
    
    // Check for any error messages
    const errorElements = await page.$$('[class*="error"], [class*="Error"]');
    if (errorElements.length > 0) {
      console.log('Found error elements:', errorElements.length);
    }
    
    // Check if the main content is visible
    const content = await page.$eval('body', el => el.textContent);
    if (content.includes('Something went wrong')) {
      console.log('❌ ERROR: Page shows "Something went wrong"');
      return false;
    }
    
    console.log('✅ SUCCESS: Emergency triage page loaded correctly');
    return true;
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testEmergencyTriage();