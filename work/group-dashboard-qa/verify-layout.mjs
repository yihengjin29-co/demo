import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

// Local render verification in a disposable browser profile; never attach to a user's browser.
const output = resolve('work/group-dashboard-qa');
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 0, watch: null } });
await server.listen();
const address = server.httpServer.address();
const profile = resolve('node_modules/.cache/group-dashboard-browser', String(Date.now()));
await mkdir(profile, { recursive: true });
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let ws;
let browserLog = '';
browser.stderr.on('data', data => { browserLog += data.toString(); });
browser.on('exit', (code, signal) => console.log('Render browser exited', code, signal));
try {
  const endpoint = await new Promise((resolveEndpoint, reject) => {
    let log = '';
    const timeout = setTimeout(() => reject(new Error('Headless browser did not start: ' + log.slice(-1200))), 20000);
    browser.on('error', reject);
    browser.stderr.on('data', data => {
      log += data.toString();
      const match = log.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolveEndpoint(match[1]); }
    });
  });
  ws = new WebSocket(endpoint);
  await new Promise(resolveOpen => ws.addEventListener('open', resolveOpen, { once: true }));
  let sequence = 0;
  const pending = new Map();
  ws.addEventListener('close', event => { for (const callback of pending.values()) callback.reject(new Error(`Browser connection closed: ${event.code} ${event.reason}\n${browserLog.slice(-3000)}`)); });
  const runtimeErrors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text);
    if (!message.id) return;
    const callback = pending.get(message.id);
    if (callback) { pending.delete(message.id); message.error ? callback.reject(message.error) : callback.resolve(message.result); }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolveMessage, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 20000);
    pending.set(id, { resolve: value => { clearTimeout(timeout); resolveMessage(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('demo-authenticated','true'); localStorage.setItem('demo-role','集团');" });
  await call('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `http://127.0.0.1:${address.port}/group-dashboard` });
  await evaluate(`new Promise((resolve, reject) => { const start = Date.now(); const timer = setInterval(() => { if (document.querySelector('.gd-radar')) { clearInterval(timer); document.fonts.ready.then(resolve); } else if (Date.now() - start > 15000) { clearInterval(timer); reject(new Error('Dashboard not rendered')); } }, 100); })`);
  const hover = async selector => {
    const point = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  };
  await hover('.gd-risk-summary');
  const settle = () => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  await settle();
  const measure = () => evaluate(`(() => {
    const rect = e => { const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; };
    const panels=[...document.querySelectorAll('.gd-panel')];
    const overflow=[];
    for (const panel of panels) {
      const p=panel.getBoundingClientRect();
      for (const element of panel.querySelectorAll('button, .gd-institution-impact h3, .gd-institution-impact article span, .gd-institution-impact article strong, .gd-institution-impact article small, .gd-ownership-tree b, .gd-ownership-tree small, svg text, .gd-bar-group>strong, .gd-radar-legend span, .gd-scope-heading, .gd-event-name, .gd-event-value, .gd-event-change')) {
        const r=element.getBoundingClientRect();
        if (r.width && (r.left<p.left-1 || r.right>p.right+1 || r.top<p.top-1 || r.bottom>p.bottom+1)) overflow.push({panel:panel.querySelector('h2').textContent, text:element.textContent, rect:rect(element)});
      }
    }
    const labels=[...document.querySelectorAll('.gd-investment-label')];
    const labelOverlaps=[];
    labels.forEach((a,i)=>labels.slice(i+1).forEach(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect(); if(Math.min(x.right,y.right)>Math.max(x.left,y.left)&&Math.min(x.bottom,y.bottom)>Math.max(x.top,y.top))labelOverlaps.push([a.textContent,b.textContent]);}));
    return {viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],scale:getComputedStyle(document.querySelector('.group-dashboard-screen')).transform,panels:panels.map(e=>({title:e.querySelector('h2').textContent,...rect(e)})),radar:rect(document.querySelector('.gd-radar')),ring:rect(document.querySelector('.gd-investment-donut')),childNodes:document.querySelectorAll('.gd-tree-children button').length,riskTrend:!!document.querySelector('.gd-risk-trend'),overflow,labelOverlaps};
  })()`);
  const report = { desktop: await measure(), checks: [], runtimeErrors };
  await hover('.gd-radar');
  await settle();
  report.tooltip = await evaluate(`({visible:!!document.querySelector('[role=tooltip]'),text:document.querySelector('[role=tooltip]')?.textContent,alwaysVisibleCounts:document.querySelectorAll('.gd-radar-count').length})`);
  await hover('.gd-risk-summary');
  await settle();
  report.tooltip.hiddenOnLeave = await evaluate(`!document.querySelector('[role=tooltip]')`);
  for (let index = 0; index < 2; index++) {
    await evaluate(`document.querySelectorAll('.gd-risk-tabs button')[${index}].click()`);
    await settle();
    for (let scope = 0; scope < 5; scope++) {
      await evaluate(`document.querySelectorAll('.gd-scope-tabs button')[${scope}].click()`);
      await settle();
      report.checks.push({ ...await evaluate(`({type:'risk',kind:document.querySelector('.gd-risk-tabs .active').textContent,scope:document.querySelector('.gd-scope-tabs .active').textContent,axes:document.querySelectorAll('.gd-radar-label').length,totals:document.querySelector('.gd-risk-summary').textContent})`), overflow: (await measure()).overflow });
    }
  }
  for (let index = 0; index < 4; index++) {
    await evaluate(`document.querySelectorAll('.gd-investment-heading button')[${index}].click()`);
    await settle();
    report.checks.push({ ...await evaluate(`({type:'investment',dimension:document.querySelector('.gd-investment-heading .active').textContent,sectors:document.querySelectorAll('.gd-investment-donut path').length})`), labelOverlaps: (await measure()).labelOverlaps });
  }
  for (let index = 0; index < 4; index++) {
    await evaluate(`document.querySelectorAll('.gd-ownership-institutions button')[${index}].click()`);
    await settle();
    report.checks.push(await evaluate(`({type:'equity',selected:document.querySelector('.gd-institution-impact').getAttribute('aria-label'),activeNodes:document.querySelectorAll('.gd-ownership-institutions button[aria-pressed=true]').length,operation:[...document.querySelectorAll('.gd-operation-cards article')].map(e=>e.textContent),risk:[...document.querySelectorAll('.gd-risk-impact-cards article')].map(e=>e.textContent),path:document.querySelector('.gd-ownership-active-spine').getAttribute('style')})`));
  }
  await evaluate(`document.querySelectorAll('.gd-risk-tabs button')[0].click();document.querySelectorAll('.gd-scope-tabs button')[0].click();document.querySelectorAll('.gd-investment-heading button')[0].click();document.querySelectorAll('.gd-ownership-institutions button')[3].click();`);
  await settle();
  const screenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(resolve(output, 'group-dashboard-1920x1080.png'), Buffer.from(screenshot.data, 'base64'));
  const investmentRect = await evaluate(`(()=>{const r=document.querySelector('.gd-investment-panel').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()`);
  const investmentScreenshot = await call('Page.captureScreenshot', { format: 'png', clip: investmentRect });
  await writeFile(resolve(output, 'investment-projects.png'), Buffer.from(investmentScreenshot.data, 'base64'));
  const institutionRect = await evaluate(`(()=>{const r=document.querySelector('.gd-equity-panel').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()`);
  const institutionScreenshot = await call('Page.captureScreenshot', { format: 'png', clip: institutionRect });
  await writeFile(resolve(output, 'institution-impact.png'), Buffer.from(institutionScreenshot.data, 'base64'));
  await call('Emulation.setDeviceMetricsOverride', { width: 1920, height: 940, deviceScaleFactor: 1, mobile: false });
  await settle();
  report.browserHeight = await measure();
  const shortScreenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(resolve(output, 'group-dashboard-1920x940.png'), Buffer.from(shortScreenshot.data, 'base64'));
  report.compactViews = [];
  for (const [width,height] of [[1920,890],[1536,720],[1600,750]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await settle();
    report.compactViews.push(await measure());
    const compactScreenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(resolve(output, `group-dashboard-${width}x${height}.png`), Buffer.from(compactScreenshot.data, 'base64'));
  }
  await writeFile(resolve(output, 'layout-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({views:[report.desktop,report.browserHeight,...report.compactViews].map(({viewport,scroll,scale,childNodes,overflow,labelOverlaps})=>({viewport,scroll,scale,childNodes,overflow,labelOverlaps})),tooltip:report.tooltip,interactionChecks:report.checks.length,runtimeErrors,interactionIssues:report.checks.filter(check=>check.overflow?.length || check.labelOverlaps?.length)}, null, 2));
  await send('Browser.close');
} finally {
  ws?.close();
  browser.kill();
  await server.close();
}
