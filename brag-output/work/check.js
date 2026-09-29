const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, userDataDir: process.env.PROFILE });
  const p = await b.newPage(); await p.setViewport({ width: 430, height: 932, deviceScaleFactor: 1 });
  await p.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2', timeout: 120000 });
  console.log(p.url()); await p.screenshot({ path: 'session-check.png' }); await b.close();
})();
