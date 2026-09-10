import fs from 'node:fs';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:4200';
const debugUrl = 'http://127.0.0.1:9223';
const screenshotDirectory = process.env.ASSET_AUDIT_SCREENSHOTS;
const widths = [1440, 950, 800, 600, 390, 360];
const routes = ['/', '/impressum', '/datenschutz'];

const target = await fetch(`${debugUrl}/json/new?${encodeURIComponent(baseUrl)}`, {
  method: 'PUT',
}).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const events = [];
const requestUrls = new Map();
let nextId = 1;

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const callbacks = pending.get(message.id);
    if (!callbacks) return;
    pending.delete(message.id);
    if (message.error) callbacks.reject(message.error);
    else callbacks.resolve(message.result);
    return;
  }
  if (message.method === 'Network.requestWillBeSent') {
    requestUrls.set(message.params.requestId, message.params.request.url);
  }
  events.push(message);
};

await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(expression, timeout = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

await send('Page.enable');
await send('Network.enable');
await send('Runtime.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });

const results = [];
for (const width of widths) {
  for (const route of routes) {
    const eventStart = events.length;
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `${baseUrl}${route}` });
    await waitFor("document.readyState === 'complete'");
    if (route === '/') {
      await waitFor("document.querySelectorAll('.skill-item img').length === 20");
      await evaluate(`new Promise((resolve) => {
        let position = 0;
        const advance = () => {
          position += 700;
          window.scrollTo(0, position);
          if (position >= document.documentElement.scrollHeight) {
            setTimeout(() => { window.scrollTo(0, 0); resolve(true); }, 200);
          } else {
            setTimeout(advance, 25);
          }
        };
        advance();
      })`);
    }
    await delay(250);

    const dom = await evaluate(`(() => {
      const isVisible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
      };
      const pseudoBackground = (selector, pseudo) => {
        const element = document.querySelector(selector);
        return element ? getComputedStyle(element, pseudo).backgroundImage : null;
      };
      return {
        url: location.href,
        viewport: { width: innerWidth, clientWidth: document.documentElement.clientWidth },
        documentWidth: document.documentElement.scrollWidth,
        images: [...document.images].map((image) => ({
          alt: image.alt,
          attr: image.getAttribute('src'),
          src: image.currentSrc || image.src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          visible: isVisible(image),
          className: image.className,
        })),
        skillImages: [...document.querySelectorAll('.skill-item img')].map((image) => ({
          alt: image.alt,
          src: image.currentSrc || image.src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          visible: isVisible(image),
        })),
        projectImages: [...document.querySelectorAll('.project-image img')].map((image) => ({
          alt: image.alt,
          src: image.currentSrc || image.src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          visible: isVisible(image),
        })),
        heroProfile: (() => {
          const image = document.querySelector('.empfang-visual-img');
          return image ? { src: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth, visible: isVisible(image) } : null;
        })(),
        heroSocials: [...document.querySelectorAll('.hero-socials img')].map((image) => ({ src: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth, visible: isVisible(image) })),
        footerImages: [...document.querySelectorAll('.site-footer img')].map((image) => ({ src: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth, visible: isVisible(image) })),
        aboutImages: [...document.querySelectorAll('.ueber-wrapper img')].map((image) => ({ src: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth, visible: isVisible(image) })),
        backgrounds: {
          heroCurve: pseudoBackground('.empfang', '::after'),
          aboutBlob: pseudoBackground('#ueber-mich', '::before'),
          skillsBlob: pseudoBackground('#skills', '::before'),
          portfolioBlob: pseudoBackground('#meine-werke', '::before'),
          contactBlob: pseudoBackground('#contact', '::before'),
        },
      };
    })()`);

    if (route === '/') {
      await evaluate(`(() => {
        for (const id of ['contact-name', 'contact-email', 'contact-message']) {
          const field = document.getElementById(id);
          field.focus();
          field.blur();
        }
        return true;
      })()`);
      await delay(150);
      await evaluate(`(() => {
        const values = {
          'contact-name': 'Ada Lovelace',
          'contact-email': 'ada@example.com',
          'contact-message': 'Das ist eine Nachricht',
        };
        for (const [id, value] of Object.entries(values)) {
          const field = document.getElementById(id);
          field.value = value;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          field.blur();
        }
        return true;
      })()`);
      await delay(150);

      if (screenshotDirectory) {
        const clip = await evaluate(`(() => {
          const rect = document.querySelector('#skills').getBoundingClientRect();
          return { x: 0, y: rect.top + scrollY, width: innerWidth, height: rect.height };
        })()`);
        const screenshot = await send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: { ...clip, scale: 1 },
        });
        fs.writeFileSync(
          path.join(screenshotDirectory, `skills-${width}.png`),
          Buffer.from(screenshot.data, 'base64'),
        );
      }
    }

    await delay(200);
    const navigationEvents = events.slice(eventStart);
    const assetResponses = navigationEvents
      .filter((event) => event.method === 'Network.responseReceived')
      .map((event) => ({
        url: event.params.response.url,
        status: event.params.response.status,
        mimeType: event.params.response.mimeType,
        type: event.params.type,
      }))
      .filter((response) => /\.(?:svg|png|jpe?g|webp|avif|gif|ico)(?:$|[?#])/i.test(response.url));
    const failedRequests = navigationEvents
      .filter((event) => event.method === 'Network.loadingFailed')
      .map((event) => ({
        url: requestUrls.get(event.params.requestId),
        errorText: event.params.errorText,
        type: event.params.type,
      }))
      .filter((failure) => failure.type === 'Image' || /\.(?:svg|png|jpe?g|webp|avif|gif|ico)(?:$|[?#])/i.test(failure.url || ''));

    results.push({ width, route, dom, assetResponses, failedRequests });
  }
}

const summary = results.map((result) => ({
  width: result.width,
  route: result.route,
  imageCount: result.dom.images.length,
  brokenImages: result.dom.images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
  hiddenImages: result.dom.images.filter((image) => !image.visible).map((image) => image.src),
  skills: result.dom.skillImages.length,
  brokenSkills: result.dom.skillImages.filter((image) => !image.complete || image.naturalWidth === 0 || !image.visible).map((image) => image.alt),
  projects: result.dom.projectImages.length,
  brokenProjects: result.dom.projectImages.filter((image) => !image.complete || image.naturalWidth === 0 || !image.visible).map((image) => image.alt),
  heroProfile: result.dom.heroProfile,
  heroSocials: result.dom.heroSocials.length,
  brokenHeroSocials: result.dom.heroSocials.filter((image) => !image.complete || image.naturalWidth === 0 || !image.visible).map((image) => image.src),
  footerImages: result.dom.footerImages.length,
  brokenFooterImages: result.dom.footerImages.filter((image) => !image.complete || image.naturalWidth === 0 || !image.visible).map((image) => image.src),
  aboutImages: result.dom.aboutImages.length,
  brokenAboutImages: result.dom.aboutImages.filter((image) => !image.complete || image.naturalWidth === 0 || !image.visible).map((image) => image.src),
  backgrounds: result.dom.backgrounds,
  horizontalOverflow: result.dom.documentWidth > result.dom.viewport.clientWidth,
  badAssetResponses: result.assetResponses.filter((response) => response.status >= 400),
  failedRequests: result.failedRequests,
}));

console.log(JSON.stringify(summary, null, 2));
socket.close();
