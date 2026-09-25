// Reload the user's login window and report whether React hydrated (no input touched).
const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
  const port = fs.readFileSync(process.env.PROFILE + '/DevToolsActivePort', 'utf8').split('\n')[0];
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + port, defaultViewport: null });
  const page = (await browser.pages()).find(p => p.url().includes('localhost'));
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  page.on('requestfailed', r => errs.push('FAILED ' + r.url().split('?')[0] + ' ' + r.failure()?.errorText));
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle2', timeout: 120000 });
  await new Promise(r => setTimeout(r, 3000));
  const hydrated = await page.evaluate(() => {
    const form = document.querySelector('form');
    return !!form && Object.keys(form).some(k => k.startsWith('__react'));
  });
  console.log(JSON.stringify({ hydrated, errs }));
  browser.disconnect();
})();
