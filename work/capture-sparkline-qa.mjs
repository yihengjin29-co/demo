import fs from 'node:fs';

const endpoint = process.argv[2];
const width = Number(process.argv[3]);
const height = Number(process.argv[4]);
const output = process.argv[5];
const role = process.argv[6] || '集团';
const route = process.argv[7] || '/cockpit';
const riskTab = process.argv[8] || '集中度风险';
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
let page;

for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    page = (await fetch(`${endpoint}/json`).then(response => response.json())).find(item => item.type === 'page');
    if (page) break;
  } catch {}
  await delay(200);
}
if (!page) throw new Error('No debugging page');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let id = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (!pending.has(message.id)) return;
  const task = pending.get(message.id);
  pending.delete(message.id);
  message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const call = ++id;
  pending.set(call, { resolve, reject });
  socket.send(JSON.stringify({ id: call, method, params }));
});

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:4173/' });
await delay(700);
await send('Runtime.evaluate', { expression: `localStorage.setItem('demo-authenticated','true');localStorage.setItem('demo-role',${JSON.stringify(role)});if(${JSON.stringify(role)}==='各金融机构'){Object.keys(localStorage).filter(key=>key.startsWith('institution-top-metrics-')).forEach(key=>localStorage.removeItem(key));sessionStorage.setItem('institution-risk-tab',${JSON.stringify(riskTab)});}` });
await send('Page.navigate', { url: `http://localhost:4173${route}` });
await delay(1700);
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
fs.writeFileSync(output, Buffer.from(shot.data, 'base64'));
socket.close();
console.log(output);
