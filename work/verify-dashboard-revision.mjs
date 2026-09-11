import fs from 'node:fs';

const tabs = await (await fetch('http://127.0.0.1:9223/json')).json();
const page = tabs.find(tab => tab.type === 'page') || tabs[0];
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(resolve => { socket.onopen = resolve; });

let nextId = 0;
const pending = new Map();
socket.onmessage = event => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  pending.get(message.id)?.(message);
  pending.delete(message.id);
};
const send = (method, params = {}) => new Promise(resolve => {
  const id = ++nextId;
  pending.set(id, resolve);
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => (await send('Runtime.evaluate', {
  expression,
  returnByValue: true,
  awaitPromise: true,
})).result?.result?.value;
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const screenshot = async path => {
  const result = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path, Buffer.from(result.result.data, 'base64'));
};

await send('Emulation.setDeviceMetricsOverride', {
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url: 'http://localhost:5173/' });
await wait(500);
await evaluate("localStorage.setItem('demo-authenticated','true');localStorage.setItem('demo-role','集团');location.href='/group-dashboard'");
await wait(2200);
const penetration = await evaluate(`JSON.stringify({
  url: location.href,
  readyState: document.readyState,
  bodyText: document.body?.innerText.slice(0, 300),
  rootHtml: document.querySelector('#root')?.innerHTML.slice(0, 300),
  names: [...document.querySelectorAll('.gd-institution-card header strong')].map(node => node.textContent.trim()),
  hasSrcb: [...document.querySelectorAll('.gd-institution-card header strong')].some(node => node.textContent.trim() === '沪农商银行'),
  hasCpic: [...document.querySelectorAll('.gd-institution-card header strong')].some(node => node.textContent.includes('太保'))
})`);
await screenshot('work/group-dashboard-name-qa.png');

await send('Page.navigate', { url: 'http://localhost:5173/institution-cockpit/index.html?name=%E6%B2%AA%E5%86%9C%E5%95%86%E9%93%B6%E8%A1%8C' });
await wait(800);
await evaluate("document.querySelector('[data-risk-tab=\"其他风险\"]')?.click()");
await wait(300);
const otherRisk = await evaluate(`JSON.stringify({
  activeTab: document.querySelector('[data-risk-tab][aria-selected="true"]')?.textContent.trim(),
  rows: document.querySelectorAll('.risk-other-row').length,
  trends: document.querySelectorAll('.risk-other-row .risk-trend').length,
  threeColorBands: document.querySelectorAll('.risk-other-row .risk-segments').length,
  legendDisplay: getComputedStyle(document.querySelector('.risk-band-legend')).display,
  headingHint: document.querySelector('.risk-monitor-panel .heading-tools small')?.textContent.trim()
})`);
await screenshot('work/institution-other-risk-qa.png');

console.log(JSON.stringify({ penetration: JSON.parse(penetration), otherRisk: JSON.parse(otherRisk) }, null, 2));
socket.close();
