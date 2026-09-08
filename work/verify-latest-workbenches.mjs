import fs from 'node:fs';

const baseUrl = 'http://localhost:4175';
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
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.exception?.description || response.result.exceptionDetails.text);
  return response.result?.result?.value;
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function openWorkbench(role, width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${baseUrl}/` });
  await wait(500);
  await evaluate(`localStorage.setItem('demo-authenticated','true');localStorage.setItem('demo-role',${JSON.stringify(role)});location.href='${baseUrl}/workbench'`);
  await wait(900);
}

async function inspect(label) {
  const result = await evaluate(`JSON.stringify({
    label:${JSON.stringify(label)},
    role:localStorage.getItem('demo-role'),
    url:location.href,
    viewport:[innerWidth,innerHeight],
    page:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
    horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
    verticalOverflow:document.documentElement.scrollHeight>innerHeight,
    focusTitle:document.querySelector('.mgmt-focus-label b')?.textContent||'',
    focusItems:document.querySelectorAll('.mgmt-focus-track button').length/2,
    sectionTitles:[...document.querySelectorAll('.mgmt-section-title h2')].map(node=>node.textContent),
    taskColumns:[...document.querySelectorAll('.mgmt-task-head span')].map(node=>node.textContent),
    taskTrends:document.querySelectorAll('.mgmt-task-metrics p').length,
    riskTrends:document.querySelectorAll('.mgmt-risk-counts p').length,
    riskColumns:[...document.querySelectorAll('.mgmt-risk-group')].map(group=>[...group.querySelectorAll('.mgmt-risk-head span')].map(node=>node.textContent)),
    submissionRows:document.querySelectorAll('.mgmt-submission-row').length,
    sentimentRows:document.querySelectorAll('.mgmt-sentiment-list>button').length,
    sentimentTags:[...document.querySelectorAll('.mgmt-sentiment-tag')].map(node=>node.textContent),
    sentimentInstitutions:[...document.querySelectorAll('.mgmt-sentiment-institution')].map(node=>node.textContent),
    legacySentimentLabels:/一般|较重|严重/.test(document.querySelector('.mgmt-sentiment-list')?.innerText||''),
    aiVisible:(()=>{const node=document.querySelector('.smart-assistant-launcher');if(!node)return false;const rect=node.getBoundingClientRect();return getComputedStyle(node).display!=='none'&&rect.width>0&&rect.height>0;})(),
    aiContentGap:(()=>{const ai=document.querySelector('.smart-assistant-launcher')?.getBoundingClientRect();const list=document.querySelector('.mgmt-sentiment-list')?.getBoundingClientRect();return ai&&list?Math.round(ai.top-list.bottom):null;})(),
    panelSafeBottom:innerHeight-Math.max(...[...document.querySelectorAll('.mgmt-panel')].map(node=>Math.round(node.getBoundingClientRect().bottom))),
    panelBounds:[...document.querySelectorAll('.mgmt-panel')].map(node=>({className:node.className,top:Math.round(node.getBoundingClientRect().top),bottom:Math.round(node.getBoundingClientRect().bottom),height:Math.round(node.getBoundingClientRect().height)})),
    clippedContainers:[...document.querySelectorAll('.mgmt-top-grid>.mgmt-panel,.mgmt-bottom-grid>.mgmt-panel,.mgmt-task-table,.mgmt-risk-body,.mgmt-submission-table,.mgmt-sentiment-list,.mgmt-closure-grid')]
      .filter(node=>node.scrollHeight>node.clientHeight+1||node.scrollWidth>node.clientWidth+1)
      .map(node=>({className:node.className,client:[node.clientWidth,node.clientHeight],scroll:[node.scrollWidth,node.scrollHeight]}))
  })`);
  console.log(result);
}

for (const viewport of [[1536,700],[1920,1080]]) {
  for (const role of ['集团','各金融机构']) {
    await openWorkbench(role, viewport[0], viewport[1]);
    await inspect(`${role}-${viewport[0]}x${viewport[1]}`);
    if (viewport[0] === 1920) {
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const name = role === '各金融机构' ? 'work/金融机构工作台.png' : 'work/集团及国资公司工作台.png';
      fs.writeFileSync(name, Buffer.from(shot.result.data, 'base64'));
    }
  }
}

for (const role of ['集团','各金融机构']) {
  await openWorkbench(role, 1920, 1080);
  const firstSentimentBefore = await evaluate(`document.querySelector('.mgmt-sentiment-list>button strong')?.textContent`);
  await wait(3200);
  const firstSentimentAfter = await evaluate(`document.querySelector('.mgmt-sentiment-list>button strong')?.textContent`);
  const ticker = await evaluate(`JSON.stringify({animation:getComputedStyle(document.querySelector('.mgmt-focus-track')).animationName,playState:getComputedStyle(document.querySelector('.mgmt-focus-track')).animationPlayState})`);
  await evaluate(`document.querySelector('.mgmt-focus-config')?.click()`);
  await wait(120);
  const focusConfig = await evaluate(`JSON.stringify({title:document.querySelector('.modal-title b')?.textContent,selects:document.querySelectorAll('.ticker-config-grid select').length})`);
  await evaluate(`document.querySelector('.modal-title button')?.click()`);
  await evaluate(`document.querySelector('.mgmt-sentiment-list>button')?.click()`);
  await wait(120);
  const sentimentModal = await evaluate(`JSON.stringify({title:document.querySelector('.modal-title b')?.textContent,detail:!!document.querySelector('.sentiment-detail')})`);
  await evaluate(`document.querySelector('.modal-title button')?.click()`);
  await evaluate(`document.querySelector('.smart-assistant-launcher')?.click()`);
  await wait(120);
  const aiBefore = await evaluate(`JSON.stringify({open:!!document.querySelector('.smart-assistant-panel'),questions:[...document.querySelectorAll('.smart-assistant-quick button')].map(node=>node.textContent)})`);
  await evaluate(`document.querySelector('.smart-assistant-quick button')?.click()`);
  await wait(120);
  const aiAfter = await evaluate(`JSON.stringify({messages:document.querySelectorAll('.smart-assistant-message').length,stats:document.querySelectorAll('.smart-assistant-stats b').length})`);
  console.log(JSON.stringify({ role, sentimentRotated:firstSentimentBefore!==firstSentimentAfter, ticker:JSON.parse(ticker), focusConfig:JSON.parse(focusConfig), sentimentModal:JSON.parse(sentimentModal), aiBefore:JSON.parse(aiBefore), aiAfter:JSON.parse(aiAfter) }));
}

ws.close();
