import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  businessOverview,
  capitalMetrics,
  concentrationRisk,
  eventMonitor,
  institutionImpacts,
  investmentSummary,
  riskScopes,
  riskWarningByScope,
  type RiskKind,
  type RiskScope,
} from './groupDashboardMockData';

type Navigate = (path: string) => void;

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
    <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
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
  return <section className="gd-business"><div className="gd-business-label"><i /><div><h2>经营总览</h2></div></div>{businessOverview.map(item => <article key={item.label}><span className="gd-kpi-icon">{item.icon}</span><div><small>{item.label}</small><strong>{item.value}<em>{item.unit}</em></strong></div><dl><div><dt>同比</dt><dd className="rise">▲ {item.yoy}</dd></div><div><dt>环比</dt><dd className="good">▲ {item.mom}</dd></div></dl></article>)}</section>;
}

function ConcentrationPanel() {
  return <Panel title="并表风险暴露监测" className="gd-concentration-panel">
    <div className="gd-chart-caption"><span>前5大客户集团 · 单位：亿元</span><div><span><i className="single" />单一法人最大风险暴露</span><span><i className="consolidated" />集团并表风险暴露</span></div></div>
    <div className="gd-bars"><div className="gd-y-axis"><span>120</span><span>90</span><span>60</span><span>30</span><span>0</span></div>{concentrationRisk.map(item => <div className="gd-bar-group" key={item.name} title={`${item.name}（${item.group}）\n单一法人最大暴露：${item.single}亿元（${item.institution}）\n集团并表总暴露：${item.consolidated}亿元\n并表较单体增加：${item.consolidated - item.single}亿元\n${item.warning ? '已进入预警区间' : '未进入预警区间'}`}>
      <div className="gd-bar-stage"><span className="gd-bar single" style={{ height: `${item.single / 120 * 100}%` }}><b>{item.single}</b></span><span className={`gd-bar consolidated ${item.warning ? 'warning' : ''}`} style={{ height: `${item.consolidated / 120 * 100}%` }}><b>{item.consolidated}</b></span></div>
      <strong>{item.name}</strong><small>{item.name === '客户A' ? `（${item.group}）` : '　'}</small>
    </div>)}</div>
  </Panel>;
}

function RiskPanel() {
  const [kind, setKind] = useState<RiskKind>('financial');
  const [scope, setScope] = useState<RiskScope>('集团');
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setKind(current => current === 'financial' ? 'nonFinancial' : 'financial'), 6000);
    return () => window.clearInterval(timer);
  }, [paused]);
  const data = riskWarningByScope[scope][kind];
  const redTotal = data.red.reduce((sum, value) => sum + value, 0);
  const yellowTotal = data.yellow.reduce((sum, value) => sum + value, 0);
  return <Panel title="风险预警监测" className="gd-risk-panel" actions={<div className="gd-risk-tabs" aria-label="风险类型"><button aria-pressed={kind === 'financial'} className={kind === 'financial' ? 'active' : ''} onClick={() => setKind('financial')}>财务风险</button><button aria-pressed={kind === 'nonFinancial'} className={kind === 'nonFinancial' ? 'active' : ''} onClick={() => setKind('nonFinancial')}>非财务风险</button></div>}>
    <div className="gd-risk-content" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="gd-risk-summary"><article className="red"><i>!</i><span>红灯指标预警<strong>{redTotal}<em>项</em></strong></span><small>较上月 <b>{data.redDelta >= 0 ? '▲' : '▼'} {Math.abs(data.redDelta)}</b></small></article><article className="yellow"><i>!</i><span>黄灯指标预警<strong>{yellowTotal}<em>项</em></strong></span><small>较上月 <b>{data.yellowDelta >= 0 ? '▲' : '▼'} {Math.abs(data.yellowDelta)}</b></small></article></div>
      <div className="gd-risk-visual"><div className="gd-radar-wrap"><RadarChart axes={data.axes} red={data.red} yellow={data.yellow} /></div><aside className="gd-risk-side"><div className="gd-scope-heading">统计维度</div><div className="gd-scope-tabs" aria-label="统计维度">{riskScopes.map(item => <button key={item} aria-pressed={scope === item} className={scope === item ? 'active' : ''} onClick={() => setScope(item)}>{item}<span>›</span></button>)}</div><div className="gd-radar-legend"><span><i className="red" />红灯指标预警</span><span><i className="yellow" />黄灯指标预警</span></div></aside></div>
    </div>
  </Panel>;
}

function CapitalPanel() {
  return <Panel title="资本监测" className="gd-capital-panel"><div className="gd-capital-grid">{capitalMetrics.map((item, index) => <article key={item.label}><header><span>{['✧', '▰', '▥'][index]}</span><b>{item.label}</b></header><strong>{item.value.replace('%', '')}<em>%</em></strong><small className={item.tone}><span>较上月</span>{item.change}</small><div className="gd-capital-trend"><em>近12个月趋势</em><LineChart values={item.trend} color="#42d9ff" width={180} height={100} /><div className="gd-months"><span>9月</span><span>本月</span></div></div></article>)}</div></Panel>;
}

function EquityPanel() {
  const [selectedName, setSelectedName] = useState('国际AMC');
  const selectedIndex = institutionImpacts.findIndex(item => item.institutionName === selectedName);
  const selected = institutionImpacts[selectedIndex];
  const operation = selected.operationContribution;
  const risk = selected.riskImpact;
  const selectedBranch = 12.5 + selectedIndex * 25;
  const operationCards = [
    { label: '总资产贡献', value: operation.totalAssets, share: operation.totalAssetsGroupShare },
    { label: '净资产贡献', value: operation.netAssets, share: operation.netAssetsGroupShare },
    { label: '营业收入贡献', value: operation.revenue, share: operation.revenueGroupShare },
    { label: '利润贡献', value: operation.profit, share: operation.profitGroupShare },
  ];
  const riskCards = [
    { label: '风险暴露规模', value: risk.riskExposure, share: risk.riskExposureGroupShare },
    { label: '集中度敞口', value: risk.concentrationExposure, share: risk.concentrationExposureGroupShare },
  ];
  const valueText = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });
  return <Panel title="机构穿透监测" className="gd-equity-panel" actions={<small className="gd-impact-date">Mock · 截至 2026-08-31</small>}>
    <section className="gd-ownership" aria-label="机构关系穿透">
      <h3>机构关系穿透</h3>
      <div className="gd-ownership-tree">
        <div className="gd-ownership-root"><b>上海国际集团</b></div>
        <div className="gd-ownership-holding"><b>国资公司</b></div>
        <div className="gd-ownership-institutions">
          <i className="gd-ownership-active-spine" style={{ top: `${Math.min(50, selectedBranch)}%`, height: `${Math.abs(50 - selectedBranch)}%` }} />
          {institutionImpacts.map(item => <button key={item.institutionName} className={selectedName === item.institutionName ? 'active' : ''} aria-pressed={selectedName === item.institutionName} onClick={() => setSelectedName(item.institutionName)}>
            <b>{item.institutionName}</b>
            <span>{item.equityRelation} <em>{item.equityRatio.toFixed(1)}%</em></span>
            <small>{item.institutionType}</small>
          </button>)}
        </div>
      </div>
    </section>
    <section className="gd-institution-impact" aria-label={`机构影响分析：${selectedName}`}>
      <section className="gd-operation-impact" aria-label="经营贡献">
        <h4>经营贡献</h4>
        <div className="gd-operation-cards">{operationCards.map(item => <article key={item.label} title={`${item.label}：${valueText(item.value)}亿元，占集团${item.share.toFixed(1)}%`}>
          <span>{item.label}</span><div><strong>{valueText(item.value)}<em>亿元</em></strong><small>占集团<b>{item.share.toFixed(1)}%</b></small></div>
        </article>)}</div>
      </section>
      <section className="gd-risk-impact" aria-label="风险影响">
        <h4>风险影响</h4>
        <div className="gd-risk-impact-cards">{riskCards.map(item => <article key={item.label} aria-label={item.label} title={`${item.label}：${valueText(item.value)}亿元，占集团${item.share.toFixed(1)}%`}>
          <span>{item.label}</span>
          <strong>{valueText(item.value)}<em>亿元</em></strong>
          <small>占集团 <b>{item.share.toFixed(1)}%</b></small>
        </article>)}</div>
      </section>
    </section>
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

function InvestmentPanel() {
  const [dimension, setDimension] = useState<'project' | 'type' | 'industry' | 'region'>('project');
  const chartRef = useRef<SVGSVGElement>(null);
  const [chartSize, setChartSize] = useState({ width: 500, height: 300 });
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const observer = new ResizeObserver(([entry]) => setChartSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(chart);
    return () => observer.disconnect();
  }, []);
  const items = investmentSummary.dimensions[dimension];
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  let cursor = 0;
  const unrotatedSectors = items.map(item => {
    const start = cursor;
    cursor += item.amount / total * Math.PI * 2;
    return { ...item, start, end: cursor, middle: (start + cursor) / 2 };
  });
  // Rotate the ring just enough to balance the two label columns (e.g. 4 + 4, not 5 + 3).
  const rotation = Array.from({ length: 72 }, (_, index) => index * Math.PI / 36).find(angle => {
    const rightCount = unrotatedSectors.filter(item => Math.sin(item.middle + angle) >= 0).length;
    return Math.abs(rightCount - (items.length - rightCount)) <= 1;
  }) ?? 0;
  const sectors = unrotatedSectors.map(item => ({ ...item, start: item.start + rotation, end: item.end + rotation, middle: item.middle + rotation }));
  // Lay out text in actual screen pixels so shorter windows do not shrink the labels with the ring.
  const labelFont = Math.min(16, Math.max(12, (chartSize.height / Math.ceil(items.length / 2) - 8) / 2.3));
  const labelWidth = Math.ceil(labelFont * 7.3 + 4);
  const centerX = chartSize.width / 2;
  const centerY = chartSize.height / 2;
  const outerRadius = Math.max(36, Math.min((chartSize.width - labelWidth * 2 - 16) / 2, (chartSize.height - 20) / 2));
  const innerRadius = outerRadius * .64;
  const polar = (angle: number, radius: number) => [centerX + Math.sin(angle) * radius, centerY - Math.cos(angle) * radius];
  const labelPositions = new Map<string, { right: boolean; y: number }>();
  [false, true].forEach(right => {
    const side = sectors.filter(item => (Math.sin(item.middle) >= 0) === right).sort((a, b) => polar(a.middle, 1)[1] - polar(b.middle, 1)[1]);
    side.forEach((item, index) => labelPositions.set(item.label, { right, y: side.length === 1 ? centerY : labelFont + 2 + index * (chartSize.height - labelFont * 2 - 7) / (side.length - 1) }));
  });
  return <Panel title="投资穿透监测" className="gd-investment-panel">
    <div className="gd-investment-heading"><div aria-label="投资统计维度"><button aria-pressed={dimension === 'project'} className={dimension === 'project' ? 'active' : ''} onClick={() => setDimension('project')}>按项目</button><button className={dimension === 'type' ? 'active' : ''} onClick={() => setDimension('type')}>按投资类型</button><button className={dimension === 'industry' ? 'active' : ''} onClick={() => setDimension('industry')}>按行业</button><button className={dimension === 'region' ? 'active' : ''} onClick={() => setDimension('region')}>按地区</button></div></div>
    <div className="gd-investment-chart"><svg ref={chartRef} viewBox={`0 0 ${chartSize.width} ${chartSize.height}`} className="gd-investment-donut" role="img" aria-label={dimension === 'project' ? '前十大投资项目的金额及占总规模的比例，包含其他项目' : '投资资产结构，外围标注金额和占比'}>
      <circle cx={centerX} cy={centerY} r={outerRadius + 5} fill="none" stroke="rgba(66,217,255,.17)" strokeDasharray="3 5" />
      {sectors.map(item => {
        const outerStart = polar(item.start, outerRadius), outerEnd = polar(item.end, outerRadius), innerEnd = polar(item.end, innerRadius), innerStart = polar(item.start, innerRadius);
        const large = item.end - item.start > Math.PI ? 1 : 0;
        const position = labelPositions.get(item.label)!;
        const point = polar(item.middle, outerRadius + 4);
        const endX = position.right ? chartSize.width - labelWidth - 3 : labelWidth + 3;
        const elbowX = position.right ? endX - 5 : endX + 5;
        const textX = position.right ? chartSize.width - labelWidth : 2;
        const percentX = position.right ? chartSize.width - 2 : labelWidth;
        const labelColor = item.label === '其他项目' ? '#b1ccdf' : item.color;
        return <g key={item.label}><path d={`M${outerStart} A${outerRadius} ${outerRadius} 0 ${large} 1 ${outerEnd} L${innerEnd} A${innerRadius} ${innerRadius} 0 ${large} 0 ${innerStart} Z`} fill={item.color} stroke="#092746" strokeWidth="1.5"><title>{item.label}：{item.amount.toFixed(1)}亿元，占{(item.amount / total * 100).toFixed(1)}%</title></path><polyline points={`${point} ${elbowX},${position.y + 4} ${endX},${position.y + 4}`} fill="none" stroke={item.color} strokeWidth="1" opacity=".85" /><circle cx={point[0]} cy={point[1]} r="2" fill={item.color} /><text x={textX} y={position.y} className="gd-investment-label" style={{ fontSize: labelFont }}>{item.label}<tspan x={percentX} textAnchor="end" fill={labelColor}>{(item.amount / total * 100).toFixed(1)}%</tspan><tspan x={textX} dy={labelFont + 2} textAnchor="start" className="gd-investment-amount" style={{ fontSize: Math.max(12, labelFont - 1) }}>{item.amount.toFixed(1)} 亿元</tspan></text></g>;
      })}
      <circle cx={centerX} cy={centerY} r={innerRadius - 3} fill="#051b35" stroke="#266187" />
      <text x={centerX} y={centerY - 25} textAnchor="middle" className="gd-donut-caption">总规模</text><text x={centerX} y={centerY + 8} textAnchor="middle" className="gd-donut-value" style={{ fontSize: Math.min(32, innerRadius * .48) }}>{investmentSummary.total}</text><text x={centerX} y={centerY + 32} textAnchor="middle" className="gd-donut-caption">{investmentSummary.unit}</text>
    </svg></div>
  </Panel>;
}

export default function GroupDashboard({ navigate }: { navigate: Navigate }) {
  const pageHint = useMemo(() => 'DEMO 数据仅用于界面展示，不代表真实业务数据', []);
  return <div className="group-dashboard-host"><div className="group-dashboard-screen">
    <DashboardHeader navigate={navigate} />
    <BusinessStrip />
    <main className="gd-main-grid"><ConcentrationPanel /><RiskPanel /><CapitalPanel /><EquityPanel /><EventPanel /><InvestmentPanel /></main>
    <footer className="gd-footer"><span><i />数据链路正常 · 观察期 2026年8月</span><span>{pageHint}</span></footer>
  </div></div>;
}
