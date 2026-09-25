// Opens a visible Chrome with a persistent profile ($PROFILE, outside the repo: Tailwind scans the
// project and trips on Chrome's lock files). The user signs in themselves; once any tab reaches
// /dashboard we close Chrome gracefully so the session cookies are flushed to disk.
const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false, defaultViewport: null, protocolTimeout: 0,
    userDataDir: process.env.PROFILE,
    args: ['--window-size=1200,900'],
  });
  const [page] = await browser.pages();
  await page.goto('http://localhost:3000/auth/login').catch(() => {});
  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline && browser.connected) {
    try {
      const urls = (await browser.pages()).map(p => p.url());
      if (urls.some(u => u.includes('localhost:3000/dashboard'))) {
        console.log('signed in');
        await new Promise(r => setTimeout(r, 3000));
        await browser.close();
        return;
      }
    } catch { /* dev server restarts / navigations can interrupt a poll; keep waiting */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log(browser.connected ? 'timed out' : 'window closed');
  if (browser.connected) await browser.close();
})();
