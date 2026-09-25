// Read-only look at the user's login window: screenshot + recent console/network errors.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
  const port = fs.readFileSync(process.env.PROFILE + '/DevToolsActivePort', 'utf8').split('\n')[0];
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + port, defaultViewport: null });
  const pages = await browser.pages();
  for (const p of pages) console.log('page', p.url());
  const page = pages.find(p => p.url().includes('localhost')) || pages[0];
  await page.screenshot({ path: 'peek.png' });
  const info = await page.evaluate(() => ({
    toasts: [...document.querySelectorAll('[data-sonner-toast]')].map(t => t.innerText),
    button: [...document.querySelectorAll('button')].map(b => b.innerText + (b.disabled ? ' (disabled)' : '')),
    cookies: document.cookie.split(';').map(c => c.split('=')[0].trim()),
  }));
  console.log(JSON.stringify(info));
  browser.disconnect();
})();
