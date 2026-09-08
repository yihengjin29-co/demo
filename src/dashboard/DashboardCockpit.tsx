import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { DemoState, Institution, MajorEvent, Role } from '../types';
import { indicatorPeriodService } from '../services/indicatorPeriodService';
import { currentInstitution } from '../services/permissionService';

type Navigate = (path: string) => void;
type Update = (fn: (state: DemoState) => void) => void;
type ViewMode = 'decision' | 'management';
type Tone = 'red' | 'yellow' | 'green' | 'blue' | 'violet' | 'gray';
type InstitutionType = 'bank' | 'securities' | 'amc' | 'insurance';
type DashboardFilters = { period: string; institution: string; indicatorType: string; riskType: string };
type DrawerState =
  | { type: 'indicator'; item: WarningRow }
  | { type: 'capital'; item: CapitalRow }
  | { type: 'news'; item: NewsItem }
  | { type: 'event'; item: MajorEvent }
  | { type: 'risk'; item: string }
  | null;

type WarningRow = {
  id: string;
  institution: string;
  riskType: string;
  name: string;
  value: string;
  status: '红灯' | '黄灯' | '未触发';
  level: string;
  threshold: string;
  yoy: string;
  mom: string;
  trend: number[];
};

type CapitalRow = { name: string; value: string; yoy: string; mom: string; status: '红灯' | '黄灯' | '未触发'; trend: number[] };
type NewsItem = { id: string; institution: string; title: string; time: string; impact: '一般' | '较重' | '严重'; tag: string; exposure: string; ratio: string; rank: string; content: string };

type DashboardCockpitProps = {
  state: DemoState;
  role: Role;
  institutionId?: string;
  navigate: Navigate;
  update: Update;
  toast: (message: string) => void;
};

const riskTypes = ['全部风险', '合规风险', '信用风险', '流动性风险', '集中度风险', '操作风险', '声誉风险', '信息科技风险'];
const periods = ['2024年1月', '2024年2月', '2024年3月', '2024年4月', '2024年5月', '2024年6月'];
const riskRadar = [
  { name: '合规风险', current: 43, previous: 39 },
  { name: '信用风险', current: 76, previous: 68 },
  { name: '流动性风险', current: 61, previous: 64 },
  { name: '集中度风险', current: 72, previous: 65 },
  { name: '操作风险', current: 38, previous: 41 },
  { name: '声誉风险', current: 55, previous: 46 },
  { name: '信息科技风险', current: 48, previous: 51 },
];

const institutionConfig: Record<InstitutionType, { label: string; frequency: string; riskMetrics: string[]; businessMetrics: string[]; peer: string[]; listed: boolean }> = {
  bank: {
    label: '银行', frequency: '季度', listed: true,
    riskMetrics: ['资本充足率', '不良贷款率', '流动性覆盖率', '净稳定资金率', '资产拨备率'],
    businessMetrics: ['营业收入', '净利润', '净利润增速', '净资产收益率（ROE）', '资产利润率（ROA）', '风险加权平均资产回报率（ROWA）'],
    peer: ['资本充足率', '不良贷款率', '净资产收益率（ROE）', '资产利润率（ROA）'],
  },
  securities: {
    label: '证券', frequency: '月度', listed: true,
    riskMetrics: ['净稳定资金率', '流动性覆盖率', '资本杠杆率', '风险覆盖率', '自营非权益类证券及其衍生品占净资本比例', '自营权益类证券及证券衍生品占净资本比例'],
    businessMetrics: ['营业收入', '净利润', '净利润增速', '净资产收益率（ROE）', '资产利润率（ROA）'],
    peer: ['风险覆盖率', '资本杠杆率', '流动性覆盖率', '净稳定资金率'],
  },
  amc: {
    label: 'AMC', frequency: '月度', listed: false,
    riskMetrics: ['单一客户投融资集中度', '单一集团客户投融资集中度', '金融不良资产投资占比', '30日流动性备付余量', '融入资金余额比例'],
    businessMetrics: ['营业收入', '净利润', '净利润增速', '净资产收益率（ROE）', '资产利润率（ROA）'],
    peer: ['单一客户投融资集中度', '金融不良资产投资占比', '30日流动性备付余量', '资产利润率（ROA）'],
  },
  insurance: {
    label: '保险', frequency: '季度', listed: true,
    riskMetrics: ['资产拨备率', '流动性比例', '财务杠杆率', '合格资本覆盖率', '资产负债率'],
    businessMetrics: ['营业收入', '净利润', '净利润增速', '净资产收益率（ROE）', '资产利润率（ROA）'],
    peer: ['资产负债率', '净资产收益率（ROE）', '资产利润率（ROA）', '成本收入比'],
  },
};

const demoWarnings: WarningRow[] = [
  { id: 'warn-1', institution: '国际AMC', riskType: '集中度风险', name: '单一集团客户投融资集中度', value: '18.70%', status: '红灯', level: '一级预警', threshold: '≥ 18.00%', yoy: '↑ 2.4%', mom: '↑ 0.8%', trend: [12.2, 13.4, 14.1, 15.8, 17.2, 18.7] },
  { id: 'warn-2', institution: '国泰海通', riskType: '流动性风险', name: '流动性覆盖率', value: '112.40%', status: '红灯', level: '一级预警', threshold: '< 120.00%', yoy: '↓ 9.6%', mom: '↓ 3.1%', trend: [135, 131, 129, 124, 118, 112] },
  { id: 'warn-3', institution: '浦发银行', riskType: '信用风险', name: '资产拨备率', value: '2.31%', status: '黄灯', level: '二级预警', threshold: '< 2.40%', yoy: '↓ 0.2%', mom: '↓ 0.1%', trend: [2.62, 2.55, 2.49, 2.43, 2.37, 2.31] },
  { id: 'warn-4', institution: '上农商', riskType: '流动性风险', name: '流动性比例', value: '28.60%', status: '黄灯', level: '二级预警', threshold: '< 30.00%', yoy: '↓ 1.4%', mom: '↓ 0.5%', trend: [33, 32, 31.8, 30.4, 29.6, 28.6] },
  { id: 'warn-5', institution: '太保', riskType: '资本充足', name: '资产负债率', value: '86.10%', status: '未触发', level: '—', threshold: '≤ 90.00%', yoy: '↑ 0.3%', mom: '↓ 0.2%', trend: [85.1, 85.6, 85.8, 86.4, 86.3, 86.1] },
  { id: 'warn-6', institution: '国际AMC', riskType: '流动性风险', name: '30日流动性备付余量', value: '12.80亿元', status: '黄灯', level: '二级预警', threshold: '< 15.00亿元', yoy: '↓ 8.1%', mom: '↓ 2.7%', trend: [20.1, 19.2, 17.8, 16.4, 14.7, 12.8] },
  { id: 'warn-7', institution: '国泰海通', riskType: '资本充足', name: '风险覆盖率', value: '238.60%', status: '未触发', level: '—', threshold: '≥ 200.00%', yoy: '↑ 5.4%', mom: '↑ 1.1%', trend: [218, 221, 224, 229, 236, 239] },
  { id: 'warn-8', institution: '浦发银行', riskType: '经营效率', name: '净资产收益率（ROE）', value: '9.42%', status: '未触发', level: '—', threshold: '≥ 8.00%', yoy: '↑ 0.6%', mom: '↑ 0.2%', trend: [8.4, 8.6, 8.8, 9.1, 9.2, 9.42] },
];

const demoNews: NewsItem[] = [
  { id: 'news-1', institution: '国际AMC', title: '重点项目债务重组进展受到市场关注', time: '06-30 12:48', impact: '严重', tag: '信用风险', exposure: '2.30亿元', ratio: '1.82%', rank: '集团内第2', content: '外部媒体持续关注重点项目债务重组安排。当前内部敞口已纳入专项监测，未发现风险进一步扩散。' },
  { id: 'news-2', institution: '国泰海通', title: '证券行业短期流动性指标波动', time: '06-30 11:35', impact: '较重', tag: '流动性风险', exposure: '1.26亿元', ratio: '0.74%', rank: '集团内第4', content: '市场资金面阶段性波动，相关机构已提高高流动性资产储备并加强日间监测。' },
  { id: 'news-3', institution: '浦发银行', title: '区域重点行业资产质量变化引发关注', time: '06-30 10:20', impact: '较重', tag: '信用风险', exposure: '3.85亿元', ratio: '0.63%', rank: '集团内第1', content: '区域重点行业资产质量出现分化，机构已完成客户分层排查并上调重点名单监测频率。' },
  { id: 'news-4', institution: '上农商', title: '普惠业务资产质量保持总体稳定', time: '06-30 09:05', impact: '一般', tag: '经营动态', exposure: '0.42亿元', ratio: '0.18%', rank: '集团内第8', content: '监测期内普惠业务风险指标保持稳定，相关舆情未对机构经营形成重大影响。' },
];

const capitalRows: CapitalRow[] = [
  { name: '财务杠杆率', value: '11.84%', yoy: '↑ 0.42%', mom: '↑ 0.12%', status: '未触发', trend: [10.7, 10.9, 11.1, 11.3, 11.6, 11.84] },
  { name: '超额资本', value: '286.4亿元', yoy: '↑ 6.80%', mom: '↑ 1.70%', status: '未触发', trend: [246, 251, 263, 271, 279, 286] },
  { name: '合格资本覆盖率', value: '126.80%', yoy: '↓ 2.10%', mom: '↓ 0.60%', status: '黄灯', trend: [132, 131, 130, 129, 128, 126.8] },
  { name: '资产负债率', value: '87.42%', yoy: '↑ 0.31%', mom: '↓ 0.08%', status: '未触发', trend: [86.4, 86.9, 87.1, 87.5, 87.5, 87.42] },
];

const businessMetrics = [
  { label: '营业收入', value: '326.8', unit: '亿元', change: '同比 ↑ 6.2%' },
  { label: '净利润', value: '78.4', unit: '亿元', change: '同比 ↑ 4.8%' },
  { label: '净利润增速', value: '4.8', unit: '%', change: '较上期 ↑ 0.6pct' },
  { label: '净资产收益率（ROE）', value: '9.42', unit: '%', change: '同比 ↑ 0.4pct' },
  { label: '资产利润率（ROA）', value: '1.16', unit: '%', change: '同比 ↑ 0.1pct' },
  { label: '风险加权平均资产回报率（ROWA）', value: '1.42', unit: '%', change: '同比 ↑ 0.1pct' },
];

const typeOfInstitution = (institution?: Institution): InstitutionType => {
  if (!institution) return 'bank';
  if (institution.type.includes('资产')) return 'amc';
  if (institution.type.includes('证券')) return 'securities';
  if (institution.type.includes('保险')) return 'insurance';
  return 'bank';
};

const toneOf = (status: string): Tone => status.includes('红') || status === '严重' ? 'red' : status.includes('黄') || status === '较重' ? 'yellow' : status.includes('未触发') || status.includes('正常') || status === '一般' ? 'green' : 'blue';
const isClosed = (status: string) => /已解除|已关闭|已办结|已归档/.test(status);

function Glyph({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'institution') return <svg viewBox="0 0 24 24" {...common}><path d="M4 21V7l8-4 8 4v14M8 9h2m4 0h2M8 13h2m4 0h2M9 21v-4h6v4" /></svg>;
  if (name === 'warning') return <svg viewBox="0 0 24 24" {...common}><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5m0 3h.01" /></svg>;
  if (name === 'event') return <svg viewBox="0 0 24 24" {...common}><path d="M6 3h12v18H6zM9 8h6m-6 4h6m-6 4h4" /></svg>;
  if (name === 'capital') return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9" /><path d="M8 9h8M8 13h8m-5-7v12m2-12v12" /></svg>;
  return <svg viewBox="0 0 24 24" {...common}><path d="M4 19V5m0 14h16M7 15l4-5 3 2 5-7" /></svg>;
}

function MiniTrend({ values, tone = 'blue' }: { values: number[]; tone?: Tone }) {
  const min = Math.min(...values); const max = Math.max(...values); const range = Math.max(1, max - min);
  const points = values.map((value, index) => `${index * (100 / (values.length - 1))},${30 - ((value - min) / range) * 24}`).join(' ');
  return <svg className={`v14-spark tone-${tone}`} viewBox="0 0 100 34" preserveAspectRatio="none" aria-label="近6期趋势"><polyline points={points} /></svg>;
}

function StatusTag({ value }: { value: string }) {
  return <span className={`v14-status tone-${toneOf(value)}`}><i />{value}</span>;
}

export function SectionPanel({ title, code, description, action, className = '', children }: { title: string; code?: string; description?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return <section className={`v14-panel ${className}`}><header><div><span>{code || 'REAL-TIME MONITOR'}</span><h3>{title}</h3>{description && <small>{description}</small>}</div>{action}</header><div className="v14-panel-body">{children}</div></section>;
}

export function MetricCard({ label, value, unit, change, tone, icon, onClick }: { label: string; value: string | number; unit: string; change: string; tone: Tone; icon: string; onClick: () => void }) {
  return <button className={`v14-metric tone-${tone}`} onClick={onClick}><span className="v14-metric-icon"><Glyph name={icon} /></span><span className="v14-metric-copy"><small>{label}</small><strong>{value}<em>{unit}</em></strong><span>{change}</span></span><MiniTrend values={tone === 'red' ? [3, 4, 4, 5, 6, 8] : tone === 'yellow' ? [9, 8, 10, 9, 11, 12] : [31, 33, 32, 35, 36, 38]} tone={tone} /></button>;
}

export function ViewSwitcher({ value, onChange }: { value: ViewMode; onChange: (value: ViewMode) => void }) {
  return <div className="v14-view-switch" aria-label="驾驶舱视图"><button className={value === 'decision' ? 'active' : ''} onClick={() => onChange('decision')}><b>决策视图</b><small>汇总研判</small></button><button className={value === 'management' ? 'active' : ''} onClick={() => onChange('management')}><b>管理视图</b><small>监测处置</small></button></div>;
}

export function TopFilterBar({ value, institutions, locked, onChange, onReset }: { value: DashboardFilters; institutions: string[]; locked: boolean; onChange: (value: DashboardFilters) => void; onReset: () => void }) {
  return <section className="v14-filterbar"><div className="v14-filter-grid">
    <label><span>统计期</span><select value={value.period} onChange={event => onChange({ ...value, period: event.target.value })}>{periods.map(item => <option key={item}>{item}</option>)}</select></label>
    <label><span>机构</span><select value={value.institution} disabled={locked} onChange={event => onChange({ ...value, institution: event.target.value })}>{!locked && <option>全部机构</option>}{institutions.map(item => <option key={item}>{item}</option>)}</select></label>
    <label><span>指标类型</span><select value={value.indicatorType} onChange={event => onChange({ ...value, indicatorType: event.target.value })}>{['全部指标', '风险指标', '资本指标', '经营指标'].map(item => <option key={item}>{item}</option>)}</select></label>
    <label><span>风险类型</span><select value={value.riskType} onChange={event => onChange({ ...value, riskType: event.target.value })}>{riskTypes.map(item => <option key={item}>{item}</option>)}</select></label>
  </div><button className="v14-reset" onClick={onReset}>重置筛选</button></section>;
}

function RadarChart({ onSelect }: { onSelect: (name: string) => void }) {
  const center = 150; const radius = 105; const count = riskRadar.length;
  const point = (value: number, index: number) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / count; return `${center + Math.cos(angle) * radius * value / 100},${center + Math.sin(angle) * radius * value / 100}`; };
  const current = riskRadar.map((item, index) => point(item.current, index)).join(' ');
  const previous = riskRadar.map((item, index) => point(item.previous, index)).join(' ');
  return <div className="v14-radar"><svg viewBox="0 0 300 300" aria-label="风险类别标准化示例值雷达图">
    {[20, 40, 60, 80, 100].map(level => <polygon key={level} className="radar-grid" points={riskRadar.map((_, index) => point(level, index)).join(' ')} />)}
    {riskRadar.map((_, index) => <line key={index} className="radar-axis" x1={center} y1={center} x2={point(100, index).split(',')[0]} y2={point(100, index).split(',')[1]} />)}
    <polygon className="radar-previous" points={previous} /><polygon className="radar-current" points={current} />
    {riskRadar.map((item, index) => { const [x, y] = point(item.current, index).split(','); return <circle key={item.name} cx={x} cy={y} r="4" className="radar-point"><title>{item.name}：本期 {item.current}，上期 {item.previous}</title></circle>; })}
  </svg><div className="v14-radar-labels">{riskRadar.map(item => <button key={item.name} onClick={() => onSelect(item.name)}>{item.name}<b>{item.current}</b></button>)}</div><div className="v14-radar-legend"><span><i className="current" />本期</span><span><i />上期</span><em>标准化示例值，仅用于DEMO展示</em></div></div>;
}

function CapitalTable({ rows, management, onOpen, onAdd }: { rows: CapitalRow[]; management: boolean; onOpen: (item: CapitalRow) => void; onAdd: () => void }) {
  return <div className="v14-table-wrap"><div className="v14-table-toolbar"><span>共 {rows.length} 项资本指标</span><button onClick={onAdd}>＋ 添加指标</button></div><table className="v14-table v14-capital-table"><thead><tr><th>指标名称</th><th>当前值</th><th>同比</th><th>环比</th><th>近6期趋势</th><th>状态</th>{management && <th>操作</th>}</tr></thead><tbody>{rows.map(item => <tr key={item.name} onClick={() => onOpen(item)}><td>{item.name}</td><td className="number">{item.value}</td><td>{item.yoy}</td><td>{item.mom}</td><td><MiniTrend values={item.trend} tone={toneOf(item.status)} /></td><td><StatusTag value={item.status} /></td>{management && <td><button>查看</button></td>}</tr>)}</tbody></table></div>;
}

function InstitutionNode({ item, index, warnings, events, onClick }: { item: Institution; index: number; warnings: WarningRow[]; events: MajorEvent[]; onClick: () => void }) {
  const institutionWarnings = warnings.filter(row => row.institution.includes(item.shortName) || item.name.includes(row.institution));
  const red = institutionWarnings.filter(row => row.status === '红灯').length; const yellow = institutionWarnings.filter(row => row.status === '黄灯').length;
  const tone = red ? 'red' : yellow ? 'yellow' : 'green';
  const keyMetric = typeOfInstitution(item) === 'amc' ? '单一客户集中度 16.2%' : typeOfInstitution(item) === 'securities' ? '流动性覆盖率 112.4%' : '资产拨备率 2.31%';
  return <button className={`v14-map-node node-${index + 1} tone-${tone}`} onClick={onClick}><i className="node-pulse" /><b>{item.shortName}</b><small>{red ? '存在重点红灯预警' : yellow ? '存在重点黄灯预警' : '当前无重点预警'}</small><span className="v14-node-card"><strong>{item.name}</strong><em><i className="red" />红灯 {red}</em><em><i className="yellow" />黄灯 {yellow}</em><em>{keyMetric}</em><em>重大风险事件 {events.filter(event => event.institution.includes(item.shortName) && !isClosed(event.status)).length}</em><u>进入机构驾驶舱 ›</u></span></button>;
}

export function RiskMap({ institutions, warnings, events, navigate }: { institutions: Institution[]; warnings: WarningRow[]; events: MajorEvent[]; navigate: Navigate }) {
  return <div className="v14-risk-map"><div className="map-grid" /><svg className="map-links" viewBox="0 0 800 360" preserveAspectRatio="none"><path d="M402 176 155 83M402 176 641 72M402 176 192 278M402 176 565 288M402 176 705 235M155 83 641 72M192 278 565 288" /></svg><div className="map-center"><span>集团金融版图</span><b>{institutions.length}</b><small>家并表金融机构</small></div>{institutions.slice(0, 5).map((item, index) => <InstitutionNode key={item.id} item={item} index={index} warnings={warnings} events={events} onClick={() => navigate(`/dashboard/institution/${item.id}`)} />)}<div className="map-legend"><span><i className="red" />重点红灯</span><span><i className="yellow" />重点黄灯</span><span><i className="green" />无重点预警</span></div></div>;
}

function NewsTicker({ items, onOpen }: { items: NewsItem[]; onOpen: (item: NewsItem) => void }) {
  const [index, setIndex] = useState(0); const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused || items.length < 2) return; const timer = window.setInterval(() => setIndex(value => (value + 1) % items.length), 3000); return () => window.clearInterval(timer); }, [items.length, paused]);
  const ordered = items.length ? [...items.slice(index), ...items.slice(0, index)] : [];
  return <div className="v14-news" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>{ordered.slice(0, 4).map((item, itemIndex) => <button key={item.id} className={itemIndex === 0 ? 'active' : ''} onClick={() => onOpen(item)}><span><StatusTag value={item.impact} /><time>{item.time}</time></span><b>{item.title}</b><small>{item.institution} · {item.tag}</small></button>)}{!items.length && <EmptyState />}</div>;
}

function WarningTable({ rows, mode, onOpen, onAdd }: { rows: WarningRow[]; mode: ViewMode; onOpen: (item: WarningRow) => void; onAdd: () => void }) {
  const [tab, setTab] = useState('全部');
  const filtered = rows.filter(item => tab === '全部' || item.status.includes(tab)); const shown = filtered.slice(0, mode === 'management' ? 8 : 5);
  return <div className="v14-warning-area"><div className="v14-warning-tabs">{['全部', '红灯', '黄灯', '未触发'].map(item => <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}<b>{rows.filter(row => item === '全部' || row.status.includes(item)).length}</b></button>)}<button className="add" onClick={onAdd}>＋ 自定义指标</button></div><div className="v14-table-wrap"><table className="v14-table v14-warning-table"><thead><tr><th>机构</th><th>风险类型</th><th>指标名称</th><th>当前值</th><th>预警状态</th><th>预警等级</th><th>触发阈值</th><th>同比</th><th>环比</th><th>近6期趋势</th><th>操作</th></tr></thead><tbody>{shown.map(item => <tr key={item.id}><td>{item.institution}</td><td>{item.riskType}</td><td>{item.name}</td><td className="number">{item.value}</td><td><StatusTag value={item.status} /></td><td>{item.level}</td><td>{item.threshold}</td><td>{item.yoy}</td><td>{item.mom}</td><td><MiniTrend values={item.trend} tone={toneOf(item.status)} /></td><td><button onClick={() => onOpen(item)}>查看</button></td></tr>)}</tbody></table>{!shown.length && <EmptyState />}</div></div>;
}

function EventPanel({ events, mode, onOpen }: { events: MajorEvent[]; mode: ViewMode; onOpen: (item: MajorEvent) => void }) {
  const open = events.filter(item => !isClosed(item.status)); const closed = events.filter(item => isClosed(item.status));
  return <div className="v14-events"><div className="v14-event-summary">{[['事件总数', events.length], ['本月新增', events.filter(item => item.occurredAt.startsWith('2024-06')).length], ['处置中', open.length], ['已办结', closed.length]].map(([label, value]) => <span key={String(label)}><small>{label}</small><b>{value}</b></span>)}</div><div className="v14-event-list">{events.slice(0, mode === 'management' ? 5 : 3).map(item => <button key={item.id} onClick={() => onOpen(item)}><span><b>{item.name}</b><small>{item.type} · {item.institution}</small></span><time>{item.occurredAt}</time><StatusTag value={item.status} /><em>查看明细 ›</em></button>)}</div>{!events.length && <EmptyState />}</div>;
}

function Operations({ institution, type }: { institution?: Institution; type: InstitutionType }) {
  const config = institutionConfig[type]; const trendA = [4.1, 4.4, 4.2, 4.7, 4.5, 4.8]; const trendB = [8.7, 8.9, 9.1, 9.0, 9.2, 9.42];
  const displayedMetrics = institution ? businessMetrics.filter(item => config.businessMetrics.includes(item.label)).slice(0, 5) : businessMetrics;
  return <section id="operations" className="v14-section"><div className="v14-section-title"><span>03</span><div><h2>经营情况</h2><p>{institution ? `${institution.shortName}经营质效、战略目标与同业表现` : '集团并表盈利能力与经营效率变化'}</p></div><em>{institution ? `${config.frequency}口径` : '并表口径'}</em></div><div className="v14-business-metrics">{displayedMetrics.map(item => <button key={item.label}><small>{item.label}</small><b>{item.value}<em>{item.unit}</em></b><span>{item.change}</span></button>)}</div><div className={`v14-business-grid ${institution ? 'institution' : ''}`}>
    <SectionPanel title="经营效率趋势" code="OPERATING TREND" description="支持指标切换、机构对比与下钻"><div className="v14-line-chart"><div className="chart-grid" /><svg viewBox="0 0 600 190" preserveAspectRatio="none"><polyline className="series-a" points={trendA.map((v, i) => `${i * 116 + 10},${170 - v * 24}`).join(' ')} /><polyline className="series-b" points={trendB.map((v, i) => `${i * 116 + 10},${170 - v * 12}`).join(' ')} /></svg><div className="chart-labels">{['1月', '2月', '3月', '4月', '5月', '6月'].map(item => <span key={item}>{item}</span>)}</div><div className="chart-legend"><span><i />净利润增速</span><span><i />净资产收益率（ROE）</span></div></div></SectionPanel>
    {institution && <SectionPanel title="战略目标达成" code="ACTUAL VS TARGET"><div className="v14-targets">{[['营业收入', 86], ['净利润', 79], ['ROE', 92]].map(([label, value]) => <div key={String(label)}><span><b>{label}</b><small>实际 / 目标</small></span><div><i style={{ width: `${value}%` }} /><em style={{ left: '90%' }} /></div><strong>{value}%</strong></div>)}</div></SectionPanel>}
    {institution && <SectionPanel title="可比同业对比" code="QUARTERLY PEER BENCHMARK"><div className="v14-peer">{config.peer.map((item, index) => <div key={item}><span>{item}</span><div><i style={{ width: `${62 + index * 7}%` }} /></div><b>{index % 2 ? '同业中位' : '优于中位'}</b></div>)}</div></SectionPanel>}
    {institution && config.listed && <SectionPanel title="资本市场表现" code="MARKET PERFORMANCE"><div className="v14-stock"><header><b>+4.26%</b><span>本机构</span><b className="index">+2.18%</b><span>相关市场指数</span></header><MiniTrend values={[32, 34, 33, 37, 36, 41, 40, 44]} tone="blue" /><MiniTrend values={[31, 31.8, 32.2, 33, 33.5, 34.2, 35, 35.6]} tone="violet" /></div></SectionPanel>}
  </div></section>;
}

function EmptyState() { return <div className="v14-empty"><i>◇</i><span>当前筛选范围内暂无数据</span></div>; }
function LoadingLayer() { return <div className="v14-loading" aria-label="数据加载中"><span /><span /><span /><span /><span /></div>; }

function DetailDrawer({ drawer, onClose, navigate }: { drawer: DrawerState; onClose: () => void; navigate: Navigate }) {
  if (!drawer) return null;
  const title = drawer.type === 'indicator' ? drawer.item.name : drawer.type === 'capital' ? drawer.item.name : drawer.type === 'news' ? drawer.item.title : drawer.type === 'event' ? drawer.item.name : drawer.item;
  const event = drawer.type === 'event' ? drawer.item : null;
  const steps = ['上报', '核实', '研判', '方案', '执行', '续报', '终报'];
  return <div className="v14-drawer-mask" onMouseDown={eventObject => eventObject.target === eventObject.currentTarget && onClose()}><aside className="v14-drawer" role="dialog" aria-modal="true" aria-label={`${title}详情`}><header><div><span>DETAIL INSIGHT</span><h2>{title}</h2></div><button onClick={onClose}>×</button></header><div className="v14-drawer-body">
    {drawer.type === 'indicator' && <><div className="v14-detail-hero"><span>当前值<b>{drawer.item.value}</b></span><span>触发阈值<b>{drawer.item.threshold}</b></span><StatusTag value={drawer.item.status} /></div><SectionPanel title="近6期历史趋势"><div className="v14-drawer-trend"><MiniTrend values={drawer.item.trend} tone={toneOf(drawer.item.status)} /></div></SectionPanel><div className="v14-detail-grid"><b>所属机构<span>{drawer.item.institution}</span></b><b>风险类型<span>{drawer.item.riskType}</span></b><b>同比<span>{drawer.item.yoy}</span></b><b>环比<span>{drawer.item.mom}</span></b><b>最近预警记录<span>2024-06-25 09:30</span></b><b>数据更新时间<span>2024-06-30 13:22</span></b></div></>}
    {drawer.type === 'capital' && <><div className="v14-detail-hero"><span>当前值<b>{drawer.item.value}</b></span><span>同比<b>{drawer.item.yoy}</b></span><StatusTag value={drawer.item.status} /></div><SectionPanel title="近6期趋势"><div className="v14-drawer-trend"><MiniTrend values={drawer.item.trend} tone={toneOf(drawer.item.status)} /></div></SectionPanel><p className="v14-detail-note">该指标按并表主题数据集市口径展示，点击业务入口可查看对应机构拆分与明细数据。</p></>}
    {drawer.type === 'news' && <><div className="v14-detail-hero"><span>发布时间<b>{drawer.item.time}</b></span><span>影响等级<b>{drawer.item.impact}</b></span><StatusTag value={drawer.item.tag} /></div><p className="v14-detail-note">{drawer.item.content}</p><div className="v14-detail-grid"><b>涉及主体<span>{drawer.item.institution}</span></b><b>敞口金额<span>{drawer.item.exposure}</span></b><b>敞口占比<span>{drawer.item.ratio}</span></b><b>集中度排名<span>{drawer.item.rank}</span></b><b>AI识别标签<span>{drawer.item.tag}</span></b><b>数据来源<span>外部数据融合平台</span></b></div></>}
    {drawer.type === 'risk' && <><div className="v14-detail-hero"><span>本期标准化示例值<b>{riskRadar.find(item => item.name === drawer.item)?.current}</b></span><span>上期标准化示例值<b>{riskRadar.find(item => item.name === drawer.item)?.previous}</b></span></div><p className="v14-detail-note">此处数值仅用于DEMO视觉演示，不代表正式业务评分。正式环境通过指标配置接口映射该风险类别下的监测指标。</p><button className="v14-primary-action" onClick={() => { onClose(); navigate('/indicators/query'); }}>查看相关指标明细</button></>}
    {event && <><div className="v14-detail-hero"><span>上报机构<b>{event.institution}</b></span><span>当前状态<b>{event.status}</b></span><StatusTag value={event.status} /></div><div className="v14-detail-grid"><b>事件类型<span>{event.type}</span></b><b>上报时间<span>{event.occurredAt}</span></b><b>风险等级<span>{event.status === '处理中' ? '重大' : '已解除'}</span></b><b>责任部门<span>{event.responsibleDept}</span></b></div><SectionPanel title="处置流程时间线" code="7-STAGE PROCESS"><div className="v14-timeline">{steps.map((step, index) => <div className={index < 5 || isClosed(event.status) ? 'done' : index === 5 ? 'current' : ''} key={step}><i>{index < 5 || isClosed(event.status) ? '✓' : index + 1}</i><span><b>{step}</b><small>办理人：{index < 2 ? event.contact : index < 5 ? event.responsible : '待分配'}</small><small>办理时间：{index < 5 ? `2024-06-${18 + index * 2}` : '—'}</small><p>{index < 5 ? ['完成事件上报并提交基础材料。', '已完成事实核查与敞口确认。', '形成风险影响初步判断。', '处置方案已通过内部审议。', '按计划推进处置并持续监测。'][index] : '等待进入本阶段。'}</p></span></div>)}</div></SectionPanel><button className="v14-primary-action" onClick={() => { onClose(); navigate(`/major-events/${event.id}/overview`); }}>进入业务处置台账</button></>}
  </div></aside></div>;
}

export default function DashboardCockpit({ state, role, institutionId, navigate, update: _update, toast }: DashboardCockpitProps) {
  const institution = state.institutions.find(item => item.id === institutionId) || (role === '各金融机构' ? state.institutions.find(item => item.name === currentInstitution || item.shortName === currentInstitution) || state.institutions[0] : undefined);
  const institutionType = typeOfInstitution(institution); const config = institutionConfig[institutionType];
  const scopeKey = institution ? `institution-${institution.id}` : 'group';
  const storageKey = `dashboard-v14-filters-${scopeKey}`;
  const defaultFilters = (): DashboardFilters => ({ period: '2024年6月', institution: institution?.name || '全部机构', indicatorType: '全部指标', riskType: '全部风险' });
  const [viewMode, setViewMode] = useState<ViewMode>('decision');
  const [filters, setFilters] = useState<DashboardFilters>(() => { try { return { ...defaultFilters(), ...JSON.parse(sessionStorage.getItem(storageKey) || '{}') }; } catch { return defaultFilters(); } });
  const [drawer, setDrawer] = useState<DrawerState>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { const next = (() => { try { return { ...defaultFilters(), ...JSON.parse(sessionStorage.getItem(storageKey) || '{}') }; } catch { return defaultFilters(); } })(); if (institution) next.institution = institution.name; setFilters(next); }, [scopeKey]);
  useEffect(() => { sessionStorage.setItem(storageKey, JSON.stringify(filters)); sessionStorage.setItem('dashboard-v14-active-context', JSON.stringify({ institution: institution?.shortName || filters.institution, filters })); const timer = window.setTimeout(() => setLoading(false), 360); setLoading(true); return () => window.clearTimeout(timer); }, [filters, viewMode, storageKey, institution]);
  const visibleInstitutions = institution ? [institution] : state.institutions.filter(item => filters.institution === '全部机构' || item.name === filters.institution || item.shortName === filters.institution);
  const warnings = demoWarnings.filter(item => {
    const matchesIndicatorType = filters.indicatorType === '全部指标' || (filters.indicatorType === '资本指标' ? /资本|杠杆|资产负债/.test(`${item.riskType}${item.name}`) : filters.indicatorType === '经营指标' ? /经营效率|ROE|ROA|净利润|营业收入/.test(`${item.riskType}${item.name}`) : !/资本充足|经营效率/.test(item.riskType));
    return (!institution || item.institution.includes(institution.shortName) || institution.name.includes(item.institution)) && (filters.institution === '全部机构' || item.institution.includes(filters.institution) || filters.institution.includes(item.institution)) && (filters.riskType === '全部风险' || item.riskType === filters.riskType) && matchesIndicatorType;
  });
  const news = demoNews.filter(item => (!institution || item.institution.includes(institution.shortName) || institution.name.includes(item.institution)) && (filters.institution === '全部机构' || item.institution.includes(filters.institution) || filters.institution.includes(item.institution)) && (filters.riskType === '全部风险' || item.tag === filters.riskType));
  const events = state.majorEvents.filter(item => (!institution || item.institution.includes(institution.shortName) || institution.name.includes(item.institution)) && (filters.institution === '全部机构' || item.institution.includes(filters.institution) || filters.institution.includes(item.institution)));
  const allLatest = useMemo(() => indicatorPeriodService.latest(state.indicatorPeriodRecords), [state.indicatorPeriodRecords]);
  const monitoredCount = institution ? institution.activeIndicatorCount : Math.max(allLatest.length, state.institutions.reduce((sum, item) => sum + item.activeIndicatorCount, 0));
  const redCount = warnings.filter(item => item.status === '红灯').length; const yellowCount = warnings.filter(item => item.status === '黄灯').length;
  const untriggeredCount = Math.max(institution ? 24 : 126, monitoredCount - redCount - yellowCount);
  const metricItems = institution ? [
    ['监测指标数量', monitoredCount, '项', '较上期新增 2 项', 'blue', 'trend', 'risk-view'],
    ['当月黄灯预警数量', yellowCount, '项', `较上期 ${yellowCount ? '↑ 1' : '持平'}`, 'yellow', 'warning', 'risk-view'],
    ['当月红灯预警数量', redCount, '项', `较上期 ${redCount ? '↑ 1' : '持平'}`, 'red', 'warning', 'risk-view'],
    ['当月未触发预警数量', untriggeredCount, '项', '运行总体稳定', 'green', 'trend', 'risk-view'],
    ['本月新增重大风险事件数量', events.filter(item => item.occurredAt.startsWith('2024-06')).length, '起', '处置流程持续跟踪', 'red', 'event', 'risk-view'],
  ] : [
    ['并表金融机构数量', visibleInstitutions.length, '家', '当前授权范围', 'blue', 'institution', 'risk-view'],
    ['监测指标数量', monitoredCount, '项', '覆盖风险、资本与经营', 'blue', 'trend', 'risk-view'],
    ['当月黄灯预警数量', yellowCount, '项', '较上期 ↑ 1', 'yellow', 'warning', 'risk-view'],
    ['当月红灯预警数量', redCount, '项', '较上期 ↑ 2', 'red', 'warning', 'risk-view'],
    ['当月未触发预警数量', untriggeredCount, '项', '未触发阈值预警', 'green', 'trend', 'risk-view'],
    ['本月新增重大风险事件数量', events.filter(item => item.occurredAt.startsWith('2024-06')).length, '起', '其中处置中 1 起', 'red', 'event', 'risk-view'],
  ];
  const selectedCapitalRows = institution ? capitalRows.map((item, index) => ({ ...item, name: config.riskMetrics[index] || item.name })).slice(0, 4) : capitalRows;
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const modeLabel = viewMode === 'decision' ? '决策视图' : '管理视图';
  if (!institution) {
    return <div className="reference-cockpit-host">
      <iframe
        className="reference-cockpit-frame"
        src="/group-cockpit/index.html"
        title="集团及国资公司并表风险驾驶舱"
        loading="eager"
        allowFullScreen
      />
    </div>;
  }
  const useStandaloneInstitutionCockpit = role === '各金融机构' || Boolean(institutionId);
  if (useStandaloneInstitutionCockpit) {
    return <div className="reference-cockpit-host institution-cockpit-host">
      <iframe
        className="reference-cockpit-frame"
        src={`/institution-cockpit/index.html?name=${encodeURIComponent(institution.shortName)}`}
        title={`${institution.shortName}金融机构风险驾驶舱`}
        loading="eager"
        allowFullScreen
      />
    </div>;
  }
  return <div className={`dashboard-cockpit v14-cockpit ${viewMode === 'management' ? 'is-management' : ''} ${institution ? 'is-institution' : 'is-group'}`}>
    <div className="v14-grid-bg" /><div className="v14-scanline" />
    <header className="v14-topbar"><div className="v14-title-lockup">{institution && <button className="v14-back" onClick={() => navigate('/dashboard')}>‹ 返回集团驾驶舱</button>}<span>{institution ? `${config.label.toUpperCase()} INSTITUTION COCKPIT` : role === '集团' ? 'GROUP CONSOLIDATED RISK CENTER' : 'FINANCIAL HOLDING CONTROL CENTER'}</span><h1>{institution ? `${institution.shortName}驾驶舱` : '金控并表管理驾驶舱'}</h1><small>{institution ? `${config.label}业态 · ${config.frequency}监测口径 · 当前机构数据权限` : '集团金融风险全景监测与穿透管理'}</small></div><div className="v14-top-actions"><ViewSwitcher value={viewMode} onChange={setViewMode} /><div className="v14-update"><small>最近数据更新时间</small><b>2024-06-30 13:22:45</b></div><button className="v14-ai-shortcut" onClick={() => document.querySelector<HTMLButtonElement>('.smart-assistant-launcher')?.click()}><i>AI</i><span>问数</span></button></div></header>
    <TopFilterBar value={filters} institutions={state.institutions.map(item => item.name)} locked={!!institution} onChange={setFilters} onReset={() => setFilters(defaultFilters())} />
    <nav className="v14-section-nav"><span>当前口径：{filters.period} · {filters.institution} · {filters.indicatorType} · {filters.riskType}</span><div><button onClick={() => scrollTo('overview')}>01 总体概览</button><button onClick={() => scrollTo('risk-view')}>02 风险全景视图</button><button onClick={() => scrollTo('operations')}>03 经营情况</button></div><em><i />{modeLabel} · 数据链路正常</em></nav>
    <main className="v14-main">
      {loading && <LoadingLayer />}
      <section id="overview" className="v14-section"><div className="v14-section-title"><span>01</span><div><h2>总体概览</h2><p>{institution ? `${institution.shortName}核心监测状态` : '并表范围核心管控指标'}</p></div><em>点击指标卡可下钻</em></div><div className={`v14-metrics ${institution ? 'five' : ''}`}>{metricItems.map(([label, value, unit, change, tone, icon, target]) => <MetricCard key={String(label)} label={String(label)} value={value as number} unit={String(unit)} change={String(change)} tone={tone as Tone} icon={String(icon)} onClick={() => scrollTo(String(target))} />)}</div></section>
      <section id="risk-view" className="v14-section"><div className="v14-section-title"><span>02</span><div><h2>风险全景视图</h2><p>{institution ? '聚焦本机构风险、资本、舆情、预警与事件' : '从全局态势到机构、指标和事项明细的三级穿透'}</p></div><em>{modeLabel}</em></div>
        <div className={`v14-risk-primary ${institution ? 'institution' : ''}`}>
          <SectionPanel title="风险雷达" code="RISK RADAR" description="本期 / 上期标准化示例值"><RadarChart onSelect={item => setDrawer({ type: 'risk', item })} /></SectionPanel>
          {!institution && <SectionPanel title="并表金融机构风险地图" code="INSTITUTION RISK MAP" description="抽象金融生态网络 · 悬停查看风险概貌" className="v14-map-panel"><RiskMap institutions={visibleInstitutions} warnings={warnings} events={events} navigate={navigate} /></SectionPanel>}
          {institution && <SectionPanel title="资本情况" code="CAPITAL POSITION" description="同比、环比与近6期趋势"><CapitalTable rows={filters.indicatorType === '全部指标' || filters.indicatorType === '资本指标' ? selectedCapitalRows : []} management={viewMode === 'management'} onOpen={item => setDrawer({ type: 'capital', item })} onAdd={() => toast('指标展示配置已打开，可从本机构适用指标中添加')} /></SectionPanel>}
          <SectionPanel title="动态舆情监测" code="LIVE INTELLIGENCE" description="每3秒自动轮播 · 悬停暂停"><NewsTicker items={news} onOpen={item => setDrawer({ type: 'news', item })} /></SectionPanel>
        </div>
        {!institution && <div className="v14-risk-secondary"><SectionPanel title="资本情况" code="CAPITAL POSITION" description="集团并表资本指标"><CapitalTable rows={filters.indicatorType === '全部指标' || filters.indicatorType === '资本指标' ? selectedCapitalRows : []} management={viewMode === 'management'} onOpen={item => setDrawer({ type: 'capital', item })} onAdd={() => toast('指标展示配置已打开，可从资本指标清单中添加')} /></SectionPanel><SectionPanel title="指标监测预警" code="WARNING MONITOR" description="默认按红灯、黄灯、未触发排序" className="v14-warning-panel"><WarningTable rows={warnings} mode={viewMode} onOpen={item => setDrawer({ type: 'indicator', item })} onAdd={() => toast('指标展示配置已打开，可添加当前权限范围内的监测指标')} /></SectionPanel></div>}
        <div className={`v14-risk-tertiary ${institution ? 'institution' : ''}`}>{institution && <SectionPanel title="指标监测预警" code="WARNING MONITOR" description={`${institution.shortName}权限范围内指标`} className="v14-warning-panel"><WarningTable rows={warnings} mode={viewMode} onOpen={item => setDrawer({ type: 'indicator', item })} onAdd={() => toast('指标展示配置已打开，可添加本机构适用的监测指标')} /></SectionPanel>}<SectionPanel title="重大风险事件" code="MAJOR RISK EVENTS" description="事件汇总与处置流程跟踪" className="v14-event-panel"><EventPanel events={events} mode={viewMode} onOpen={item => setDrawer({ type: 'event', item })} /></SectionPanel></div>
      </section>
      <Operations institution={institution} type={institutionType} />
    </main>
    <footer className="v14-footer"><span><i />并表主题数据集市（DM）</span><span>风险数据服务 · 资本数据服务 · 舆情融合平台 · 重大事件台账</span><span>DEMO数据仅用于展示，不作为正式业务规则</span></footer>
    <DetailDrawer drawer={drawer} onClose={() => setDrawer(null)} navigate={navigate} />
  </div>;
}

// Management homepage shares the existing data and detail drawers with institution views.
function ExecutiveCockpit({ state, navigate, toast }: { state: DemoState; navigate: Navigate; toast: (message: string) => void }) {
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [selection, setSelection] = useState<{ title: string; rows: WarningRow[] } | null>(null);
  const [allNews, setAllNews] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const institutions = state.institutions;
  const matches = (name: string) => institutions.some(item => name.includes(item.shortName) || item.name.includes(name));
  const warnings = demoWarnings.filter(item => matches(item.institution));
  const news = demoNews.filter(item => matches(item.institution));
  const events = state.majorEvents;
  const red = warnings.filter(item => item.status === '红灯');
  const yellow = warnings.filter(item => item.status === '黄灯');
  const monthlyEvents = events.filter(item => item.occurredAt.startsWith('2024-06'));
  useEffect(() => {
    sessionStorage.setItem('dashboard-v14-active-context', JSON.stringify({ institution: '全部机构', filters: { period: '2024年6月', institution: '全部机构', indicatorType: '全部指标', riskType: '全部风险' } }));
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const toggleFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('.executive-cockpit')?.requestFullscreen(); }
    catch { toast('当前浏览器暂不支持全屏，请使用浏览器全屏功能'); }
  };
  const metrics = businessMetrics.slice(1).map(item => ({ ...item, label: item.label.includes('ROWA') ? '风险加权资产收益率（ROWA）' : item.label.includes('ROA') ? '总资产收益率（ROA）' : item.label === '净利润' ? '净利润（亿元）' : item.label }));
  const trends = [[65.2, 69.1, 67.8, 72.3, 75.4, 78.4], [4.1, 4.4, 4.2, 4.7, 4.5, 4.8], [8.7, 8.9, 9.1, 9.0, 9.2, 9.42], [1.02, 1.06, 1.04, 1.1, 1.13, 1.16], [1.25, 1.29, 1.28, 1.34, 1.39, 1.42]];
  const sentiment = (item: NewsItem) => item.id === 'news-4' ? '正面' : item.id === 'news-2' ? '中性' : '负面';
  const newsList = (items: NewsItem[]) => items.map(item => <button className="exec-news-item" key={item.id} onClick={() => { setAllNews(false); setDrawer({ type: 'news', item }); }}><span><b>{item.institution}</b><time>{item.time}</time><em className={sentiment(item) === '负面' ? 'red' : sentiment(item) === '中性' ? 'yellow' : 'green'}>{sentiment(item)}</em></span><strong>{item.title}</strong></button>);
  return <div className="dashboard-cockpit executive-cockpit">
    <header className="exec-topbar"><span className="exec-date">数据时点 <b>2024-06-30</b></span><h1>金控并表驾驶舱</h1><div><button onClick={() => { setDrawer(null); setSelection(null); setAllNews(false); toast('已刷新本地 DEMO 数据，数据时点为 2024-06-30'); }}>↻ 刷新</button><button onClick={toggleFullscreen}>{fullscreen ? '⊡ 退出全屏' : '⛶ 全屏'}</button></div></header>
    <div className="exec-content-grid">
    <main className="exec-main-column">
    <section className="exec-overview"><div className="exec-section-heading"><h2><span>01</span>总体概览</h2><small>2024年6月 · 并表口径</small></div><div className="exec-summary-grid">
      <div className="exec-summary cyan"><span>并表金融机构数量</span><b>{institutions.length}<small>家</small></b><small>并表范围内金融机构</small><Glyph name="institution" /></div>
      <button className="exec-summary yellow" onClick={() => setSelection({ title: '本月新增黄灯预警', rows: yellow })}><span>本月新增黄灯预警</span><b>{yellow.length}<small>条</small></b><small>查看预警指标明细 ↗</small><Glyph name="warning" /></button>
      <button className="exec-summary red" onClick={() => setSelection({ title: '本月新增红灯预警', rows: red })}><span>本月新增红灯预警</span><b>{red.length}<small>条</small></b><small>查看预警指标明细 ↗</small><Glyph name="warning" /></button>
      <button className="exec-summary orange" onClick={() => navigate('/major-events')}><span>本月新增重大风险事件数量</span><b>{monthlyEvents.length}<small>起</small></b><small>查看重大风险事件 ↗</small><Glyph name="event" /></button>
    </div></section>
    <section className="exec-risk"><div className="exec-section-heading"><h2><span>02</span>风险全景视图</h2><small>机构 × 风险类别</small></div>
      <div className="exec-panel exec-heat-panel"><div className="exec-panel-heading"><h3>风险热力图</h3><small>点击单元格查看指标明细 ↗</small></div>
        <div className="exec-matrix-wrap"><table className="exec-matrix"><thead><tr><th scope="col">并表金融机构</th>{riskTypes.slice(1).map(risk => <th scope="col" key={risk}><button onClick={() => setDrawer({ type: 'risk', item: risk })}>{risk.replace('风险', '')}<small>风险 ↗</small></button></th>)}</tr></thead><tbody>{institutions.map((org, index) => <tr key={org.id}><th scope="row"><button className="exec-org" onClick={() => navigate(`/dashboard/institution/${org.id}`)}><small>{String(index + 1).padStart(2, '0')}</small><span>{org.shortName}<small>{org.type}</small></span><i>↗</i></button></th>{riskTypes.slice(1).map(risk => {
          const rows = warnings.filter(item => (item.institution.includes(org.shortName) || org.name.includes(item.institution)) && item.riskType === risk);
          const r = rows.filter(item => item.status === '红灯').length; const y = rows.filter(item => item.status === '黄灯').length;
          return <td key={risk}><button className={`exec-heat-cell ${r ? 'red' : y ? 'yellow' : 'green'}`} aria-label={`${org.shortName} ${risk} 红${r} · 黄${y}`} onClick={() => setSelection({ title: `${org.shortName} · ${risk}`, rows })}><span>红<b>{r}</b><i>·</i>黄<b>{y}</b></span></button></td>;
        })}</tr>)}</tbody></table></div>
        <div className="exec-heat-footer"><div><span className="red"><i />红灯</span><span className="yellow"><i />黄灯</span><span className="green"><i />正常</span></div><small>红灯优先 · 数值为预警条数</small></div>
      </div>
    </section>
    </main>
    <aside className="exec-right-rail"><div className="exec-panel exec-news"><div className="exec-panel-heading"><h3>风险舆情监测</h3><button onClick={() => setAllNews(true)}>全部 ↗</button></div><div className="exec-list">{newsList(news.slice(0, 4))}{!news.length && <EmptyState />}</div></div>
      <div className="exec-panel exec-events"><div className="exec-panel-heading"><h3>重大风险事件</h3><button onClick={() => navigate('/major-events')}>全部 ↗</button></div><div className="exec-list">{events.slice(0, 3).map(item => <button className="exec-event-item" key={item.id} onClick={() => setDrawer({ type: 'event', item })}><i className={isClosed(item.status) ? 'green' : 'red'} /><span><strong>{item.name}</strong><small>{item.institution} · {item.status}</small></span><em>↗</em></button>)}{!events.length && <EmptyState />}</div></div></aside>
    </div>
    <section className="exec-operations"><div className="exec-section-heading"><h2><span>03</span>经营情况</h2><small>近6期趋势 · 并表口径</small></div><div className="exec-finance-grid">{metrics.map((item, index) => <div className="exec-finance" key={item.label}><span>{item.label}</span><b>{item.value}<small>{item.unit === '%' ? '%' : ''}</small></b><div><small>{item.change}</small><MiniTrend values={trends[index].map(value => (value - Math.min(...trends[index])) / (Math.max(...trends[index]) - Math.min(...trends[index])) * 100)} /></div></div>)}</div></section>
    {(selection || allNews) && <div className="v14-drawer-mask" onMouseDown={event => event.target === event.currentTarget && (setSelection(null), setAllNews(false))}><aside className="v14-drawer" role="dialog" aria-modal="true" aria-label={selection?.title || '全部风险舆情'}><header><h2>{selection?.title || '全部风险舆情'}</h2><button aria-label="关闭" onClick={() => { setSelection(null); setAllNews(false); }}>×</button></header><div className="v14-drawer-body">{selection ? <WarningTable rows={selection.rows} mode="decision" onOpen={item => { setSelection(null); setDrawer({ type: 'indicator', item }); }} onAdd={() => navigate('/indicators/query')} /> : newsList(news)}{selection && !selection.rows.length && <p className="v14-detail-note">当前类别未触发红灯或黄灯预警，可进入机构驾驶舱查看完整监测指标。</p>}</div></aside></div>}
    <DetailDrawer drawer={drawer} onClose={() => setDrawer(null)} navigate={navigate} />
  </div>;
}
