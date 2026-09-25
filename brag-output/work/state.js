const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
  const port = fs.readFileSync(process.env.PROFILE + '/DevToolsActivePort', 'utf8').split('\n')[0];
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + port, defaultViewport: null });
  const page = (await browser.pages()).find(p => p.url().includes('localhost'));
  console.log(JSON.stringify(await page.evaluate(() => {
    const form = document.querySelector('form');
    return {
      url: location.href,
      hydrated: !!form && Object.keys(form).some(k => k.startsWith('__react')),
      emailLen: document.querySelector('#email')?.value.length,
      pwLen: document.querySelector('#password')?.value.length,
      emailValid: document.querySelector('#email')?.validity.valid,
      button: document.querySelector('button[type=submit]')?.innerText,
      toasts: [...document.querySelectorAll('[data-sonner-toast]')].map(t => t.innerText),
      nextError: !!document.querySelector('nextjs-portal'),
    };
  })));
  await page.screenshot({ path: 'peek.png' });
  browser.disconnect();
})();
