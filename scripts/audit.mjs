const targetList = await (await fetch('http://127.0.0.1:9222/json')).json();
const target = targetList.find((item) => item.type === 'page');
if (!target) throw new Error('No Chromium page target');

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 1;
let exceptionCount = 0;

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') exceptionCount += 1;
  if (!message.id) return;
  const promise = pending.get(message.id);
  if (!promise) return;
  pending.delete(message.id);
  if (message.error) promise.reject(new Error(message.error.message));
  else promise.resolve(message.result);
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:8080/design1/' });
await new Promise((resolve) => setTimeout(resolve, 1800));

const results = [];
for (const width of [320, 390, 768, 820, 900, 1024, 1440]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
  await new Promise((resolve) => setTimeout(resolve, 200));
  results.push(await evaluate(`({width:${width}, viewport:document.documentElement.clientWidth, scrollWidth:document.documentElement.scrollWidth, heading:document.querySelector('h1').textContent.trim()})`));
}

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
const menuOpened = await evaluate(`(() => {const button=document.querySelector('[data-menu-button]');button.click();return button.getAttribute('aria-expanded')==='true' && getComputedStyle(document.querySelector('[data-menu]')).display!=='none'})()`);
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
const menuClosedByEscape = await evaluate(`document.querySelector('[data-menu-button]').getAttribute('aria-expanded')==='false'`);
const navClicked = await evaluate(`(() => {const button=document.querySelector('[data-menu-button]');button.click();document.querySelector('[data-menu-link][href="#bisnis"]').click();return location.hash==='#bisnis' && button.getAttribute('aria-expanded')==='false'})()`);
const linkAudit = await evaluate(`(() => {const ids=new Set([...document.querySelectorAll('[id]')].map(el=>el.id));return [...document.querySelectorAll('a[href^="#"]')].filter(a=>!ids.has(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href'))})()`);
const imageAudit = await evaluate(`(async () => {const images=[...document.images];for(const image of images){image.loading='eager';await image.decode().catch(()=>{});}return images.filter(img=>img.naturalWidth===0).map(img=>img.src)})()`);
const carouselAudit = await evaluate(`(() => {const root=document.querySelector('[data-carousel]');const slides=[...root.querySelectorAll('[data-slide]')];const visible=()=>slides.findIndex(slide=>!slide.hidden);const first=visible();root.querySelector('[data-carousel-next]').click();const second=visible();root.querySelector('[data-carousel-prev]').click();return {first,second,restored:visible(),count:root.querySelector('[data-slide-count]').textContent.trim(),visibleSlides:slides.filter(slide=>!slide.hidden).length}})()`);

console.log(JSON.stringify({ results, menuOpened, menuClosedByEscape, navClicked, carouselAudit, deadAnchors: linkAudit, brokenImages: imageAudit, exceptionCount }, null, 2));
socket.close();

if (results.some((item) => item.scrollWidth > item.viewport) || !menuOpened || !menuClosedByEscape || !navClicked || carouselAudit.first !== 0 || carouselAudit.second !== 1 || carouselAudit.restored !== 0 || carouselAudit.visibleSlides !== 1 || linkAudit.length || imageAudit.length || exceptionCount) {
  process.exitCode = 1;
}
