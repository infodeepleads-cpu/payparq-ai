const https = require('https');

const PHONE_REGEX = /(?:\+|00)?[\d\s\-()]{7,20}/g;
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

async function testScrape(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const emails = data.match(EMAIL_REGEX) || [];
        const phones = data.match(PHONE_REGEX) || [];
        resolve({ 
          url, 
          emails: [...new Set(emails)].slice(0, 3),
          phones: [...new Set(phones)].slice(0, 3),
          totalEmails: emails.length
        });
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Testing parkos.eu scrape...');
  const parkos = await testScrape('https://www.parkos.eu');
  console.log('Parkos results:', JSON.stringify(parkos, null, 2));
  
  console.log('\nTesting parkvia.com scrape...');
  const parkvia = await testScrape('https://www.parkvia.com');
  console.log('Parkvia results:', JSON.stringify(parkvia, null, 2));
}

main().catch(console.error);
