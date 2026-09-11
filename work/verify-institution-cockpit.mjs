const endpoint = process.argv[2] || 'http://127.0.0.1:9226';
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
const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:4173/' });
await delay(600);
await evaluate("localStorage.setItem('demo-authenticated','true');localStorage.setItem('demo-role','各金融机构');sessionStorage.setItem('institution-risk-tab','信用风险');");
await send('Page.navigate', { url: 'http://localhost:4173/cockpit' });
await delay(1500);

const result = await evaluate(`(async () => {
  const frame = document.querySelector('iframe');
  const doc = frame.contentDocument;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const base = {
    title: doc.querySelector('.screen-title h1')?.textContent.trim(),
    topCardCount: doc.querySelectorAll('[data-top-card]').length,
    topPoolSizes: [...doc.querySelectorAll('[data-top-select]')].map(select => select.options.length),
    businessVisibleCount: doc.querySelectorAll('.business-risk-item').length,
    businessTrendRemoved: doc.querySelectorAll('.business-risk-mini').length === 0,
    riskTabs: [...doc.querySelectorAll('[data-risk-tab]')].map(button => button.textContent.trim()),
    oldModulesRemoved: !/核心经营指标雷达图|集中度情况/.test(doc.body.innerText),
    trendAreas: doc.querySelectorAll('.spark-area').length,
    pageFitsViewport: doc.documentElement.scrollHeight <= doc.documentElement.clientHeight && doc.body.scrollHeight <= doc.body.clientHeight,
    returnWorkbenchVisible: Boolean(doc.querySelector('[data-action="workbench"]'))
  };
  base.defaultRiskTab = doc.querySelector('[data-risk-tab].active')?.textContent.trim();
  const categories = ['信用风险', '集中度风险', '流动性风险', '其他风险'];
  base.categories = [];
  const summarySnapshots = [];
  for (const category of categories) {
    doc.querySelector('[data-risk-tab="' + category + '"]').click();
    await wait(30);
    const thresholdRows = [...doc.querySelectorAll('.risk-metric-row:not(.risk-count-row)')];
    const summary = [...doc.querySelectorAll('.risk-summary-item>b')].map(node => Number(node.childNodes[0].textContent.trim()));
    summarySnapshots.push(summary.join(','));
    base.categories.push({
      category,
      metricCount: doc.querySelectorAll('.risk-metric-row').length,
      summary,
      countOnlyRows: doc.querySelectorAll('.risk-count-row').length,
      hasThreeSegments: thresholdRows.every(row => row.querySelectorAll('.risk-segments>i').length === 3),
      hasFourQuarterTrend: thresholdRows.every(row => row.querySelectorAll('.spark-quarters>i').length === 4),
      internalScroll: doc.querySelector('#riskMetricList').scrollHeight > doc.querySelector('#riskMetricList').clientHeight
    });
  }
  base.summaryRemainsFixed = new Set(summarySnapshots).size === 1;
  const financialSelect = doc.querySelector('[data-top-select="financial"]');
  financialSelect.value = 'net-profit';
  financialSelect.dispatchEvent(new Event('change', { bubbles: true }));
  await wait(30);
  base.topCardRefreshesInPlace = doc.querySelector('[data-top-card="financial"] .category-value>strong')?.textContent.trim() === '净利润';
  return base;
})()`);

console.log(JSON.stringify(result, null, 2));
socket.close();
