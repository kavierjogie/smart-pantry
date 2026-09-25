// node capture.js stills 1 2.5 ...   -> stills/t-<sec>.png
// node capture.js video              -> frames piped into ffmpeg -> video-noaudio.mp4
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FFMPEG = process.env.FFMPEG;
const FPS = 30;

(async () => {
  const [mode, ...args] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto('file:///' + path.resolve(__dirname, 'video.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  console.log('ready', await page.evaluate(() => window.ready));

  if (mode === 'stills') {
    fs.mkdirSync(path.join(__dirname, 'stills'), { recursive: true });
    for (const s of args) {
      await page.evaluate((t) => render(t), +s);
      await page.screenshot({ path: path.join(__dirname, 'stills', `t-${s}.png`) });
    }
  } else {
    const dur = await page.evaluate(() => DUR);
    const n = Math.round(dur * FPS);
    const ff = spawn(FFMPEG, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', path.join(__dirname, 'video-noaudio.mp4')], { stdio: ['pipe', 'ignore', 'inherit'] });
    for (let f = 0; f < n; f++) {
      await page.evaluate((t) => render(t), f / FPS);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 60 === 0) console.log('frame', f, '/', n);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
