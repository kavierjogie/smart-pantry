// Read-only: logs auth request URLs/status and console errors from the user's login window. No bodies, no inputs.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
  const port = fs.readFileSync(process.env.PROFILE + '/DevToolsActivePort', 'utf8').split('\n')[0];
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + port, defaultViewport: null });
  const page = (await browser.pages()).find(p => p.url().includes('localhost'));
  const strip = (u) => u.split('?')[0];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') console.log('console.' + m.type(), m.text().slice(0, 300)); });
  page.on('pageerror', e => console.log('pageerror', e.message.slice(0, 300)));
  page.on('requestfailed', r => console.log('FAILED', r.method(), strip(r.url()), r.failure()?.errorText));
  page.on('response', async r => { if (/supabase|dashboard/.test(r.url())) console.log(r.status(), r.request().method(), strip(r.url())); });
  page.on('framenavigated', f => { if (f === page.mainFrame()) console.log('navigated', f.url()); });
  setTimeout(() => { browser.disconnect(); process.exit(0); }, 10 * 60 * 1000);
})();
