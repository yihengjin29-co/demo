import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  businessOverview,
  eventMonitor,
  institutionPenetration,
} from './groupDashboardMockData';
import type { InstitutionPenetrationItem } from './groupDashboardMockData';

type Navigate = (path: string) => void;
type RiskBoardEntry = { query: string; title: string };
type OpenRiskBoard = (query?: string, title?: string) => void;

type RiskStatus = 'red' | 'yellow' | 'green' | 'no-data' | 'overdue' | 'none';
type HeatCell = { red?: number; yellow?: number; status?: RiskStatus };
type KeyIndicator = {
  id: string;
  name: string;
  value: string;
  unit: string;
  scope: string;
  risk: string;
  type: '监测' | '管控';
  status: '红灯' | '黄灯' | '正常';
  change: string;
  threshold: string;
  formula: string;
  source: string;
  trend: number[];
};

type ConsolidatedConcentration = {
  id: string;
  name: string;
  ratio: number;
  exposureLabel: string;
  exposure: string;
  change: string;
  tone: 'cyan' | 'yellow';
};

const consolidatedConcentrations: ConsolidatedConcentration[] = [
  { id: 'single-legal-max', name: '单一集团客户', ratio: 18.2, exposureLabel: '最大风险敞口', exposure: '118', change: '▲ 0.40个百分点', tone: 'yellow' },
  { id: 'top-ten-total', name: '前十大集团客户', ratio: 42.6, exposureLabel: '风险敞口合计', exposure: '246.4', change: '▼ 0.80个百分点', tone: 'cyan' },
];

const riskCategories = [
  { id: 'credit', label: '信用风险' },
  { id: 'concentration', label: '集中度风险' },
  { id: 'liquidity', label: '流动性风险' },
  { id: 'market', label: '市场风险' },
  { id: 'operational', label: '操作风险' },
  { id: 'compliance', label: '合规风险' },
  { id: 'reputation', label: '声誉风险' },
  { id: 'it', label: '信息科技风险' },
  { id: 'strategic', label: '战略风险' },
] as const;

const heatmapRows: { id: string; name: string; routeId: string; type: string; cells: Record<string, HeatCell> }[] = [
  { id: 'amc', name: '国际申信', routeId: 'inst-amc', type: '金融组织', cells: { credit: { red: 1 }, concentration: { red: 1, yellow: 1 }, liquidity: { yellow: 1 }, market: { red: 1 }, operational: { status: 'green' }, compliance: { status: 'green' }, reputation: { yellow: 1 }, it: { status: 'green' }, strategic: { status: 'green' } } },
  { id: 'ht', name: '国泰海通', routeId: 'inst-guotai', type: '证券业务', cells: { credit: { status: 'green' }, concentration: { yellow: 1 }, liquidity: { status: 'green' }, market: { status: 'green' }, operational: { status: 'green' }, compliance: { yellow: 1 }, reputation: { status: 'green' }, it: { status: 'green' }, strategic: { yellow: 1 } } },
  { id: 'spdb', name: '浦发银行', routeId: 'inst-spdb', type: '银行业务', cells: { credit: { yellow: 1 }, concentration: { yellow: 1 }, liquidity: { yellow: 1 }, market: { status: 'green' }, operational: { yellow: 1 }, compliance: { status: 'green' }, reputation: { status: 'green' }, it: { yellow: 1 }, strategic: { red: 1 } } },
  { id: 'srcb', name: '沪农商银行', routeId: 'inst-srcb', type: '银行业务', cells: { credit: { status: 'green' }, concentration: { yellow: 1 }, liquidity: { status: 'green' }, market: { yellow: 1 }, operational: { status: 'green' }, compliance: { status: 'green' }, reputation: { yellow: 1 }, it: { red: 1 }, strategic: { status: 'green' } } },
];

const keyIndicatorCatalog: KeyIndicator[] = [
  { id: 'g-sector', name: '最大行业风险暴露占比', value: '28.60', unit: '%', scope: '并表口径', risk: '集中度风险', type: '管控', status: '黄灯', change: '▲ 0.40个百分点', threshold: '黄灯 ≥ 25.00% · 红灯 ≥ 30.00%', formula: '同一行业风险暴露 / 全部风险暴露 × 100%', source: '金控数仓 → 专题计算结果', trend: [18.4, 21.6, 25.8, 29.7, 27.1, 23.6, 21.9, 24.8, 27.6, 26.2, 28.2, 28.6] },
  { id: 'g-liq', name: '未来30日现金覆盖倍数', value: '1.32', unit: '倍', scope: '并表口径', risk: '流动性风险', type: '管控', status: '正常', change: '▲ 0.08倍', threshold: '黄灯 ≤ 1.20倍 · 红灯 ≤ 1.00倍', formula: '可动用现金流入 / 到期现金流出；受限资金不计入', source: '金控数仓 → 专题计算结果', trend: [0.94, 1.18, 1.42, 1.09, 1.51, 1.22, 1.63, 1.31, 1.57, 1.11, 1.24, 1.32] },
  { id: 'g-credit', name: '资产拨备率', value: '2.18', unit: '%', scope: '并表口径', risk: '信用风险', type: '监测', status: '正常', change: '▲ 0.06个百分点', threshold: '黄灯 ≤ 2.00% · 红灯 ≤ 1.50%', formula: '减值准备 / 相关资产余额 × 100%', source: '金控数仓 → 专题计算结果', trend: [1.46, 1.78, 2.16, 1.89, 2.34, 2.02, 2.48, 2.21, 1.83, 2.37, 2.12, 2.18] },
  { id: 'g-cap', name: '资本充足率', value: '14.80', unit: '%', scope: '并表口径', risk: '资本充足', type: '管控', status: '正常', change: '▲ 0.20个百分点', threshold: '黄灯 ≤ 12.50% · 红灯 ≤ 10.50%', formula: '合格资本净额 / 风险加权资产 × 100%', source: '金控数仓 → 专题计算结果', trend: [13.6, 13.8, 13.7, 14, 14.1, 14.3, 14.2, 14.5, 14.4, 14.6, 14.6, 14.8] },
  { id: 'g-profit', name: '净利润', value: '52.80', unit: '亿元', scope: '并表口径', risk: '经营效率', type: '监测', status: '正常', change: '▲ 4.80%', threshold: '黄灯 ≤ 40.00亿元 · 红灯 ≤ 25.00亿元', formula: '同期间、同范围及调整规则计算的净利润', source: '金控数仓 → 专题计算结果', trend: [39.1, 41.5, 43.2, 42.8, 45.6, 47.1, 46.2, 49.4, 50.1, 51.4, 50.9, 52.8] },
  { id: 'g-leverage', name: '资产负债率', value: '72.40', unit: '%', scope: '并表口径', risk: '资本充足', type: '管控', status: '正常', change: '▼ 0.30个百分点', threshold: '黄灯 ≥ 75.00% · 红灯 ≥ 82.00%', formula: '调整后负债 / 调整后资产 × 100%', source: '金控数仓 → 专题计算结果', trend: [74.2, 74, 73.8, 73.6, 73.2, 73.5, 73.1, 72.9, 72.8, 72.6, 72.7, 72.4] },
];

function Panel({ title, className = '', children, actions }: { title: string; className?: string; children: ReactNode; actions?: ReactNode }) {
  return <section className={`gd-panel ${className}`}>
    <header className="gd-panel-title"><div><i /><h2>{title}</h2></div>{actions}</header>
    <div className="gd-panel-body">{children}</div>
  </section>;
}

function LineChart({ values, color, width = 180, height = 56, domain }: { values: number[]; color: string; width?: number; height?: number; domain?: [number, number] }) {
  const min = domain?.[0] ?? Math.min(...values);
  const max = domain?.[1] ?? Math.max(...values);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * width},${height - 7 - ((value - min) / range) * (height - 18)}`).join(' ');
  const pointPairs = points.split(' ');
  const last = pointPairs[pointPairs.length - 1]?.split(',').map(Number) || [width, height / 2];
  const gradientId = useId();
  return <svg className="gd-line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    <path d={`M0,${height - 2} L${points.split(' ').join(' L')} L${width},${height - 2} Z`} fill={`url(#${gradientId})`} />
    <polyline points={points} fill="none" stroke={color} strokeWidth="6" strokeOpacity=".16" vectorEffect="non-scaling-stroke" />
    <polyline points={points} fill="none" stroke={color} strokeWidth="2.6" vectorEffect="non-scaling-stroke" />
    <circle cx={last[0]} cy={last[1]} r="3.5" fill="#fff" stroke={color} strokeWidth="2" />
  </svg>;
}

function RadarChart({ axes, red, yellow }: { axes: string[]; red: number[]; yellow: number[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);
  const [size, setSize] = useState({ width: 640, height: 360 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const centerX = size.width / 2;
  const centerY = size.height / 2;
  const radius = Math.max(24, Math.min((size.width - 136) / 2, (size.height - 38) / 2));
  const maxValue = Math.max(1, ...red, ...yellow);
  const pointAt = (index: number, factor: number) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / axes.length;
    return [centerX + Math.cos(angle) * radius * factor, centerY + Math.sin(angle) * radius * factor];
  };
  const polygon = (values: number[]) => values.map((value, index) => pointAt(index, value / maxValue).join(',')).join(' ');
  return <><svg ref={ref} className="gd-radar" viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label="风险预警雷达图，悬停类别或数据点查看红黄灯数量" onMouseLeave={() => setHoveredAxis(null)} onMouseMove={event => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const angle = (Math.atan2(event.clientY - bounds.top - centerY, event.clientX - bounds.left - centerX) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    setHoveredAxis(Math.round(angle / (Math.PI * 2 / axes.length)) % axes.length);
  }}>
    <defs>
      <filter id="radarGlow"><feGaussianBlur stdDeviation="2.4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
    {[.25, .5, .75, 1].map(level => <polygon key={level} points={axes.map((_, index) => pointAt(index, level).join(',')).join(' ')} fill="none" stroke="rgba(63,191,232,.28)" strokeWidth="1" />)}
    {axes.map((_, index) => { const [x, y] = pointAt(index, 1); return <line key={index} x1={centerX} y1={centerY} x2={x} y2={y} stroke="rgba(63,191,232,.22)" />; })}
    <polygon points={polygon(yellow)} fill="rgba(250,198,62,.22)" stroke="#fac63e" strokeWidth="2" filter="url(#radarGlow)" />
    <polygon points={polygon(red)} fill="rgba(255,83,104,.26)" stroke="#ff5368" strokeWidth="2" filter="url(#radarGlow)" />
    {axes.map((axis, index) => {
      const [x, y] = pointAt(index, 1 + 12 / radius);
      const anchor = x < centerX - 8 ? 'end' : x > centerX + 8 ? 'start' : 'middle';
      const [redX, redY] = pointAt(index, red[index] / maxValue);
      const [yellowX, yellowY] = pointAt(index, yellow[index] / maxValue);
      return <g key={axis} tabIndex={0} aria-label={`${axis}：红灯${red[index]}项，黄灯${yellow[index]}项`} onFocus={() => setHoveredAxis(index)} onBlur={() => setHoveredAxis(null)}><circle cx={redX} cy={redY} r="4" fill="#ff6377" /><circle cx={yellowX} cy={yellowY} r="4" fill="#ffda63" /><text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="gd-radar-label">{axis}</text></g>;
    })}
  </svg>{hoveredAxis !== null && axes[hoveredAxis] && <div className="gd-radar-tooltip" role="tooltip"><b>{axes[hoveredAxis]}</b><span className="red">红灯指标预警 <strong>{red[hoveredAxis]}</strong> 项</span><span className="yellow">黄灯指标预警 <strong>{yellow[hoveredAxis]}</strong> 项</span><small>当前刻度：0–{maxValue} 项</small></div>}</>;
}

function DashboardHeader({ navigate }: { navigate: Navigate }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const stamp = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const toggleFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* browser may deny fullscreen */ }
  };
  return <header className="gd-header">
    <button className="gd-brand" onClick={() => navigate('/workbench')} title="返回工作台"><span className="gd-brand-bars"><i /><i /><i /></span><span><b>上海国际集团</b><small>SHANGHAI INTERNATIONAL GROUP</small></span></button>
    <div className="gd-title"><span className="gd-title-wing left" /><div><h1>集团及国资公司驾驶舱</h1></div><span className="gd-title-wing right" /></div>
    <div className="gd-header-meta">
      <time>{stamp}</time>
      <div className="gd-header-tools">
        <span>观察月份：2026年8月</span>
        <span>集团 / 国资公司共用视图</span>
        <select className="gd-dashboard-switcher" value="group" aria-label="切换驾驶舱" onChange={event => { if (event.target.value === 'amc') navigate('/dashboard/institution/inst-amc'); }}>
          <option value="group">集团驾驶舱</option>
          <option value="amc">国际申信金融组织驾驶舱</option>
        </select>
        <button onClick={toggleFullscreen}>⛶ 全屏</button>
        <button onClick={() => navigate('/workbench')}>返回工作台</button>
      </div>
    </div>
  </header>;
}

function BusinessStrip() {
  return <section className="gd-business" aria-label="集团经营指标">{businessOverview.map(item => <article key={item.label}><span className="gd-kpi-icon">{item.icon}</span><div><small>{item.label}</small><strong>{item.value}<em>{item.unit}</em></strong></div><dl><div><dt>同比</dt><dd className="rise">▲ {item.yoy}</dd></div><div><dt>环比</dt><dd className="good">▲ {item.mom}</dd></div></dl></article>)}</section>;
}

function HeatSignal({ cell }: { cell: HeatCell }) {
  const status = cell.red ? 'red' : cell.yellow ? 'yellow' : cell.status || 'none';
  const labels: Record<RiskStatus, string> = { red: '红灯预警', yellow: '黄灯预警', green: '正常', 'no-data': '缺数', overdue: '超期', none: '未配置' };
  // The grid uses one consolidated light only; red takes priority over yellow.
  return <span className={`gd-heat-state ${status}`} aria-label={labels[status]} title={labels[status]}><i /></span>;
}

function RiskBoardOverlay({ entry, onClose }: { entry: RiskBoardEntry; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  const separator = entry.query ? '?' : '';
  return createPortal(<div className="gd-riskboard-mask" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="gd-riskboard-dialog" role="dialog" aria-modal="true" aria-label={entry.title}>
      <header><div><h2>{entry.title}</h2><small>集团风险专题视图</small></div><button onClick={onClose} aria-label="关闭风险专题看板弹窗">×</button></header>
      <iframe src={`/group-cockpit/index.html${separator}${entry.query}`} title={entry.title} allowFullScreen />
    </section>
  </div>, document.body);
}

function RiskHeatmapPanel({ openRiskBoard }: { openRiskBoard: OpenRiskBoard }) {
  return <Panel title="风险热力图" className="gd-heatmap-panel" actions={<button className="gd-panel-entry" onClick={() => openRiskBoard('', '风险专题看板')}>进入风险专题看板 ↗</button>}>
    <div className="gd-heatmap-legend"><span><i className="red" />红灯</span><span><i className="yellow" />黄灯</span><span><i className="green" />正常</span><span><i className="gray" />缺数 / 超期 / 未配置</span></div>
    <div className="gd-heatmap-grid" style={{ '--risk-columns': riskCategories.length } as CSSProperties}>
      <div className="gd-heat-axis corner">机构 / 风险类型</div>{riskCategories.map(risk => <div className="gd-heat-axis" key={risk.id}>{risk.label}</div>)}
      {heatmapRows.map(org => <div className="gd-heatmap-row" key={org.id}>
        <div className="gd-heat-org"><b>{org.name}</b></div>
        {riskCategories.map(risk => { const cell = org.cells[risk.id] || { status: 'none' as const }; return <button type="button" className="gd-heat-cell" key={risk.id} aria-label={`${org.name} ${risk.label}，点击查看指标明细`} onClick={() => openRiskBoard(`entry=cell&org=${org.id}&cat=${risk.id}`, `${org.name} · ${risk.label}`)}><HeatSignal cell={cell} /></button>; })}
      </div>)}
    </div>
    <div className="gd-heatmap-foot"><span>亮灯表示当前综合风险状态（红黄并存时按红灯展示）</span></div>
  </Panel>;
}

function ConsolidatedConcentrationPanel() {
  return <Panel title="并表集中度监测" className="gd-consolidated-gauge-panel">
    <div className="gd-consolidated-gauges">{consolidatedConcentrations.map(item => {
      const ratio = Math.max(0, Math.min(100, item.ratio));
      return <article className={`gd-consolidated-gauge ${item.tone}`} key={item.id}>
        <h3>{item.name}</h3>
        <div className="gd-consolidated-ring" aria-label={`${item.name}集中度 ${item.ratio.toFixed(1)}%`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="gd-ring-track" cx="60" cy="60" r="51" pathLength="100" />
            <circle className="gd-ring-value" cx="60" cy="60" r="51" pathLength="100" strokeDasharray={`${ratio} ${100 - ratio}`} />
          </svg>
          <div><strong>{item.ratio.toFixed(1)}<small>%</small></strong><span>集中度</span></div>
        </div>
        <dl><dt>{item.exposureLabel}</dt><dd>{item.exposure}<small>亿元</small></dd></dl>
        <p>较上月 <b>{item.change}</b></p>
      </article>;
    })}</div>
  </Panel>;
}

function KeyIndicatorPanel({ openRiskBoard }: { openRiskBoard: OpenRiskBoard }) {
  const defaultIds = ['g-cap', 'g-leverage', 'g-credit'];
  const legacyDefaultIds = ['g-sector', 'g-liq', 'g-credit'];
  const selectedIds = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('siig-risk-cockpit-selected-v5') || 'null');
      const valid = Array.isArray(saved) ? saved.filter(id => keyIndicatorCatalog.some(item => item.id === id)) as string[] : [];
      const isLegacyDefault = valid.length === legacyDefaultIds.length && legacyDefaultIds.every((id, index) => valid[index] === id);
      return [...new Set([...(isLegacyDefault ? [] : valid), ...defaultIds])].slice(0, 3);
    } catch { return defaultIds; }
  })();
  const selected = selectedIds.map(id => keyIndicatorCatalog.find(item => item.id === id)).filter((item): item is KeyIndicator => Boolean(item));
  return <Panel title="关键指标情况" className="gd-capital-panel">
    <div className="gd-capital-layout"><div className="gd-capital-grid">{selected.map((item, index) => <button type="button" className={`gd-capital-card ${item.status === '黄灯' ? 'yellow' : item.status === '红灯' ? 'red' : 'green'}`} key={item.id} aria-label={`查看${item.name}指标详情`} onClick={() => openRiskBoard(`entry=indicator&id=${item.id}`, `${item.name} · 指标详情`)}>
      <header><span>{['◈', '◇', '▥'][index]}</span><b>{item.name}</b></header><strong>{item.value}<em>{item.unit}</em></strong><small className={item.status === '正常' ? 'up' : 'warn'}>{item.change}</small><div className="gd-capital-trend"><em>近12个月趋势</em><LineChart values={item.trend} color={item.status === '黄灯' ? '#fac63e' : item.status === '红灯' ? '#ff5368' : '#42d9ff'} width={180} height={100} /><div className="gd-months"><span>9月</span><span>本月</span></div></div><i className="gd-card-status">{item.status === '正常' ? '○ 正常' : item.status === '黄灯' ? '△ 黄灯' : '● 红灯'}</i>
    </button>)}</div></div>
  </Panel>;
}

const institutionPriceTrend: Partial<Record<InstitutionPenetrationItem['id'], number[]>> = {
  spdb: [8.1, 8.4, 8.2, 8.8, 9.2, 8.9, 9.5, 9.1, 9.6, 9.3, 9.7, 9.86],
  srcb: [5.8, 5.9, 6.2, 6, 6.4, 6.2, 6.5, 6.7, 6.4, 6.6, 6.7, 6.88],
  ht: [14, 14.6, 14.2, 15.1, 16, 15.4, 16.8, 17.2, 16.8, 15.9, 16.1, 16.42],
};

function InstitutionMarketPanel({ navigate }: { navigate: Navigate }) {
  const [selectedId, setSelectedId] = useState<InstitutionPenetrationItem['id']>('spdb');
  const connectorPoints = [
    { id: 'spdb', d: 'M450 145 C408 125 370 92 315 78', anchor: [450, 145], end: [315, 78] },
    { id: 'srcb', d: 'M550 145 C592 125 630 92 685 78', anchor: [550, 145], end: [685, 78] },
    { id: 'ht', d: 'M450 255 C408 275 370 308 315 322', anchor: [450, 255], end: [315, 322] },
    { id: 'amc', d: 'M550 255 C592 275 630 308 685 322', anchor: [550, 255], end: [685, 322] },
  ];
  return <Panel title="机构市值监测" className="gd-equity-panel gd-market-forecast-panel" actions={<div className="gd-penetration-actions"><span>重点持股机构市场表现 · 截至 2026-08-31</span></div>}>
    <div className="gd-penetration-stage" aria-label="上海国际集团四家重点持股机构市场表现">
      <svg className="gd-penetration-links" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="gdLinkGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>{connectorPoints.map(link => <g key={link.id} className={selectedId === link.id ? 'active' : ''}><path d={link.d} /><circle cx={link.anchor[0]} cy={link.anchor[1]} r="5" /><circle className="end" cx={link.end[0]} cy={link.end[1]} r="3.5" /></g>)}</svg>
      {institutionPenetration.map((item, index) => {
        const active = selectedId === item.id;
        const priceTrend = institutionPriceTrend[item.id];
        return <button key={item.id} className={`gd-institution-card position-${index + 1} ${active ? 'active' : 'muted'}`} aria-pressed={active} onClick={() => { setSelectedId(item.id); if (item.id === 'amc') navigate('/dashboard/institution/inst-amc'); }}>
          <header><span className="gd-institution-logo">{item.shortName.slice(0, 1)}</span><strong>{item.name}</strong><i>›</i></header>
          <div className="org-market-split">
            <dl className="org-quote"><div><dt>股价</dt><dd>{item.stockPrice}</dd></div><div><dt>持股比例</dt><dd>{item.equityRatio}</dd></div></dl>
            <div className="org-price-trend">
              <small>{priceTrend ? '近12个月股价 · 示例' : '非上市 · 无公开股价走势'}</small>
              {priceTrend ? <LineChart values={priceTrend} color="#52dcff" width={220} height={65} /> : <div className="org-no-price">—</div>}
              <small>{priceTrend ? '2025.09 — 2026.08' : '点击进入金融组织驾驶舱 ↗'}</small>
            </div>
          </div>
        </button>;
      })}
      <div className="gd-group-node"><strong>上海国际集团</strong></div>
    </div>
  </Panel>;
}

function EventPanel() {
  const [active, setActive] = useState<string | null>(null);
  return <Panel title="重大事项监测" className="gd-event-panel">
    <div className="gd-event-grid">{eventMonitor.map(item => <button key={item.name} className={`${item.tone} ${active === item.name ? 'active' : ''}`} aria-pressed={active === item.name} onClick={() => setActive(item.name)}>
      <small className="gd-event-name">{item.name}</small>
      <div className="gd-event-value"><i>{item.icon}</i><strong>{item.value}<em>件</em></strong></div>
      <div className="gd-event-change"><b>较上月 {item.delta}</b><em>›</em></div>
    </button>)}</div>
    <div className="gd-event-selection" role="status">{active ? `已选择：${active}` : ''}</div>
  </Panel>;
}

export default function GroupDashboard({ navigate }: { navigate: Navigate }) {
  const pageHint = useMemo(() => 'DEMO 数据仅用于界面展示，不代表真实业务数据', []);
  const [riskBoardEntry, setRiskBoardEntry] = useState<RiskBoardEntry | null>(null);
  const openRiskBoard: OpenRiskBoard = (query = '', title = '风险专题看板') => setRiskBoardEntry({ query, title });
  useEffect(() => {
    const handleRiskBoardMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'institution-metrics-updated') return;
      setRiskBoardEntry(null);
    };
    window.addEventListener('message', handleRiskBoardMessage);
    return () => window.removeEventListener('message', handleRiskBoardMessage);
  }, []);
  return <div className="group-dashboard-host"><div className="group-dashboard-screen">
    <DashboardHeader navigate={navigate} />
    <BusinessStrip />
    <main className="gd-main-grid"><div className="gd-top-monitoring"><ConsolidatedConcentrationPanel /><RiskHeatmapPanel openRiskBoard={openRiskBoard} /><KeyIndicatorPanel openRiskBoard={openRiskBoard} /></div><InstitutionMarketPanel navigate={navigate} /><EventPanel /></main>
    <footer className="gd-footer"><span><i />数据链路正常 · 观察期 2026年8月</span><span>{pageHint}</span></footer>
  </div>{riskBoardEntry && <RiskBoardOverlay entry={riskBoardEntry} onClose={() => setRiskBoardEntry(null)} />}</div>;
}
