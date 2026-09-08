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

  const radarMetrics = [
    { key: 'roe', label: 'ROE', unit: '%', max: 10 },
    { key: 'roa', label: 'ROA', unit: '%', max: 1.5 },
    { key: 'netProfit', label: '净利润', unit: '亿元', max: 70 },
    { key: 'riskCoverage', label: '风险覆盖率', unit: '%', max: 200 },
    { key: 'assetLiability', label: '资产负债率', unit: '%', max: 100 },
    { key: 'capitalLeverage', label: '资本杠杆率', unit: '倍', max: 10 },
    { key: 'liabilityDependence', label: '负债依存度', unit: '%', max: 80 },
    { key: 'operatingCash', label: '营业现金比率', unit: '倍', max: 1.6 }
  ];
  const radarPeriods = [
    { id: '2026-08', label: '2026年08月', short: '本月', color: '#53deff', values: { roe: 7.60, roa: 1.16, netProfit: 52.8, riskCoverage: 160.0, assetLiability: 91.4, capitalLeverage: 6.80, liabilityDependence: 62.4, operatingCash: 1.32 } },
    { id: '2026-07', label: '2026年07月', short: '上月', color: '#8c7cff', values: { roe: 7.42, roa: 1.12, netProfit: 50.6, riskCoverage: 156.8, assetLiability: 91.7, capitalLeverage: 6.70, liabilityDependence: 63.1, operatingCash: 1.28 } },
    { id: '2026-06', label: '2026年06月', short: '6月', color: '#f6c46c', values: { roe: 7.31, roa: 1.08, netProfit: 48.2, riskCoverage: 153.4, assetLiability: 92.0, capitalLeverage: 6.62, liabilityDependence: 63.8, operatingCash: 1.21 } },
    { id: '2026-05', label: '2026年05月', short: '5月', color: '#55d8bc', values: { roe: 7.18, roa: 1.04, netProfit: 45.7, riskCoverage: 151.2, assetLiability: 92.3, capitalLeverage: 6.55, liabilityDependence: 64.2, operatingCash: 1.18 } },
    { id: '2026-04', label: '2026年04月', short: '4月', color: '#548bff', values: { roe: 7.04, roa: 1.01, netProfit: 42.9, riskCoverage: 148.6, assetLiability: 92.5, capitalLeverage: 6.48, liabilityDependence: 64.9, operatingCash: 1.14 } },
    { id: '2026-03', label: '2026年03月', short: '3月', color: '#ff778a', values: { roe: 6.92, roa: 0.98, netProfit: 39.8, riskCoverage: 146.1, assetLiability: 92.8, capitalLeverage: 6.41, liabilityDependence: 65.3, operatingCash: 1.09 } }
  ];
  let selectedRadarPeriods = new Set(['2026-08', '2026-07']);
  function point(cx, cy, radius, angle, ratio = 1) { const a = (angle - 90) * Math.PI / 180; return [cx + Math.cos(a) * radius * ratio, cy + Math.sin(a) * radius * ratio]; }
  function polygonPoints(values, radius, cx, cy) { return values.map((value, index) => point(cx, cy, radius, index * 45, value).join(',')).join(' '); }
  function formatMetric(metric, value) { const decimals = metric.key === 'netProfit' || metric.key === 'riskCoverage' || metric.key === 'assetLiability' || metric.key === 'liabilityDependence' ? 1 : 2; return `${Number(value).toFixed(decimals).replace(/\.00$/, '')}${metric.unit}`; }
  function normalizedValues(period) { return radarMetrics.map(metric => Math.max(.12, Math.min(1, period.values[metric.key] / metric.max))); }
  function renderRadarPicker() {
    $('#radarPeriodPicker').innerHTML = radarPeriods.map(period => `<label style="--series-color:${period.color}"><input type="checkbox" value="${period.id}" ${selectedRadarPeriods.has(period.id) ? 'checked' : ''}><i></i>${period.short}</label>`).join('');
    $$('#radarPeriodPicker input').forEach(input => input.addEventListener('change', () => {
      if (input.checked) selectedRadarPeriods.add(input.value);
      else if (selectedRadarPeriods.size > 1) selectedRadarPeriods.delete(input.value);
      else input.checked = true;
      renderRadar(); renderRadarPicker();
    }));
  }
  function renderRadar() {
    const svg = $('#operationRadar'); const cx = 320; const cy = 175; const radius = 126;
    const selected = radarPeriods.filter(period => selectedRadarPeriods.has(period.id));
    const primary = selected[0] || radarPeriods[0];
    const grids = [1, .8, .6, .4, .2].map(level => `<polygon class="radar-grid" points="${polygonPoints(Array(8).fill(level), radius, cx, cy)}"/>`).join('');
    const axes = radarMetrics.map((_, index) => { const p = point(cx, cy, radius, index * 45); return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}"/>`; }).join('');
    const labels = radarMetrics.map((metric, index) => { const p = point(cx, cy, radius + 31, index * 45); const anchor = Math.abs(p[0] - cx) < 10 ? 'middle' : p[0] < cx ? 'end' : 'start'; return `<text class="radar-label" x="${p[0]}" y="${p[1] + 2}" text-anchor="${anchor}">${metric.label}</text><text class="radar-value-label" x="${p[0]}" y="${p[1] + 17}" text-anchor="${anchor}">${formatMetric(metric, primary.values[metric.key])}</text>`; }).join('');
    const series = [...selected].reverse().map((period, seriesIndex) => {
      const ratios = normalizedValues(period);
      const shape = `<polygon class="radar-series" points="${polygonPoints(ratios, radius, cx, cy)}" fill="${period.color}${seriesIndex === selected.length - 1 ? '2f' : '12'}" stroke="${period.color}" style="filter:drop-shadow(0 0 5px ${period.color}55)"/>`;
      const points = radarMetrics.map((metric, index) => { const p = point(cx, cy, radius, index * 45, ratios[index]); return `<circle class="radar-point" cx="${p[0]}" cy="${p[1]}" r="3.5" tabindex="0" stroke="${period.color}" style="filter:drop-shadow(0 0 4px ${period.color})" data-radar="${metric.label}" data-month="${period.label}" data-value="${formatMetric(metric, period.values[metric.key])}"/>`; }).join('');
      return shape + points;
    }).join('');
    svg.innerHTML = `${grids}${axes}${series}${labels}`;
    $('#radarLegend').querySelector('div').innerHTML = selected.map(period => `<span style="--legend-color:${period.color}"><i></i>${period.label}</span>`).join('');
    $$('.radar-point', svg).forEach(node => {
      node.addEventListener('mouseenter', showRadarTip); node.addEventListener('focus', showRadarTip);
      node.addEventListener('mouseleave', hideRadarTip); node.addEventListener('blur', hideRadarTip);
    });
  }
  function showRadarTip(event) { const tip = $('#radarTip'); const rect = event.target.getBoundingClientRect(); tip.hidden = false; tip.textContent = `${event.target.dataset.month} · ${event.target.dataset.radar}：${event.target.dataset.value}`; tip.style.left = `${rect.left + 10}px`; tip.style.top = `${rect.top - 34}px`; }
  function hideRadarTip() { $('#radarTip').hidden = true; }

  function openDialog(title, content) {
    $('#modalRoot').innerHTML = `<div class="dialog-backdrop"><section class="dialog institution-dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><div class="dialog-header"><h2 id="dialogTitle">${title}</h2><button class="bare" data-action="close" aria-label="关闭弹窗">×</button></div><div class="dialog-crumb"><span>金融机构驾驶舱 / ${institution}</span></div><div class="dialog-content"><p class="dialog-summary">${content}</p><div class="institution-detail-grid"><div><span>当前机构</span><b>${institution}</b></div><div><span>观察月份</span><b>${$('#period').selectedOptions[0].textContent}</b></div><div><span>数据状态</span><b class="green">已更新</b></div></div><p class="case-note">本页面数据为交互演示样例，正式环境将由本机构报送数据、风险数据服务及舆情融合平台提供。</p></div></section></div>`;
    $('[data-action="close"]', $('#modalRoot')).focus();
  }
  function closeDialog() { $('#modalRoot').innerHTML = ''; }
  function bindDetails() { $$('[data-detail]').forEach(button => { if (button.dataset.bound) return; button.dataset.bound = '1'; button.addEventListener('click', () => openDialog(button.dataset.detail, button.dataset.detailText)); }); }

  function updatePeriod() {
    const data = monthData[$('#period').value];
    $('[data-kpi="yellow"]').textContent = String(data.yellow).padStart(2, '0');
    $('[data-kpi="red"]').textContent = String(data.red).padStart(2, '0');
    $('[data-kpi="events"]').textContent = String(data.events).padStart(2, '0');
    $('#asof').textContent = data.asof;
    const currentIndex = radarPeriods.findIndex(period => period.id === $('#period').value);
    if (currentIndex >= 0) {
      const comparison = radarPeriods[Math.min(currentIndex + 1, radarPeriods.length - 1)];
      selectedRadarPeriods = new Set([radarPeriods[currentIndex].id, comparison.id]);
      renderRadarPicker();
      renderRadar();
    }
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
    if (button.dataset.action === 'scope') openDialog('范围与口径', `当前页面展示${institution}自身经营、预警、集中度、战略目标、舆情及重大风险事项，不包含其他机构数据。`);
    if (button.dataset.action === 'fullscreen') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => openDialog('全屏展示', '当前浏览器未开放全屏权限，可使用浏览器全屏功能查看。')); }
    if (button.dataset.feed) { const [kind, delta] = button.dataset.feed.split(':'); stepFeed(kind, Number(delta)); }
    if (button.dataset.pause) { const state = feedState[button.dataset.pause]; state.paused = !state.paused; button.textContent = state.paused ? '▷' : 'Ⅱ'; button.setAttribute('aria-label', `${state.paused ? '播放' : '暂停'}${button.dataset.pause === 'news' ? '舆情' : '事件'}轮播`); }
    if (button.dataset.all === 'news') openDialog('舆情监测 · 全部线索', news.map(item => `${item.time}　${item.tone}　${item.title}`).join('<br><br>'));
    if (button.dataset.all === 'events') openDialog('重大风险事件 · 全部事项', events.map(item => `${item.time}　${item.risk}　${item.title}　${item.status}`).join('<br><br>'));
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDialog(); });
  $('#period').addEventListener('change', updatePeriod);

  window.addEventListener('resize', fitScreen);
  fitScreen(); renderRadarPicker(); renderRadar(); renderNews(); renderEvents(); bindDetails(); updatePeriod(); updateClock();
  setInterval(updateClock, 1000);
  setInterval(() => { if (!feedState.news.paused) stepFeed('news', 1); if (!feedState.events.paused) stepFeed('events', 1); }, 3500);
})();
