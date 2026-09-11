(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const params = new URLSearchParams(location.search);
  const institution = params.get('name') || '浦发银行';
  $('#institutionName').textContent = institution;

  const monthData = {
    '2026-08': { yellow: 3, red: 1, events: 2, asof: '2026-08-31' },
    '2026-07': { yellow: 2, red: 1, events: 1, asof: '2026-07-31' },
    '2026-06': { yellow: 4, red: 2, events: 2, asof: '2026-06-30' }
  };

  const news = [
    { tone: '中性', title: `${institution}零售业务保持稳健增长`, importance: '中', level: '3级', time: '08-26 08:45' },
    { tone: '负面', title: `${institution}重点行业客户经营指标出现波动`, importance: '高', level: '5级', time: '08-25 16:20' },
    { tone: '正面', title: `${institution}数字金融服务获得市场积极评价`, importance: '中', level: '3级', time: '08-24 09:30' },
    { tone: '中性', title: `${institution}发布月度经营数据简报`, importance: '低', level: '2级', time: '08-23 11:05' }
  ];

  const events = [
    { risk: '流动性风险', title: '重点客户短期流动性风险排查', status: '整改跟踪中', level: '高', time: '08-26 10:30' },
    { risk: '市场风险', title: '市场风险限额预警处置', status: '方案执行中', level: '高', time: '08-25 10:30' },
    { risk: '信用风险', title: '存量项目回款异常核查', status: '待补充说明', level: '中', time: '08-24 10:30' },
    { risk: '操作风险', title: '关键业务流程异常事项复核', status: '复核验证中', level: '中', time: '08-22 14:20' }
  ];

  const feedState = { news: { index: 0, paused: false }, events: { index: 0, paused: false } };
  function visibleItems(items, index) { return [0, 1, 2].map(offset => items[(index + offset) % items.length]); }
  function renderNews() {
    $('#newsStream').innerHTML = visibleItems(news, feedState.news.index).map((item) => `<button class="compact-row news-row-compact" data-detail="${item.title}" data-detail-text="该舆情线索与${institution}相关，当前倾向为${item.tone}，内部重要程度为${item.importance}，已纳入持续监测。"><span class="compact-copy"><span><i class="mini-tag ${item.tone === '负面' ? 'negative' : item.tone === '正面' ? 'positive' : 'neutral'}">${item.tone}</i><i class="mini-tag org">${institution}</i></span><strong>${item.title}</strong></span><span class="compact-field">${item.importance}</span><span class="compact-field">${item.level}</span><span class="compact-field time">${item.time}</span></button>`).join('');
    bindDetails();
  }
  function renderEvents() {
    $('#eventStream').innerHTML = visibleItems(events, feedState.events.index).map((item) => `<button class="compact-row event-row-compact" data-detail="${item.title}" data-detail-text="风险类型：${item.risk}；当前处置状态：${item.status}；关注等级：${item.level}；上报时间：${item.time}。"><span class="compact-copy"><span><i class="mini-tag org">${institution}</i><i class="mini-tag neutral">${item.risk}</i></span><strong>${item.title}</strong></span><span class="compact-field status">${item.status}</span><span class="compact-field">${item.level}</span><span class="compact-field time">${item.time}</span></button>`).join('');
    bindDetails();
  }

  const quarters = ['2025Q3', '2025Q4', '2026Q1', '2026Q2'];
  const balanceSheetMetrics = [
    { id: 'asset-liability', name: '资产负债率', value: 76.3, unit: '%', decimals: 1, change: '▼ 0.8个百分点', trend: [78.6, 77.5, 78.0, 76.3] },
    { id: 'financial-leverage', name: '财务杠杆率', value: 4.22, unit: '倍', decimals: 2, change: '▼ 0.06倍', trend: [4.41, 4.29, 4.35, 4.22] }
  ];
  const financialMetrics = [
    { id: 'roe', name: '净资产收益率（ROE）', value: 8.2, unit: '%', decimals: 1, change: '▲ 0.4个百分点', trend: [7.4, 7.9, 7.6, 8.2] },
    { id: 'roa', name: '资产利润率（ROA）', value: 1.16, unit: '%', decimals: 2, change: '▲ 0.08个百分点', trend: [0.98, 1.09, 1.03, 1.16] },
    { id: 'net-profit', name: '净利润', value: 52.8, unit: '亿元', decimals: 1, change: '▲ 4.8%', trend: [45.7, 50.1, 48.6, 52.8] },
    { id: 'profit-growth', name: '净利润增速', value: 4.8, unit: '%', decimals: 1, change: '▲ 0.6个百分点', trend: [3.6, 4.4, 4.0, 4.8] },
    { id: 'cost-income', name: '成本收入比', value: 31.6, unit: '%', decimals: 1, change: '▼ 0.7个百分点', trend: [33.4, 32.1, 32.8, 31.6] }
  ];
  const capitalMetrics = [
    { id: 'excess-capital', name: '超额资本', value: 26800, unit: '万元', decimals: 0, change: '▲ 1,600万元', trend: [23100, 25200, 24600, 26800] },
    { id: 'qualified-capital', name: '合格资本覆盖率', value: 129, unit: '%', decimals: 1, change: '▲ 2.6个百分点', trend: [122.6, 126.2, 124.9, 129] }
  ];
  const topMetricPools = {
    balance: { label: '资产负债类', metrics: balanceSheetMetrics },
    financial: { label: '财务经营类', metrics: financialMetrics },
    capital: { label: '资本类', metrics: capitalMetrics }
  };

  const businessRiskMetrics = [
    { id: 'nonperforming-investment', name: '金融不良资产投资占比', value: 44.2, unit: '%', status: '黄灯', change: '▲ 1.20个百分点', trend: [40.6, 41.8, 43.0, 44.2], detail: '金融不良资产投资余额占相关投资资产余额的比例。' },
    { id: 'abnormal-assets', name: '异常类资产占比', value: 8.6, unit: '%', status: '黄灯', change: '▲ 0.50个百分点', trend: [7.4, 7.8, 8.1, 8.6], detail: '异常类资产余额占相关业务资产余额的比例。' },
    { id: 'watch-assets', name: '关注类资产占比', value: 12.8, unit: '%', status: '正常', change: '▼ 0.30个百分点', trend: [13.9, 13.5, 13.1, 12.8], detail: '关注类资产余额占相关业务资产余额的比例。' },
    { id: 'abnormal-growth', name: '异常类资产增长率', value: 6.2, unit: '%', status: '黄灯', change: '▲ 0.80个百分点', trend: [4.6, 5.1, 5.4, 6.2], detail: '异常类资产余额较上期的增长幅度。' },
    { id: 'watch-growth', name: '关注类资产增长率', value: 4.8, unit: '%', status: '正常', change: '▼ 0.20个百分点', trend: [5.5, 5.2, 5.0, 4.8], detail: '关注类资产余额较上期的增长幅度。' }
  ];

  const riskMetrics = {
    '信用风险': [
      { id: 'provision-rate', name: '资产拨备率', value: 2.6, unit: '%', attention: 2.8, warning: 2.3, low: true, trend: [2.92, 2.68, 2.79, 2.6] }
    ],
    '集中度风险': [
      { id: 'single-client', name: '单一客户投融资集中度', value: 18.2, unit: '%', attention: 18, warning: 22, low: false, trend: [16.3, 17.8, 16.9, 18.2] },
      { id: 'single-group', name: '单一集团客户投融资集中度', value: 26.4, unit: '%', attention: 25, warning: 30, low: false, trend: [23.2, 25.1, 24.3, 26.4] },
      { id: 'industry-concentration', name: '行业集中度', value: 40.8, unit: '%', attention: 38, warning: 45, low: false, trend: [36.8, 39.4, 38.1, 40.8] },
      { id: 'regional-concentration', name: '区域集中度', value: 44.2, unit: '%', attention: 42, warning: 50, low: false, trend: [40.1, 43.1, 41.8, 44.2] }
    ],
    '流动性风险': [
      { id: 'liquidity-buffer-30d', name: '30日流动性备付余量', value: 8600, unit: '万元', attention: 10000, warning: 5000, low: true, trend: [11800, 9600, 10300, 8600] },
      { id: 'liquidity-ratio', name: '流动性比例', value: 32.5, unit: '%', attention: 30, warning: 25, low: true, trend: [35.4, 32.9, 34.0, 32.5] },
      { id: 'funding-balance-ratio', name: '融入资金余额比例', value: 58, unit: '%', attention: 60, warning: 70, low: false, trend: [52, 57, 54, 58] },
      { id: 'liability-dependence', name: '负债依存度', value: 72, unit: '%', attention: 70, warning: 80, low: false, trend: [67, 71, 69, 72] },
      { id: 'net-cash-outflow', name: '净现金流出', value: 4200, unit: '万元', attention: 5000, warning: 8000, low: false, trend: [3300, 4100, 3700, 4200] },
      { id: 'operating-cash-ratio', name: '营业现金比率', value: 21, unit: '%', attention: 20, warning: 15, low: true, trend: [23.8, 21.7, 22.6, 21] }
    ],
    '其他风险': [
      { id: 'major-operation-events', name: '重大操作风险事件数量', value: 0, unit: '件', countOnly: true, trend: [1, 0, 0, 0] },
      { id: 'major-reputation-events', name: '重大声誉风险事件数量', value: 0, unit: '件', countOnly: true, trend: [0, 1, 0, 0] },
      { id: 'major-compliance-events', name: '重大合规风险事件数量', value: 0, unit: '件', countOnly: true, trend: [1, 0, 1, 0] },
      { id: 'administrative-penalties', name: '行政处罚事件数量', value: 1, unit: '件', attention: 1, warning: 3, low: false, trend: [0, 2, 0, 1] },
      { id: 'administrative-penalty-amount', name: '行政处罚金额', value: 12, unit: '万元', attention: 20, warning: 50, low: false, trend: [0, 12, 8, 12] },
      { id: 'case-count', name: '案件数量', value: 2, unit: '件', attention: 3, warning: 5, low: false, trend: [1, 3, 1, 2] },
      { id: 'case-amount', name: '涉案金额', value: 120, unit: '万元', attention: 200, warning: 500, low: false, trend: [70, 130, 95, 120] },
      { id: 'major-it-events', name: '重大信息科技风险事件数量', value: 0, unit: '件', countOnly: true, trend: [0, 0, 1, 0] }
    ]
  };

  const topStorageKey = `institution-top-metrics-${institution}`;
  const businessStorageKey = `institution-business-risks-${institution}`;
  const savedTopSelection = (() => { try { return JSON.parse(localStorage.getItem(topStorageKey) || '{}'); } catch { return {}; } })();
  const selectedTopIds = {
    balance: balanceSheetMetrics.some(item => item.id === savedTopSelection.balance) ? savedTopSelection.balance : balanceSheetMetrics[0].id,
    financial: financialMetrics.some(item => item.id === savedTopSelection.financial) ? savedTopSelection.financial : financialMetrics[0].id,
    capital: capitalMetrics.some(item => item.id === savedTopSelection.capital) ? savedTopSelection.capital : capitalMetrics[1].id
  };
  let selectedBusinessIds = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(businessStorageKey) || '[]');
      const valid = Array.isArray(saved) ? saved.filter(id => businessRiskMetrics.some(item => item.id === id)).slice(0, 2) : [];
      return valid.length === 2 ? valid : ['abnormal-assets', 'watch-assets'];
    } catch { return ['abnormal-assets', 'watch-assets']; }
  })();
  let businessDraft = [...selectedBusinessIds];
  let activeRiskCategory = '集中度风险';
  sessionStorage.setItem('institution-risk-tab', activeRiskCategory);

  function formatNumber(value, decimals = 1) {
    return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function contextMetric(metric) {
    const institutionSeed = [...institution].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5 - 2;
    const periodIndex = { '2026-08': 0, '2026-07': -1, '2026-06': -2 }[$('#period').value] || 0;
    const magnitude = Math.max(1, Math.abs(metric.value));
    const shift = magnitude * (institutionSeed * .003 + periodIndex * .006);
    return { ...metric, value: metric.value + shift, trend: metric.trend.map((value, index) => value + shift * (.45 + index * .18)) };
  }
  function sparkline(values, tone = 'cyan', labelled = false) {
    const min = Math.min(...values); const max = Math.max(...values); const range = Math.max(1, max - min);
    const points = values.map((value, index) => `${8 + index * (144 / Math.max(1, values.length - 1))},${48 - ((value - min) / range) * 35}`).join(' ');
    const last = points.split(' ').at(-1).split(',');
    const area = `8,52 ${points} 152,52`;
    const nodes = points.split(' ').map((point, index) => { const [x, y] = point.split(','); return `<circle class="${index === values.length - 1 ? 'spark-last' : 'spark-node'}" cx="${x}" cy="${y}" r="${index === values.length - 1 ? 3.6 : 2.1}"/>`; }).join('');
    const labels = quarters.map(quarter => `<i>${quarter}</i>`).join('');
    return `<svg class="institution-spark tone-${tone}" viewBox="0 0 160 58" preserveAspectRatio="none" aria-label="最近4个季度趋势"><line x1="4" y1="18" x2="156" y2="18"/><line x1="4" y1="36" x2="156" y2="36"/><polygon class="spark-area" points="${area}"/><polyline class="spark-glow" points="${points}"/><polyline class="spark-line" points="${points}"/>${nodes}<circle class="spark-end-halo" cx="${last[0]}" cy="${last[1]}" r="6"/></svg>${labelled ? `<span class="spark-quarters">${labels}</span>` : ''}`;
  }
  function renderTopCard(key) {
    const pool = topMetricPools[key]; const selected = contextMetric(pool.metrics.find(item => item.id === selectedTopIds[key]) || pool.metrics[0]);
    const tone = key === 'capital' ? 'green' : key === 'financial' ? 'blue' : 'cyan';
    $(`[data-top-card="${key}"]`).innerHTML = `<div class="category-card-left"><label>${pool.label}<select data-top-select="${key}" aria-label="${pool.label}指标选择">${pool.metrics.map(item => `<option value="${item.id}" ${item.id === selectedTopIds[key] ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label><button class="category-value" data-detail="${selected.name}" data-detail-text="${pool.label}当前展示指标。当前值${formatNumber(selected.value, selected.decimals)}${selected.unit}，较上季${selected.change.replace(/[▲▼]\s*/, '')}。"><strong>${selected.name}</strong><b>${formatNumber(selected.value, selected.decimals)}<small>${selected.unit}</small></b><span>较上季 <em class="${selected.change.startsWith('▼') ? 'green' : 'cyan'}">${selected.change}</em></span></button></div><div class="category-trend"><span>最近4个季度趋势</span>${sparkline(selected.trend, tone, true)}</div>`;
    bindDetails();
  }
  function renderTopCards() { Object.keys(topMetricPools).forEach(renderTopCard); }

  function renderBusinessRisks() {
    const selected = selectedBusinessIds.map(id => businessRiskMetrics.find(item => item.id === id)).filter(Boolean);
    $('#businessRiskGrid').innerHTML = selected.map(item => `<button class="business-risk-item tone-${item.status === '黄灯' ? 'yellow' : 'green'}" data-detail="${item.name}" data-detail-text="${item.detail} 当前值${formatNumber(item.value, 1)}${item.unit}，当前状态${item.status}，较上期${item.change.replace(/[▲▼]\s*/, '')}。"><span class="business-risk-name">${item.name}</span><span class="business-risk-ring"><svg viewBox="0 0 120 120"><circle class="ring-track" cx="60" cy="60" r="54"/><circle class="ring-fill" cx="60" cy="60" r="54" pathLength="100" stroke-dasharray="${Math.min(100, item.value)} 100"/></svg><b>${formatNumber(item.value, 1)}<small>${item.unit}</small></b></span><span class="business-risk-state"><i></i>${item.status === '黄灯' ? '黄灯预警' : item.status === '红灯' ? '红灯预警' : '正常'}</span><span class="business-risk-change">较上期 <strong>${item.change}</strong></span></button>`).join('');
    bindDetails();
  }
  function statusOf(metric) {
    if (metric.low) return metric.value <= metric.warning ? 'red' : metric.value <= metric.attention ? 'yellow' : 'green';
    return metric.value >= metric.warning ? 'red' : metric.value >= metric.attention ? 'yellow' : 'green';
  }
  function metricValue(metric, value = metric.value) { return `${formatNumber(value, Number.isInteger(value) ? 0 : 1)}${metric.unit}`; }
  function renderRiskSummary() {
    const allMetrics = Object.values(riskMetrics).flat().filter(item => !item.countOnly);
    const red = allMetrics.filter(item => statusOf(item) === 'red').length;
    const yellow = allMetrics.filter(item => statusOf(item) === 'yellow').length;
    $('#riskSummary').innerHTML = `<button class="risk-summary-item red" data-risk-summary="red"><span>红灯预警指标数量<small>全部风险分类汇总</small></span><b>${red}<small>项</small></b></button><button class="risk-summary-item yellow" data-risk-summary="yellow"><span>黄灯预警指标数量<small>全部风险分类汇总</small></span><b>${yellow}<small>项</small></b></button><button class="risk-summary-item event" data-risk-summary="event"><span>重大风险事件数量<small>全部风险分类汇总</small></span><b>${events.length}<small>件</small></b></button>`;
  }
  function renderRiskTabs() {
    $('#riskTabs').innerHTML = Object.keys(riskMetrics).map(category => `<button role="tab" aria-selected="${category === activeRiskCategory}" class="${category === activeRiskCategory ? 'active' : ''}" data-risk-tab="${category}">${category}<b>${riskMetrics[category].length}</b></button>`).join('');
  }
  function renderRiskMetrics() {
    const items = riskMetrics[activeRiskCategory] || riskMetrics['信用风险'];
    const isOtherRisk = activeRiskCategory === '其他风险';
    const headingHint = $('.risk-monitor-panel .heading-tools small');
    const bandLegend = $('.risk-band-legend');
    if (headingHint) headingHint.textContent = isOtherRisk ? '当前值 · 最近4个季度趋势' : '当前值 · 阈值区间 · 最近4季度趋势';
    if (bandLegend) bandLegend.style.display = isOtherRisk ? 'none' : '';
    $('#riskMetricList').style.setProperty('--risk-count', items.length);
    $('#riskMetricList').dataset.count = String(items.length);
    $('#riskMetricList').innerHTML = items.map(metric => {
      if (isOtherRisk) return `<button class="risk-metric-row risk-other-row" data-detail="${metric.name}" data-detail-text="当前值${metricValue(metric)}；下方展示最近4个季度变化趋势。"><span class="risk-metric-name"><strong>${metric.name}</strong><small>其他风险监测指标</small></span><span class="risk-other-value"><small>当前值</small><b>${metricValue(metric)}</b></span><span class="risk-trend"><small>最近4个季度趋势</small>${sparkline(metric.trend, 'cyan', true)}</span></button>`;
      if (metric.countOnly) return `<button class="risk-metric-row risk-count-row" data-detail="${metric.name}" data-detail-text="本期${metric.name}${metricValue(metric)}。该事件类指标仅展示数量，不设置三色阈值区间。"><span class="risk-metric-name"><strong>${metric.name}</strong><small>事件类指标 · 本期汇总</small></span><span class="risk-count-value"><small>本期数量</small><b>${metricValue(metric)}</b><em>数量展示</em></span></button>`;
      const status = statusOf(metric); const statusLabel = status === 'red' ? '红灯预警' : status === 'yellow' ? '黄灯预警' : '正常';
      const direction = metric.low ? '数值越低越需关注' : '数值越高越需关注';
      const pointer = status === 'red' ? 84 : status === 'yellow' ? 50 : 16;
      const normalRange = metric.low ? `正常 ＞ ${metricValue(metric, metric.attention)}` : `正常 ＜ ${metricValue(metric, metric.attention)}`;
      const yellowRange = metric.low ? `黄灯 ${metricValue(metric, metric.warning)}～${metricValue(metric, metric.attention)}` : `黄灯 ${metricValue(metric, metric.attention)}～${metricValue(metric, metric.warning)}`;
      const redRange = metric.low ? `红灯 ≤ ${metricValue(metric, metric.warning)}` : `红灯 ≥ ${metricValue(metric, metric.warning)}`;
      return `<button class="risk-metric-row tone-${status}" data-detail="${metric.name}" data-detail-text="当前值${metricValue(metric)}；关注阈值${metricValue(metric, metric.attention)}；预警阈值${metricValue(metric, metric.warning)}。${direction}。"><span class="risk-metric-name"><strong>${metric.name}</strong><small>${direction}</small><em>${statusLabel}</em></span><span class="risk-segment-wrap"><span class="risk-current" style="left:${pointer}%"><i></i><small>当前值</small><b>${metricValue(metric)}</b></span><span class="risk-segments"><i class="normal">正常</i><i class="attention">黄灯预警</i><i class="severe">红灯预警</i></span><span class="risk-thresholds"><i>${normalRange}</i><i>${yellowRange}</i><i>${redRange}</i></span></span><span class="risk-trend"><small>最近4个季度趋势</small>${sparkline(metric.trend, status === 'red' ? 'red' : status === 'yellow' ? 'yellow' : 'cyan', true)}</span></button>`;
    }).join('');
    bindDetails();
  }
  function renderRiskMonitor() { renderRiskSummary(); renderRiskTabs(); renderRiskMetrics(); }

  function businessTable() {
    return `<div class="business-all-list">${businessRiskMetrics.map(item => `<button data-detail="${item.name}" data-detail-text="${item.detail} 当前值${formatNumber(item.value, 1)}${item.unit}。"><span><b>${item.name}</b><small>${item.detail}</small></span><strong>${formatNumber(item.value, 1)}${item.unit}</strong><em class="${item.status === '黄灯' ? 'yellow' : 'green'}">${item.status}</em></button>`).join('')}</div>`;
  }
  function openBusinessPicker() {
    businessDraft = [...selectedBusinessIds];
    const options = businessRiskMetrics.map(item => `<label class="business-picker-option"><input type="checkbox" data-business-option="${item.id}" ${businessDraft.includes(item.id) ? 'checked' : ''}><span><b>${item.name}</b><small>当前值 ${formatNumber(item.value, 1)}${item.unit} · ${item.status}</small></span></label>`).join('');
    openDialog('主要业务风险 · 选择首页指标', `<p class="business-picker-note">请从5项主要业务风险指标中选择2项，首页始终只展示2项。</p><div class="business-picker-options">${options}</div><div class="business-picker-actions"><span>已选择 <b>${businessDraft.length}</b>/2 项</span><button class="btn primary" data-action="save-business">保存并刷新</button></div>`);
  }

  function openDialog(title, content) {
    $('#modalRoot').innerHTML = `<div class="dialog-backdrop"><section class="dialog institution-dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><div class="dialog-header"><h2 id="dialogTitle">${title}</h2><button class="bare" data-action="close" aria-label="关闭弹窗">×</button></div><div class="dialog-crumb"><span>金融机构驾驶舱 / ${institution}</span></div><div class="dialog-content"><p class="dialog-summary">${content}</p><div class="institution-detail-grid"><div><span>当前机构</span><b>${institution}</b></div><div><span>观察月份</span><b>${$('#period').selectedOptions[0].textContent}</b></div><div><span>数据状态</span><b class="green">已更新</b></div></div><p class="case-note">本页面数据为交互演示样例，正式环境将由本机构报送数据、风险数据服务及舆情融合平台提供。</p></div></section></div>`;
    $('[data-action="close"]', $('#modalRoot')).focus();
  }
  function closeDialog() { $('#modalRoot').innerHTML = ''; }
  function bindDetails() { $$('[data-detail]').forEach(button => { if (button.dataset.bound) return; button.dataset.bound = '1'; button.addEventListener('click', () => openDialog(button.dataset.detail, button.dataset.detailText)); }); }

  function updatePeriod() {
    const data = monthData[$('#period').value];
    $('#asof').textContent = data.asof;
    renderTopCards();
    renderRiskSummary();
  }
  function updateClock() { const now = new Date(); $('#clock').textContent = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} ${now.toTimeString().slice(0, 8)}`; }
  function fitScreen() {
    const scale = Math.min(1, innerWidth / 1440, innerHeight / 810);
    const screen = $('#screen');
    screen.style.width = `${innerWidth / scale}px`;
    screen.style.height = `${innerHeight / scale}px`;
    screen.style.transform = `scale(${scale})`;
  }
  function stepFeed(kind, delta) { const items = kind === 'news' ? news : events; feedState[kind].index = (feedState[kind].index + delta + items.length) % items.length; kind === 'news' ? renderNews() : renderEvents(); }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.action === 'close') closeDialog();
    if (button.dataset.action === 'scope') openDialog('范围与口径', `当前页面展示${institution}自身经营、主要业务风险、风险指标监测、战略目标、舆情及重大风险事项，不包含其他机构数据。`);
    if (button.dataset.action === 'fullscreen') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => openDialog('全屏展示', '当前浏览器未开放全屏权限，可使用浏览器全屏功能查看。')); }
    if (button.dataset.action === 'workbench') window.parent.location.assign('/workbench');
    if (button.hasAttribute('data-business-all')) { openDialog('主要业务风险 · 全部5项', businessTable()); bindDetails(); }
    if (button.hasAttribute('data-business-config')) openBusinessPicker();
    if (button.dataset.action === 'save-business') {
      if (businessDraft.length !== 2) return;
      selectedBusinessIds = [...businessDraft];
      localStorage.setItem(businessStorageKey, JSON.stringify(selectedBusinessIds));
      closeDialog(); renderBusinessRisks();
    }
    if (button.dataset.riskTab) {
      activeRiskCategory = button.dataset.riskTab;
      sessionStorage.setItem('institution-risk-tab', activeRiskCategory);
      renderRiskSummary(); renderRiskTabs(); renderRiskMetrics();
    }
    if (button.dataset.riskSummary === 'event') {
      openDialog('重大风险事件 · 全部风险分类汇总', events.length ? events.map(item => `${item.time}　${item.risk}　${item.title}　${item.status}`).join('<br><br>') : '暂无重大风险事件。');
    }
    if (button.dataset.riskSummary === 'red' || button.dataset.riskSummary === 'yellow') {
      const target = button.dataset.riskSummary;
      const rows = Object.values(riskMetrics).flat().filter(item => !item.countOnly && statusOf(item) === target).map(item => `${item.name}　${metricValue(item)}`);
      openDialog(`全部风险分类汇总 · ${target === 'red' ? '红灯预警指标数量' : '黄灯预警指标数量'}`, rows.length ? rows.join('<br><br>') : '全部风险分类暂无对应状态指标。');
    }
    if (button.dataset.feed) { const [kind, delta] = button.dataset.feed.split(':'); stepFeed(kind, Number(delta)); }
    if (button.dataset.pause) { const state = feedState[button.dataset.pause]; state.paused = !state.paused; button.textContent = state.paused ? '▷' : 'Ⅱ'; button.setAttribute('aria-label', `${state.paused ? '播放' : '暂停'}${button.dataset.pause === 'news' ? '舆情' : '事件'}轮播`); }
    if (button.dataset.all === 'news') openDialog('舆情监测 · 全部线索', news.map(item => `${item.time}　${item.tone}　${item.title}`).join('<br><br>'));
    if (button.dataset.all === 'events') openDialog('重大风险事件 · 全部事项', events.map(item => `${item.time}　${item.risk}　${item.title}　${item.status}`).join('<br><br>'));
  });
  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-top-select]');
    if (select) {
      selectedTopIds[select.dataset.topSelect] = select.value;
      localStorage.setItem(topStorageKey, JSON.stringify(selectedTopIds));
      renderTopCard(select.dataset.topSelect);
      return;
    }
    const option = event.target.closest('[data-business-option]');
    if (!option) return;
    if (option.checked && !businessDraft.includes(option.dataset.businessOption)) {
      if (businessDraft.length >= 2) { option.checked = false; return; }
      businessDraft.push(option.dataset.businessOption);
    } else if (!option.checked) businessDraft = businessDraft.filter(id => id !== option.dataset.businessOption);
    const count = $('.business-picker-actions span b'); if (count) count.textContent = businessDraft.length;
    const save = $('[data-action="save-business"]'); if (save) save.disabled = businessDraft.length !== 2;
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDialog(); });
  $('#period').addEventListener('change', updatePeriod);

  window.addEventListener('resize', fitScreen);
  fitScreen(); renderTopCards(); renderBusinessRisks(); renderRiskMonitor(); renderNews(); renderEvents(); bindDetails(); updatePeriod(); updateClock();
  setInterval(updateClock, 1000);
  setInterval(() => { if (!feedState.news.paused) stepFeed('news', 1); if (!feedState.events.paused) stepFeed('events', 1); }, 3500);
})();
