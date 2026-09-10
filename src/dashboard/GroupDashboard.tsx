import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  businessOverview,
  eventMonitor,
  institutionPenetration,
} from './groupDashboardMockData';
import type { InstitutionPenetrationItem, InstitutionPenetrationMetric } from './groupDashboardMockData';

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

const riskCategories = [
  { id: 'credit', label: '信用' },
  { id: 'concentration', label: '集中度' },
  { id: 'liquidity', label: '流动性' },
  { id: 'market', label: '市场' },
  { id: 'operational', label: '操作' },
  { id: 'compliance', label: '合规' },
  { id: 'reputation', label: '声誉' },
  { id: 'it', label: '信息科技' },
  { id: 'strategic', label: '战略' },
] as const;

const heatmapRows: { id: string; name: string; routeId: string; type: string; cells: Record<string, HeatCell> }[] = [
  { id: 'amc', name: '国际AMC', routeId: 'inst-amc', type: '不良资产经营', cells: { credit: { red: 1 }, concentration: { red: 1, yellow: 1 }, liquidity: { yellow: 1 }, operational: { status: 'green' }, compliance: { yellow: 1 }, reputation: { status: 'green' }, it: { status: 'no-data' }, strategic: { status: 'none' }, market: { status: 'none' } } },
  { id: 'ht', name: '国泰海通', routeId: 'inst-guotai', type: '证券业务', cells: { credit: { status: 'green' }, concentration: { yellow: 1 }, liquidity: { status: 'green' }, market: { red: 1, yellow: 1 }, operational: { status: 'green' }, compliance: { status: 'green' }, reputation: { status: 'green' }, it: { status: 'green' }, strategic: { status: 'green' } } },
  { id: 'spdb', name: '浦发银行', routeId: 'inst-spdb', type: '银行业务', cells: { credit: { yellow: 1 }, concentration: { yellow: 1 }, liquidity: { yellow: 1 }, market: { status: 'green' }, operational: { status: 'green' }, compliance: { status: 'green' }, reputation: { status: 'green' }, it: { status: 'green' }, strategic: { status: 'green' } } },
  { id: 'srcb', name: '沪农商银行', routeId: 'inst-srcb', type: '银行业务', cells: { credit: { status: 'green' }, concentration: { yellow: 1 }, liquidity: { status: 'green' }, market: { red: 1 }, operational: { status: 'green' }, compliance: { yellow: 1 }, reputation: { status: 'green' }, it: { status: 'green' }, strategic: { status: 'green' } } },
];

const keyIndicatorCatalog: KeyIndicator[] = [
  { id: 'g-sector', name: '最大行业风险暴露占比', value: '28.60', unit: '%', scope: '并表口径', risk: '集中度风险', type: '管控', status: '黄灯', change: '▲ 0.40个百分点', threshold: '黄灯 ≥ 25.00% · 红灯 ≥ 30.00%', formula: '同一行业风险暴露 / 全部风险暴露 × 100%', source: '金控数仓 → 专题计算结果', trend: [18.4, 21.6, 25.8, 29.7, 27.1, 23.6, 21.9, 24.8, 27.6, 26.2, 28.2, 28.6] },
  { id: 'g-liq', name: '未来30日现金覆盖倍数', value: '1.32', unit: '倍', scope: '并表口径', risk: '流动性风险', type: '管控', status: '正常', change: '▲ 0.08倍', threshold: '黄灯 ≤ 1.20倍 · 红灯 ≤ 1.00倍', formula: '可动用现金流入 / 到期现金流出；受限资金不计入', source: '金控数仓 → 专题计算结果', trend: [0.94, 1.18, 1.42, 1.09, 1.51, 1.22, 1.63, 1.31, 1.57, 1.11, 1.24, 1.32] },
  { id: 'g-credit', name: '资产拨备率', value: '2.18', unit: '%', scope: '并表口径', risk: '信用风险', type: '监测', status: '正常', change: '▲ 0.06个百分点', threshold: '黄灯 ≤ 2.00% · 红灯 ≤ 1.50%', formula: '减值准备 / 相关资产余额 × 100%', source: '金控数仓 → 专题计算结果', trend: [1.46, 1.78, 2.16, 1.89, 2.34, 2.02, 2.48, 2.21, 1.83, 2.37, 2.12, 2.18] },
  { id: 'g-cap', name: '合格资本覆盖率', value: '138.40', unit: '%', scope: '并表口径', risk: '资本充足', type: '管控', status: '正常', change: '▲ 6.20个百分点', threshold: '黄灯 ≤ 130.00% · 红灯 ≤ 110.00%', formula: '抵消及调整后合格资本 / 最低资本要求 × 100%', source: '金控数仓 → 专题计算结果', trend: [111.6, 128.4, 119.8, 143.2, 132.6, 151.8, 140.4, 159.6, 147.1, 155.3, 132.2, 138.4] },
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
    <div className="gd-header-meta"><time>{stamp}</time><span>观察月份：2026年8月</span><span>集团 / 国资公司共用视图</span><button onClick={toggleFullscreen}>⛶ 全屏</button><button onClick={() => navigate('/workbench')}>返回工作台</button></div>
  </header>;
}

function BusinessStrip() {
  return <section className="gd-business"><div className="gd-business-label"><i /><div><h2>经营总览 <small>（集团并表口径）</small></h2></div></div>{businessOverview.map(item => <article key={item.label}><span className="gd-kpi-icon">{item.icon}</span><div><small>{item.label}</small><strong>{item.value}<em>{item.unit}</em></strong></div><dl><div><dt>同比</dt><dd className="rise">▲ {item.yoy}</dd></div><div><dt>环比</dt><dd className="good">▲ {item.mom}</dd></div></dl></article>)}</section>;
}

function HeatSignal({ cell }: { cell: HeatCell }) {
  const status = cell.red ? 'red' : cell.yellow ? 'yellow' : cell.status || 'none';
  if (cell.red || cell.yellow) return <span className={`gd-heat-flags ${status}`}>{cell.red ? <i className="red" aria-label={`${cell.red} 项红灯`} /> : null}{cell.yellow ? <i className="yellow" aria-label={`${cell.yellow} 项黄灯`} /> : null}</span>;
  const labels: Record<RiskStatus, string> = { red: '红灯', yellow: '黄灯', green: '正常', 'no-data': '缺数', overdue: '超期', none: '未配置' };
  return <span className={`gd-heat-state ${status}`}><i />{labels[status]}</span>;
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
      <header><div><h2>{entry.title}</h2><small>风险看板原页面</small></div><button onClick={onClose} aria-label="关闭风险看板弹窗">×</button></header>
      <iframe src={`/group-cockpit/index.html${separator}${entry.query}`} title={`${entry.title} · 风险看板`} allowFullScreen />
    </section>
  </div>, document.body);
}

function RiskHeatmapPanel({ openRiskBoard }: { openRiskBoard: OpenRiskBoard }) {
  return <Panel title="风险热力图" className="gd-heatmap-panel" actions={<button className="gd-panel-entry" onClick={() => openRiskBoard('', '风险看板')}>进入风险看板 ↗</button>}>
    <div className="gd-heatmap-legend"><span><i className="red" />红灯</span><span><i className="yellow" />黄灯</span><span><i className="green" />正常</span><span><i className="gray" />缺数 / 超期 / 未配置</span></div>
    <div className="gd-heatmap-grid" style={{ '--risk-columns': riskCategories.length } as CSSProperties}>
      <div className="gd-heat-axis corner">机构 / 风险类型</div>{riskCategories.map(risk => <div className="gd-heat-axis" key={risk.id}>{risk.label}</div>)}
      {heatmapRows.map(org => <div className="gd-heatmap-row" key={org.id}>
        <button className="gd-heat-org" onClick={() => openRiskBoard(`entry=org&org=${org.id}`, `${org.name} · 资本与风险监测`)}><b>{org.name}</b><small>{org.type} ↗</small></button>
        {riskCategories.map(risk => { const cell = org.cells[risk.id] || { status: 'none' as const }; return <button className="gd-heat-cell" key={risk.id} aria-label={`${org.name} ${risk.label}风险`} onClick={() => openRiskBoard(`entry=cell&org=${org.id}&cat=${risk.id}`, `${org.name} · ${risk.label}风险`)}><HeatSignal cell={cell} /></button>; })}
      </div>)}
    </div>
    <div className="gd-heatmap-foot"><span>旗帜颜色表示当前预警状态；点击后弹出风险看板原下钻页面</span><button onClick={() => openRiskBoard('entry=quality', '数据状态核对')}>数据状态 ↗</button></div>
  </Panel>;
}

function KeyIndicatorPanel({ openRiskBoard }: { openRiskBoard: OpenRiskBoard }) {
  const defaultIds = ['g-sector', 'g-liq', 'g-credit', 'g-cap'];
  const selectedIds = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('siig-risk-cockpit-selected-v5') || 'null');
      const valid = Array.isArray(saved) ? saved.filter(id => keyIndicatorCatalog.some(item => item.id === id)).slice(0, 4) : [];
      return valid.length === 4 ? valid as string[] : defaultIds;
    } catch { return defaultIds; }
  })();
  const selected = selectedIds.map(id => keyIndicatorCatalog.find(item => item.id === id)).filter((item): item is KeyIndicator => Boolean(item));
  return <Panel title="关键指标情况" className="gd-capital-panel" actions={<button className="gd-panel-entry" onClick={() => openRiskBoard('', '风险看板')}>已选 {selected.length} 项 · 进入看板 ↗</button>}>
    <div className="gd-capital-layout"><div className="gd-capital-grid">{selected.map((item, index) => <button className={`gd-capital-card ${item.status === '黄灯' ? 'yellow' : item.status === '红灯' ? 'red' : 'green'}`} key={item.id} onClick={() => openRiskBoard(`entry=indicator&id=${item.id}`, `${item.name} · 指标详情`)}>
      <header><span>{['◈', '◇', '▥', '✧'][index]}</span><b>{item.name}</b></header><strong>{item.value}<em>{item.unit}</em></strong><small className={item.status === '正常' ? 'up' : 'warn'}><span>{item.scope} · {item.type}</span>{item.change}</small><div className="gd-capital-trend"><em>近12个月趋势</em><LineChart values={item.trend} color={item.status === '黄灯' ? '#fac63e' : item.status === '红灯' ? '#ff5368' : '#42d9ff'} width={180} height={100} /><div className="gd-months"><span>9月</span><span>本月</span></div></div><i className="gd-card-status">{item.status === '正常' ? '○ 正常' : item.status === '黄灯' ? '△ 黄灯' : '● 红灯'}</i>
    </button>)}</div><button className="gd-capital-custom" onClick={() => openRiskBoard('entry=configure', '关键指标自定义')}><b>＋</b><span>自定义</span><small>进入看板设置</small></button></div>
  </Panel>;
}

function metricsForInstitution(item: InstitutionPenetrationItem): InstitutionPenetrationMetric[] {
  try {
    const stored = JSON.parse(localStorage.getItem(`siig-risk-cockpit-institution-${item.id}-v1-details`) || 'null');
    if (Array.isArray(stored) && stored.length === 2 && stored.every(metric => metric && typeof metric.id === 'string' && typeof metric.name === 'string')) return stored;
  } catch { /* fall back to the shared risk-board defaults */ }
  return item.metrics;
}

function InstitutionPenetrationPanel({ openRiskBoard }: { openRiskBoard: OpenRiskBoard }) {
  const [selectedId, setSelectedId] = useState<InstitutionPenetrationItem['id']>('spdb');
  const selected = institutionPenetration.find(item => item.id === selectedId) || institutionPenetration[0];
  const connectorPoints = [
    { id: 'spdb', d: 'M500 200 C440 165 390 115 315 78' },
    { id: 'cpic', d: 'M500 200 C560 165 610 115 685 78' },
    { id: 'ht', d: 'M500 200 C440 235 390 285 315 322' },
    { id: 'amc', d: 'M500 200 C560 235 610 285 685 322' },
  ];
  const configure = () => openRiskBoard(`entry=configure&context=institution&org=${selected.id}&limit=2`, `${selected.name} · 自定义指标`);
  return <Panel title="机构穿透监测" className="gd-equity-panel" actions={<div className="gd-penetration-actions"><span>Mock · 截至 2026-08-31</span><button onClick={configure}>＋ 自定义指标</button></div>}>
    <div className="gd-penetration-stage" aria-label="上海国际集团与四家金融机构穿透关系">
      <svg className="gd-penetration-links" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="gdLinkGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>{connectorPoints.map(link => <path key={link.id} d={link.d} className={selectedId === link.id ? 'active' : ''} />)}</svg>
      {institutionPenetration.map((item, index) => {
        const active = selectedId === item.id;
        return <button key={item.id} className={`gd-institution-card position-${index + 1} ${active ? 'active' : 'muted'}`} aria-pressed={active} onClick={() => setSelectedId(item.id)}>
          <header><span className="gd-institution-logo">{item.shortName.slice(0, 1)}</span><strong>{item.name}</strong><i>›</i></header>
          <dl className="gd-market-facts"><div><dt>持股比例</dt><dd>{item.equityRatio}</dd></div><div><dt>股价</dt><dd>{item.stockPrice}</dd></div><div><dt>市值</dt><dd>{item.marketValue}</dd></div></dl>
          <div className="gd-institution-metrics">{metricsForInstitution(item).slice(0, 2).map(metric => <article key={metric.id} className={metric.tone}>
            <span>{metric.name}</span><strong>{metric.value}<em>{metric.unit}</em></strong><small>{metric.change}</small>
          </article>)}</div>
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
  const openRiskBoard: OpenRiskBoard = (query = '', title = '风险看板') => setRiskBoardEntry({ query, title });
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
    <main className="gd-main-grid"><div className="gd-top-monitoring"><RiskHeatmapPanel openRiskBoard={openRiskBoard} /><KeyIndicatorPanel openRiskBoard={openRiskBoard} /></div><InstitutionPenetrationPanel openRiskBoard={openRiskBoard} /><EventPanel /></main>
    <footer className="gd-footer"><span><i />数据链路正常 · 观察期 2026年8月</span><span>{pageHint}</span></footer>
  </div>{riskBoardEntry && <RiskBoardOverlay entry={riskBoardEntry} onClose={() => setRiskBoardEntry(null)} />}</div>;
}
