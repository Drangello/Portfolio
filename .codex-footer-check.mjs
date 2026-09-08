import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9333;
const profileDirectory = mkdtempSync(join(tmpdir(), 'codex-footer-chrome-'));
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDirectory}`,
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true },
);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getPageEndpoint() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) =>
        response.json(),
      );
      const page = targets.find((target) => target.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await wait(100);
  }
  throw new Error('Chrome DevTools endpoint was not available.');
}

const socket = new WebSocket(await getPageEndpoint());
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let commandId = 0;
const pendingCommands = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pendingCommands.has(message.id)) return;
  const { resolve, reject } = pendingCommands.get(message.id);
  pendingCommands.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function command(method, params = {}) {
  commandId += 1;
  socket.send(JSON.stringify({ id: commandId, method, params }));
  return new Promise((resolve, reject) => {
    pendingCommands.set(commandId, { resolve, reject });
  });
}

await command('Page.enable');
await command('Runtime.enable');
await command('Page.navigate', { url: 'http://127.0.0.1:4200/' });
await wait(1500);
await command('Runtime.evaluate', {
  expression: `Promise.all([
    document.fonts.ready,
    ...Array.from(document.images, image => image.complete ? Promise.resolve() : new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    }))
  ])`,
  awaitPromise: true,
});

const viewports = [
  [1440, 900],
  [951, 800],
  [950, 800],
  [800, 800],
  [799, 800],
  [600, 800],
  [390, 844],
  [360, 800],
];
const results = [];

for (const [width, height] of viewports) {
  await command('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await command('Runtime.evaluate', {
    expression: 'window.scrollTo(0, document.documentElement.scrollHeight)',
  });
  await wait(250);
  await command('Runtime.evaluate', {
    expression: `document.querySelector('.footer-right a:nth-child(2)').focus()`,
  });

  const evaluation = await command('Runtime.evaluate', {
    expression: `(() => {
      const doc = document.documentElement;
      const footer = document.querySelector('.site-footer');
      const container = footer.querySelector('.container');
      const logo = footer.querySelector('.footer-left img');
      const center = footer.querySelector('.footer-center');
      const social = footer.querySelector('.footer-right');
      const links = Array.from(social.querySelectorAll('a'));
      const contact = document.querySelector('#contact');
      const pseudo = getComputedStyle(contact, '::before');
      const footerRect = footer.getBoundingClientRect();
      const documentFooterBottom = footerRect.bottom + window.scrollY;
      return {
        viewport: [innerWidth, innerHeight],
        xOverflow: doc.scrollWidth - doc.clientWidth,
        documentHeight: doc.scrollHeight,
        scrollY,
        maxScrollY: doc.scrollHeight - doc.clientHeight,
        trailingAfterFooter: doc.scrollHeight - documentFooterBottom,
        footer: { x: footerRect.x, y: footerRect.y, width: footerRect.width, height: footerRect.height },
        container: (() => { const r = container.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, display: getComputedStyle(container).display, direction: getComputedStyle(container).flexDirection, gap: getComputedStyle(container).gap, padding: getComputedStyle(container).padding }; })(),
        logo: (() => { const r = logo.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, natural: [logo.naturalWidth, logo.naturalHeight] }; })(),
        center: (() => { const r = center.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, text: center.textContent.trim() }; })(),
        social: (() => { const r = social.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
        links: links.map(link => { const r = link.getBoundingClientRect(); return { href: link.getAttribute('href'), target: link.getAttribute('target'), rel: link.getAttribute('rel'), ariaLabel: link.getAttribute('aria-label'), x: r.x, y: r.y, width: r.width, height: r.height }; }),
        activeElement: document.activeElement.getAttribute('aria-label'),
        focusOutline: (() => { const style = getComputedStyle(document.activeElement); return [style.outlineWidth, style.outlineStyle, style.outlineColor, style.outlineOffset]; })(),
        divider: getComputedStyle(footer).borderTop,
        contactBlob: { bottom: pseudo.bottom, left: pseudo.left, width: pseudo.width, height: pseudo.height, zIndex: pseudo.zIndex, pointerEvents: pseudo.pointerEvents },
      };
    })()`,
    returnByValue: true,
  });
  results.push(evaluation.result.value);

  const screenshot = await command('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  writeFileSync(join(tmpdir(), `codex-footer-${width}.png`), Buffer.from(screenshot.data, 'base64'));
}

console.log(JSON.stringify(results, null, 2));
socket.close();
chrome.kill();
await wait(200);
rmSync(profileDirectory, { recursive: true, force: true });
