import fs from 'node:fs';

const baseUrl = 'http://localhost:4175';
const viewportWidth = Number(process.env.VIEWPORT_WIDTH || 1536);
const viewportHeight = Number(process.env.VIEWPORT_HEIGHT || 700);
const tabs = await (await fetch('http://127.0.0.1:9333/json')).json();
const tabInfo = tabs.find(item => item.type === 'page');
if (!tabInfo) throw new Error('No browser page was found');
const ws = new WebSocket(tabInfo.webSocketDebuggerUrl);
await new Promise(resolve => { ws.onopen = resolve; });
let id = 0;
const pending = new Map();
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  }
};
const send = (method, params = {}) => new Promise(resolve => {
  const requestId = ++id;
  pending.set(requestId, resolve);
  ws.send(JSON.stringify({ id: requestId, method, params }));
});
const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

await send('Emulation.setDeviceMetricsOverride', { width: viewportWidth, height: viewportHeight, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `${baseUrl}/` });
await wait(700);
await evaluate(`localStorage.setItem('demo-authenticated','true');localStorage.setItem('demo-role','\u5404\u91d1\u878d\u673a\u6784');location.href='${baseUrl}/workbench'`);
await wait(1100);

const summary = await evaluate(`JSON.stringify({
  url: location.href,
  role: localStorage.getItem('demo-role'),
  brand: document.querySelector('.brand-copy b')?.textContent,
  institution: document.querySelector('.institution-management-workbench')?.dataset.institution,
  sections: [...document.querySelectorAll('.mgmt-section-title h2')].map(node => node.textContent),
  taskColumns: [...document.querySelectorAll('.mgmt-task-head span')].map(node => node.textContent),
  taskNames: [...document.querySelectorAll('.mgmt-task-row > span:first-child')].map(node => node.textContent),
  riskTitles: [...document.querySelectorAll('.mgmt-risk-group h3')].map(node => node.textContent),
  riskColumns: [...document.querySelectorAll('.mgmt-risk-group')].map(group => [...group.querySelectorAll('.mgmt-risk-head span')].map(node => node.textContent)),
  riskRowCounts: [...document.querySelectorAll('.mgmt-risk-group')].map(group => group.querySelectorAll('.mgmt-risk-row').length),
  visibleInstitutionsInRisk: [...document.querySelectorAll('.mgmt-risk-row span')].map(node => node.textContent).filter(value => ['浦发银行','国际AMC','上农商','国泰海通'].includes(value)),
  historyColumns: [...document.querySelectorAll('.mgmt-history-head span')].map(node => node.textContent),
  historyTypes: [...document.querySelectorAll('.mgmt-history-row > span:first-child')].map(node => node.textContent),
  historyStatuses: [...document.querySelectorAll('.mgmt-history-row > span:nth-child(4)')].map(node => node.textContent.trim()),
  closureLabels: [...document.querySelectorAll('.mgmt-closure-grid small')].map(node => node.textContent),
  reports: [...document.querySelectorAll('.mgmt-report-grid h3')].map(node => node.textContent),
  sidebarVisible: (() => { const node = document.querySelector('.sidebar'); return !!node && getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().width > 0; })(),
  contentPaddingBottom: getComputedStyle(document.querySelector('.content')).paddingBottom,
  horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  verticalOverflow: document.documentElement.scrollHeight > innerHeight,
  panelSafeBottom: innerHeight - Math.max(...[...document.querySelectorAll('.mgmt-panel')].map(node => Math.round(node.getBoundingClientRect().bottom))),
  panelBounds: [...document.querySelectorAll('.mgmt-panel')].map(node => ({className:node.className,top:Math.round(node.getBoundingClientRect().top),bottom:Math.round(node.getBoundingClientRect().bottom),height:Math.round(node.getBoundingClientRect().height)})),
  clippedContainers: [...document.querySelectorAll('.mgmt-panel,.mgmt-task-table,.mgmt-risk-group,.mgmt-history-table,.mgmt-closure-grid,.mgmt-report-grid')]
    .filter(node => node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1)
    .map(node => ({className:node.className,client:[node.clientWidth,node.clientHeight],scroll:[node.scrollWidth,node.scrollHeight]})),
  viewport: [innerWidth, innerHeight],
  page: [document.documentElement.scrollWidth, document.documentElement.scrollHeight]
})`);
console.log('summary', summary);
const firstRiskBefore = await evaluate("document.querySelector('.mgmt-risk-group.red .mgmt-risk-row span')?.textContent");
await wait(4300);
const firstRiskAfter = await evaluate("document.querySelector('.mgmt-risk-group.red .mgmt-risk-row span')?.textContent");
console.log('rotation', JSON.stringify({ firstRiskBefore, firstRiskAfter, changed: firstRiskBefore !== firstRiskAfter }));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.writeFileSync(`work/institution-workbench-${viewportWidth}x${viewportHeight}.png`, Buffer.from(shot.result.data, 'base64'));

const clickAndRead = async selector => {
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  await wait(500);
  const result = await evaluate("JSON.stringify({url:location.href,title:document.querySelector('h1')?.textContent||document.querySelector('.page-title h1')?.textContent||''})");
  await send('Page.navigate', { url: `${baseUrl}/workbench` });
  await wait(500);
  return result;
};
console.log('task-view', await clickAndRead('.mgmt-task-row button'));
console.log('more-tasks', await clickAndRead('.mgmt-more'));
console.log('warning-view', await clickAndRead('.mgmt-risk-group.red .mgmt-risk-row button'));
console.log('event-view', await clickAndRead('.mgmt-risk-group.blue .mgmt-risk-row button'));
console.log('history-view', await clickAndRead('.mgmt-history-row button'));
console.log('report-view', await clickAndRead('.mgmt-report-grid article:first-child > button'));
await evaluate("document.querySelector('.mgmt-report-add > button')?.click()");
await wait(250);
console.log('report-config', await evaluate("JSON.stringify({url:location.href,title:document.querySelector('.modal-title b')?.textContent||'',note:document.querySelector('.modal-note')?.textContent||''})"));
await evaluate("document.querySelector('.modal-title button')?.click()");

await evaluate(`localStorage.setItem('demo-role','\u91d1\u63a7\u516c\u53f8');location.href='${baseUrl}/workbench'`);
await wait(800);
console.log('management-regression', await evaluate("JSON.stringify({role:localStorage.getItem('demo-role'),brand:document.querySelector('.brand-copy b')?.textContent,portrait:!![...document.querySelectorAll('.mgmt-section-title h2')].find(node=>node.textContent==='金融机构风险画像')})"));
ws.close();
