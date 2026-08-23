import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { DemoState, IndicatorPeriodRecord, Role } from '../types';
import { indicatorPeriodService } from '../services/indicatorPeriodService';
import { currentInstitution } from '../services/permissionService';

type Navigate = (path: string) => void;
type Update = (fn: (state: DemoState) => void) => void;
type Light = 'red' | 'yellow' | 'green' | 'blue' | 'violet';
type DashboardFilters = { institution: string; indicatorType: string; light: string; startPeriod: string; endPeriod: string };

type DashboardCockpitProps = {
  state: DemoState;
  role: Role;
  navigate: Navigate;
  update: Update;
  toast: (message: string) => void;
};

const roleMeta: Record<Role, { eyebrow: string }> = {
  集团: { eyebrow: 'GROUP RISK COMMAND CENTER' },
  金控公司: { eyebrow: 'CONSOLIDATION CONTROL CENTER' },
  各金融机构: { eyebrow: 'INSTITUTION RISK MONITOR' },
};

const lightOf = (value: string): Light => value.includes('红') ? 'red' : value.includes('黄') ? 'yellow' : value.includes('紫') ? 'violet' : value.includes('蓝') ? 'blue' : 'green';
const numberOf = (value: string) => Number.parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
const isClosed = (status: string) => /已解除|已关闭|已办结|已归档/.test(status);
const isHandling = (status: string) => /处置|跟踪|执行|反馈|方案|审核|处理中|待/.test(status) && !isClosed(status);

export function StatusLight({ status, label }: { status: string; label?: string }) {
  const tone = lightOf(status);
  return <span className={`dc-status dc-${tone}`}><i />{label || status}</span>;
}

export function TechPanel({ title, kicker, extra, className = '', children }: { title: string; kicker?: string; extra?: ReactNode; className?: string; children: ReactNode }) {
  return <section className={`dc-panel ${className}`}>
    <header className="dc-panel-head"><div><span>{kicker || 'REAL-TIME MONITOR'}</span><h2>{title}</h2></div>{extra}</header>
    <div className="dc-panel-body">{children}</div>
  </section>;
}

export function MetricCard({ label, value, unit, note, tone, onClick }: { label: string; value: string | number; unit?: string; note: string; tone: Light; onClick?: () => void }) {
  return <button className={`dc-metric dc-metric-${tone}`} onClick={onClick} disabled={!onClick}>
    <span className="dc-metric-orbit"><i /></span><span className="dc-metric-copy"><small>{label}</small><strong>{value}<em>{unit}</em></strong><span>{note}</span></span>
  </button>;
}

function Sparkline({ values, tone = 'blue' }: { values: number[]; tone?: Light }) {
  const safe = values.length > 1 ? values : [42, 45, 44, 48, 47, 51];
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const range = Math.max(1, max - min);
  const points = safe.map((value, index) => `${index * (100 / (safe.length - 1))},${34 - ((value - min) / range) * 27}`).join(' ');
  return <svg className={`dc-spark dc-line-${tone}`} viewBox="0 0 100 38" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} /></svg>;
}

export function TrendChart({ records, tone = 'blue' }: { records: IndicatorPeriodRecord[]; tone?: Light }) {
  const ordered = [...records].sort((a, b) => a.periodOrder - b.periodOrder).slice(-6);
  const values = ordered.map(item => numberOf(item.indicatorValue));
  const safe = values.length > 1 ? values : [12.8, 13.1, 12.9, 13.5, 13.7, 14.1];
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const range = Math.max(1, max - min);
  const points = safe.map((value, index) => `${index * (540 / (safe.length - 1)) + 8},${134 - ((value - min) / range) * 92}`).join(' ');
  return <div className={`dc-trend dc-line-${tone}`}>
    <div className="dc-trend-grid"><i /><i /><i /><i /></div>
    <svg viewBox="0 0 556 160" preserveAspectRatio="none"><polyline points={points} /><polygon points={`${points} 548,150 8,150`} /></svg>
    <div className="dc-trend-labels">{(ordered.length ? ordered : safe.map((_, index) => ({ period: `${index + 1}月` }))).map((item, index) => <span key={`${item.period}-${index}`}>{item.period}</span>)}</div>
  </div>;
}

export function ProcessFlow({ steps, onClick }: { steps: { label: string; value: number; tone?: Light }[]; onClick?: () => void }) {
  return <div className={`dc-process ${steps.length > 7 ? 'dc-process-dense' : ''}`}>{steps.map((step, index) => <button key={step.label} onClick={onClick} disabled={!onClick}>
    <span className={`dc-process-node dc-${step.tone || (step.value ? 'blue' : 'green')}`}><i>{String(index + 1).padStart(2, '0')}</i><b>{step.value}</b></span>
    <small>{step.label}</small>{index < steps.length - 1 && <em />}
  </button>)}</div>;
}

function PanelLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button className="dc-panel-link" onClick={onClick}>{children}<span>›</span></button>;
}

function indicatorHistory(state: DemoState, record?: IndicatorPeriodRecord) {
  if (!record) return [];
  return state.indicatorPeriodRecords.filter(item => item.indicatorId === record.indicatorId && item.institution === record.institution);
}

function IndicatorRows({ records, state, navigate, limit = 5 }: { records: IndicatorPeriodRecord[]; state: DemoState; navigate: Navigate; limit?: number }) {
  return <div className="dc-indicator-rows">{records.slice(0, limit).map(record => <button key={record.id} onClick={() => navigate(`/indicators/query/${record.id}`)}>
    <div><StatusLight status={record.currentLightStatus} label="" /><span><b>{record.indicatorName}</b><small>{record.institution} · {record.period}</small></span></div>
    <Sparkline values={indicatorHistory(state, record).map(item => numberOf(item.indicatorValue))} tone={lightOf(record.currentLightStatus)} />
    <strong>{record.indicatorValue}<em>{record.indicatorUnit}</em></strong>
  </button>)}</div>;
}

export function InstitutionNode({ name, red, yellow, events, status, onClick, center = false }: { name: string; red: number; yellow: number; events: number; status: Light; onClick?: () => void; center?: boolean }) {
  return <button className={`dc-institution-node dc-node-${status} ${center ? 'dc-node-center' : ''}`} onClick={onClick} disabled={!onClick}>
    <span className="dc-node-core"><i /></span><b>{name}</b>{!center && <small><em className="red">R {red}</em><em className="yellow">Y {yellow}</em><em>E {events}</em></small>}
  </button>;
}

function InstitutionNetwork({ state, navigate }: { state: DemoState; navigate: Navigate }) {
  return <div className="dc-network">
    <div className="dc-network-rings"><i /><i /><i /></div>
    <InstitutionNode name="上海国际集团" red={0} yellow={0} events={0} status="blue" center />
    {state.institutions.slice(0, 5).map((institution, index) => {
      const warnings = state.warningDisposals.filter(item => item.institution.includes(institution.name));
      const events = state.majorEvents.filter(item => item.institution.includes(institution.name)).length;
      const red = warnings.filter(item => item.level === '红灯' && !isClosed(item.status)).length;
      const yellow = warnings.filter(item => item.level === '黄灯' && !isClosed(item.status)).length;
      return <div className={`dc-network-slot dc-network-slot-${index + 1}`} key={institution.id}><InstitutionNode name={institution.shortName} red={red} yellow={yellow} events={events} status={red ? 'red' : yellow ? 'yellow' : 'green'} onClick={() => navigate(`/institutions/${institution.id}`)} /></div>;
    })}
  </div>;
}

function CapitalGauges({ records, navigate }: { records: IndicatorPeriodRecord[]; navigate: Navigate }) {
  return <div className="dc-capital-gauges">{records.slice(0, 4).map((record, index) => {
    const value = numberOf(record.indicatorValue);
    const gauge = Math.min(96, Math.max(20, value > 100 ? value / 2 : value * 4));
    return <button key={record.id} onClick={() => navigate(`/indicators/query/${record.id}`)}>
      <span className={`dc-gauge dc-gauge-${lightOf(record.currentLightStatus)}`} style={{ '--gauge': `${gauge * 3.6}deg` } as CSSProperties}><i><b>{record.indicatorValue}</b><small>{record.indicatorUnit}</small></i></span>
      <strong>{record.indicatorName}</strong><small>{record.forecastRange}</small>
    </button>;
  })}</div>;
}

function warningSteps(state: DemoState) {
  const labels = ['原因分析', '原因审核', '方案制定', '方案审核', '执行跟踪', '复检', '评价'];
  return labels.map((label, index) => ({ label, value: state.warningDisposals.filter(item => (item.workflow?.records.length || 0) === index + 1 || (item.currentNode || '').includes(['reason', 'review', 'plan', 'assessment', 'execution', 'release', 'evaluation'][index])).length, tone: index < 2 ? 'yellow' as Light : index < 5 ? 'blue' as Light : 'green' as Light }));
}

function eventSteps(state: DemoState) {
  const labels = ['首报', '核实', '组织汇报', '管理层/董事会审阅', '处置方案', '执行跟踪', '续报', '终报'];
  return labels.map((label, index) => ({ label, value: state.majorEvents.filter(item => Math.min(7, item.workflow?.records.length || (item.latestReport === '终报' ? 7 : item.latestReport === '续报' ? 6 : 0)) === index).length, tone: index < 2 ? 'yellow' as Light : index < 7 ? 'blue' as Light : 'green' as Light }));
}

function warningSummary(state: DemoState) {
  const open = state.warningDisposals.filter(item => !isClosed(item.status));
  return {
    total: open.length,
    red: open.filter(item => item.level === '红灯').length,
    yellow: open.filter(item => item.level === '黄灯').length,
    done: state.warningDisposals.filter(item => isClosed(item.status)).length,
    handling: open.filter(item => isHandling(item.status)).length,
    persistent: open.filter(item => /持续|跟踪/.test(item.status)).length,
  };
}

function WarningDonut({ state }: { state: DemoState }) {
  const summary = warningSummary(state);
  const total = Math.max(1, summary.total + summary.done);
  const redEnd = summary.red / total * 360;
  const yellowEnd = redEnd + summary.yellow / total * 360;
  return <div className="dc-warning-summary"><div className="dc-warning-donut" style={{ '--red-end': `${redEnd}deg`, '--yellow-end': `${yellowEnd}deg` } as CSSProperties}><span><b>{summary.total}</b><small>当前预警</small></span></div><div className="dc-warning-numbers">{[
    ['红灯', summary.red, 'red'], ['黄灯', summary.yellow, 'yellow'], ['已处置', summary.done, 'green'], ['处理中', summary.handling, 'blue'], ['持续亮灯', summary.persistent, 'violet'],
  ].map(([label, value, tone]) => <span key={String(label)} className={`dc-${tone}`}><i /><small>{label}</small><b>{value}</b></span>)}</div></div>;
}

function EventList({ state, navigate, limit = 4 }: { state: DemoState; navigate: Navigate; limit?: number }) {
  return <div className="dc-event-list">{state.majorEvents.slice(0, limit).map(item => <button key={item.id} onClick={() => navigate(`/major-events/${item.id}/overview`)}>
    <span className="dc-event-code">{item.code.split('-').slice(-1)[0]}</span><span><b>{item.name}</b><small>{item.institution} · {item.currentStage}</small></span><StatusLight status={item.status} />
  </button>)}</div>;
}

function InstitutionRanking({ state, navigate }: { state: DemoState; navigate: Navigate }) {
  const rows = state.institutions.map(institution => {
    const warnings = state.warningDisposals.filter(item => item.institution.includes(institution.name) && !isClosed(item.status));
    const red = warnings.filter(item => item.level === '红灯').length;
    const yellow = warnings.filter(item => item.level === '黄灯').length;
    const events = state.majorEvents.filter(item => item.institution.includes(institution.name) && !isClosed(item.status)).length;
    return { institution, red, yellow, events, score: red * 5 + yellow * 2 + events * 4 };
  }).sort((a, b) => b.score - a.score);
  return <div className="dc-ranking">{rows.map((row, index) => <button key={row.institution.id} onClick={() => navigate(`/institutions/${row.institution.id}`)}><i>{String(index + 1).padStart(2, '0')}</i><span><b>{row.institution.shortName}</b><small>{row.institution.type}</small></span><em className="red">{row.red} 红</em><em className="yellow">{row.yellow} 黄</em><em>{row.events} 事件</em><StatusLight status={row.red ? '红灯' : row.yellow ? '黄灯' : '绿灯'} label={row.red ? '重点' : row.yellow ? '关注' : '正常'} /></button>)}</div>;
}

export function RiskMatrix({ state, latest, navigate }: { state: DemoState; latest: IndicatorPeriodRecord[]; navigate: Navigate }) {
  const columns = ['信用风险', '市场风险', '流动性风险', '集中度', '资本', '重大事件'];
  const matrixStatus = (institution: string, column: string): Light => {
    if (column === '重大事件') return state.majorEvents.some(item => item.institution.includes(institution) && !isClosed(item.status)) ? 'red' : 'green';
    const matchingWarnings = state.warningDisposals.filter(item => item.institution.includes(institution) && (column === '集中度' ? item.riskType.includes('集中') : item.riskType.includes(column.replace('风险', ''))) && !isClosed(item.status));
    if (matchingWarnings.some(item => item.level === '红灯')) return 'red';
    if (matchingWarnings.length) return 'yellow';
    if (column === '资本') {
      const capitals = latest.filter(item => item.institution.includes(institution) && /资本/.test(`${item.indicatorType}${item.indicatorName}`));
      if (capitals.some(item => item.currentLightStatus === '红灯')) return 'red';
      if (capitals.some(item => item.currentLightStatus === '黄灯')) return 'yellow';
    }
    return 'green';
  };
  return <div className="dc-matrix"><div className="dc-matrix-corner">纳管机构 / 风险域</div>{columns.map(column => <button className="dc-matrix-head" key={column} onClick={() => navigate(column === '重大事件' ? '/major-events' : '/indicators/query')}>{column}</button>)}{state.institutions.slice(0, 5).map(institution => <div className="dc-matrix-row" key={institution.id}>
    <button className="dc-matrix-name" onClick={() => navigate(`/institutions/${institution.id}`)}>{institution.shortName}<small>{institution.activeIndicatorCount} 项指标</small></button>
    {columns.map(column => { const tone = matrixStatus(institution.name, column); return <button className={`dc-matrix-cell dc-cell-${tone}`} key={column} onClick={() => navigate(column === '重大事件' ? '/major-events' : '/indicators/query')}><i /><span>{tone === 'red' ? '异常' : tone === 'yellow' ? '关注' : '正常'}</span></button>; })}
  </div>)}</div>;
}

function LimitExecution({ state }: { state: DemoState }) {
  const preferences = state.riskPreferences.flatMap(item => item.indicators).slice(0, 5);
  const fallback = state.institutions[0]?.indicators.slice(0, 5).map(item => ({ name: item.name, tolerance: item.lastYear, warning: item.current, unit: item.unit })) || [];
  const items = preferences.length ? preferences : fallback;
  return <div className="dc-limits">{items.map((item, index) => {
    const current = numberOf('warning' in item ? item.warning : '0') || 42 + index * 8;
    const limit = numberOf(item.tolerance) || Math.max(current + 8, 60);
    const percent = Math.min(100, current / limit * 100);
    return <div key={`${item.name}-${index}`}><span><b>{item.name}</b><small>{current.toFixed(1)} / {limit.toFixed(1)} {item.unit}</small></span><div><i className={percent > 90 ? 'red' : percent > 75 ? 'yellow' : ''} style={{ width: `${percent}%` }} /><em style={{ left: '88%' }} /></div><strong>{Math.max(0, limit - current).toFixed(1)}<small>剩余</small></strong></div>;
  })}</div>;
}

function RuleStatus({ state, navigate }: { state: DemoState; navigate: Navigate }) {
  const active = state.warningRules.filter(item => item.status === '生效').length;
  const paused = state.warningRules.filter(item => /暂停|停用/.test(item.status)).length;
  const triggered = state.warningDisposals.length;
  const riskTypes = [...new Set(state.warningRules.map(item => item.riskType))];
  return <div className="dc-rule-status"><div className="dc-rule-orbit"><span><b>{active}</b><small>生效规则</small></span></div><div className="dc-rule-stats"><button onClick={() => navigate('/warning/rules')}><small>暂停规则</small><b>{paused}</b></button><button onClick={() => navigate('/warning/disposal')}><small>本期触发规则</small><b>{new Set(state.warningDisposals.map(item => item.associatedRuleId)).size}</b></button><button onClick={() => navigate('/warning/disposal')}><small>本期触发次数</small><b>{triggered}</b></button></div><div className="dc-rule-types">{riskTypes.slice(0, 5).map((type, index) => <span key={type}><i style={{ width: `${45 + index * 9}%` }} /><b>{type}</b></span>)}</div></div>;
}

function DashboardConfig({ latest, initialIds, onClose, onSave }: { latest: IndicatorPeriodRecord[]; initialIds: string[]; onClose: () => void; onSave: (ids: string[]) => void }) {
  const [ids, setIds] = useState(initialIds);
  const [type, setType] = useState('全部');
  const types = ['全部', ...new Set(latest.map(item => item.indicatorType))];
  const toggle = (id: string) => setIds(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 8 ? [...current, id] : current);
  return <div className="dc-modal-mask" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="dc-modal" role="dialog" aria-modal="true" aria-label="指标展示配置">
    <header><div><span>DASHBOARD CONFIG</span><h2>指标展示配置</h2></div><button onClick={onClose}>×</button></header>
    <div className="dc-modal-toolbar"><label>指标类型<select value={type} onChange={event => setType(event.target.value)}>{types.map(item => <option key={item}>{item}</option>)}</select></label><span>已选择 <b>{ids.length}</b> / 8 项</span></div>
    <div className="dc-config-list">{latest.filter(item => type === '全部' || item.indicatorType === type).map(item => <label className={ids.includes(item.id) ? 'selected' : ''} key={item.id}><input type="checkbox" checked={ids.includes(item.id)} onChange={() => toggle(item.id)} /><span><b>{item.indicatorName}</b><small>{item.institution} · {item.indicatorType}</small></span><StatusLight status={item.currentLightStatus} /></label>)}</div>
    <footer><button onClick={onClose}>取消</button><button className="primary" disabled={ids.length < 3} onClick={() => onSave(ids)}>保存配置</button></footer>
  </div></div>;
}

function DashboardFilterBar({ role, institutions, indicatorTypes, periods, value, comparisonOpen, onChange, onReset, onToggleComparison }: { role: Role; institutions: string[]; indicatorTypes: string[]; periods: string[]; value: DashboardFilters; comparisonOpen: boolean; onChange: (next: DashboardFilters) => void; onReset: () => void; onToggleComparison: () => void }) {
  return <section className="dc-filterbar" aria-label="驾驶舱筛选条件">
    <div className="dc-filter-fields">
      <label><span>机构范围</span><select value={value.institution} disabled={role === '各金融机构'} onChange={event => onChange({ ...value, institution: event.target.value })}>{role !== '各金融机构' && <option>全部机构</option>}{institutions.map(item => <option key={item}>{item}</option>)}</select></label>
      <label><span>指标类型</span><select value={value.indicatorType} onChange={event => onChange({ ...value, indicatorType: event.target.value })}><option>全部类型</option>{indicatorTypes.map(item => <option key={item}>{item}</option>)}</select></label>
      <label><span>预警状态</span><select value={value.light} onChange={event => onChange({ ...value, light: event.target.value })}>{['全部状态', '红灯', '黄灯', '绿灯'].map(item => <option key={item}>{item}</option>)}</select></label>
      <label><span>起始期次</span><select value={value.startPeriod} onChange={event => onChange({ ...value, startPeriod: event.target.value })}>{periods.map(item => <option key={item}>{item}</option>)}</select></label>
      <label><span>结束期次</span><select value={value.endPeriod} onChange={event => onChange({ ...value, endPeriod: event.target.value })}>{periods.map(item => <option key={item}>{item}</option>)}</select></label>
    </div>
    <div className="dc-filter-actions"><button onClick={onReset}>重置</button><button className={comparisonOpen ? 'active' : ''} onClick={onToggleComparison}><i>⇄</i>{comparisonOpen ? '收起对比' : '对比分析'}</button></div>
  </section>;
}

function ComparisonPanel({ state, latest, selected, navigate }: { state: DemoState; latest: IndicatorPeriodRecord[]; selected: IndicatorPeriodRecord[]; navigate: Navigate }) {
  const [mode, setMode] = useState<'机构横向对比' | '历史趋势对比'>('机构横向对比');
  const [indicatorId, setIndicatorId] = useState(selected[0]?.indicatorId || latest[0]?.indicatorId || '');
  const comparableIndicators = [...new Map(latest.map(item => [item.indicatorId, item])).values()];
  const comparisonRows = state.institutions.map(institution => {
    const records = latest.filter(item => item.institution.includes(institution.name) || item.institution.includes(institution.shortName));
    return { institution, red: records.filter(item => item.currentLightStatus === '红灯').length, yellow: records.filter(item => item.currentLightStatus === '黄灯').length, green: records.filter(item => item.currentLightStatus === '绿灯').length, total: records.length };
  });
  const trendRecord = latest.find(item => item.indicatorId === indicatorId) || selected[0] || latest[0];
  const trendInstitutions = trendRecord ? [...new Set(state.indicatorPeriodRecords.filter(item => item.indicatorId === trendRecord.indicatorId).map(item => item.institution))] : [];
  return <TechPanel title="多维对比分析" kicker="CROSS & HISTORICAL COMPARISON" className="dc-comparison-panel" extra={<div className="dc-comparison-tabs">{(['机构横向对比', '历史趋势对比'] as const).map(item => <button className={mode === item ? 'active' : ''} key={item} onClick={() => setMode(item)}>{item}</button>)}</div>}>
    {mode === '机构横向对比' ? <div className="dc-compare-bars">{comparisonRows.map(row => <button key={row.institution.id} onClick={() => navigate(`/institutions/${row.institution.id}`)}><span><b>{row.institution.shortName}</b><small>{row.total} 项监测指标</small></span><div><i className="red" style={{ flex: row.red }} /><i className="yellow" style={{ flex: row.yellow }} /><i className="green" style={{ flex: row.green || (row.total ? .15 : 0) }} /></div><em><b>{row.red}</b> 红 <b>{row.yellow}</b> 黄</em></button>)}{!comparisonRows.length && <div className="dc-empty">当前筛选范围内暂无机构数据</div>}</div> : <div className="dc-history-comparison"><div className="dc-history-toolbar"><label>对比指标<select value={indicatorId} onChange={event => setIndicatorId(event.target.value)}>{comparableIndicators.map(item => <option value={item.indicatorId} key={item.indicatorId}>{item.indicatorName}</option>)}</select></label><span>{trendInstitutions.length} 家机构 · 最近 6 期</span></div><TrendChart records={trendRecord ? state.indicatorPeriodRecords.filter(item => item.indicatorId === trendRecord.indicatorId && item.institution === trendRecord.institution) : []} tone="violet" /><div className="dc-history-legend">{trendInstitutions.slice(0, 5).map((item, index) => <span key={item}><i className={`tone-${index + 1}`} />{item}</span>)}</div></div>}
  </TechPanel>;
}

function GroupDashboard({ state, latest, selected, navigate }: { state: DemoState; latest: IndicatorPeriodRecord[]; selected: IndicatorPeriodRecord[]; navigate: Navigate }) {
  const capital = latest.filter(item => /资本/.test(`${item.indicatorType}${item.indicatorName}`));
  const risk = selected.filter(item => !/资本/.test(`${item.indicatorType}${item.indicatorName}`));
  return <>
    <div className="dc-grid dc-group-focus">
      <TechPanel title="风险并表核心指标" kicker="CONSOLIDATED RISK"><IndicatorRows records={(risk.length ? risk : selected).slice(0, 5)} state={state} navigate={navigate} /></TechPanel>
      <TechPanel title="集团并表风险态势" kicker="INSTITUTION NETWORK" className="dc-network-panel"><InstitutionNetwork state={state} navigate={navigate} /></TechPanel>
      <TechPanel title="资本并表核心指标" kicker="CAPITAL ADEQUACY"><CapitalGauges records={(capital.length ? capital : selected).slice(0, 4)} navigate={navigate} /></TechPanel>
    </div>
    <div className="dc-grid dc-group-lower">
      <TechPanel title="机构风险态势" kicker="INSTITUTION RANKING" extra={<PanelLink onClick={() => navigate('/institutions')}>机构全景</PanelLink>}><InstitutionRanking state={state} navigate={navigate} /></TechPanel>
      <TechPanel title="预警总体态势" kicker="WARNING OVERVIEW" extra={<PanelLink onClick={() => navigate('/warning/disposal')}>查看预警</PanelLink>}><WarningDonut state={state} /></TechPanel>
      <TechPanel title="重大风险事件" kicker="MAJOR EVENTS" extra={<PanelLink onClick={() => navigate('/major-events')}>事件台账</PanelLink>}><EventList state={state} navigate={navigate} /></TechPanel>
    </div>
  </>;
}

function HoldingDashboard({ state, latest, selected, navigate }: { state: DemoState; latest: IndicatorPeriodRecord[]; selected: IndicatorPeriodRecord[]; navigate: Navigate }) {
  const trendRecord = selected[0] || latest[0];
  return <>
    <TechPanel title="机构风险管控矩阵" kicker="RISK CONTROL MATRIX" className="dc-matrix-panel" extra={<div className="dc-legend"><StatusLight status="绿灯" /><StatusLight status="黄灯" /><StatusLight status="红灯" /></div>}><RiskMatrix state={state} latest={latest} navigate={navigate} /></TechPanel>
    <div className="dc-grid dc-holding-middle">
      <TechPanel title="风险偏好及限额执行" kicker="RISK APPETITE" extra={<PanelLink onClick={() => navigate('/warning/risk-preference')}>查看方案</PanelLink>}><LimitExecution state={state} /></TechPanel>
      <TechPanel title="预警规则运行情况" kicker="RULE ENGINE"><RuleStatus state={state} navigate={navigate} /></TechPanel>
      <TechPanel title="核心指标快照" kicker="INDICATOR SNAPSHOT"><IndicatorRows records={selected.slice(0, 4)} state={state} navigate={navigate} limit={4} /></TechPanel>
    </div>
    <TechPanel title="预警处置进度" kicker="7-STAGE DISPOSAL FLOW" extra={<PanelLink onClick={() => navigate('/warning/disposal')}>处置全景</PanelLink>}><ProcessFlow steps={warningSteps(state)} onClick={() => navigate('/warning/disposal')} /></TechPanel>
    <TechPanel title="重大风险事件进度" kicker="8-STAGE EVENT FLOW" extra={<PanelLink onClick={() => navigate('/major-events')}>事件全景</PanelLink>}><ProcessFlow steps={eventSteps(state)} onClick={() => navigate('/major-events')} /></TechPanel>
    <TechPanel title="核心指标近 6 期趋势" kicker={trendRecord?.indicatorName || 'INDICATOR TREND'} extra={<PanelLink onClick={() => navigate('/indicators/query')}>切换指标</PanelLink>}><TrendChart records={indicatorHistory(state, trendRecord)} /></TechPanel>
  </>;
}

function InstitutionDashboard({ state, latest, selected, navigate }: { state: DemoState; latest: IndicatorPeriodRecord[]; selected: IndicatorPeriodRecord[]; navigate: Navigate }) {
  const capital = latest.find(item => /资本/.test(`${item.indicatorType}${item.indicatorName}`)) || selected[0];
  return <>
    <div className="dc-grid dc-institution-focus">
      <TechPanel title="本机构核心风险指标" kicker="CORE RISK INDICATORS"><IndicatorRows records={selected} state={state} navigate={navigate} limit={6} /></TechPanel>
      <TechPanel title="本机构风险限额执行" kicker="LIMIT UTILIZATION"><LimitExecution state={state} /></TechPanel>
    </div>
    <div className="dc-grid dc-institution-middle">
      <TechPanel title="当前预警事项" kicker="ACTIVE WARNINGS" extra={<PanelLink onClick={() => navigate('/warning/disposal')}>全部预警</PanelLink>}><div className="dc-warning-list">{state.warningDisposals.slice(0, 5).map(item => <button key={item.id} onClick={() => navigate(`/warning/disposal/${item.id}/overview`)}><StatusLight status={item.level} /><span><b>{item.indicator}</b><small>{item.value} · {item.riskType}</small></span><em>{item.currentNode || item.status}</em></button>)}</div></TechPanel>
      <TechPanel title="预警处置进度" kicker="INSTITUTION DISPOSAL FLOW"><ProcessFlow steps={warningSteps(state)} onClick={() => navigate('/warning/disposal')} /></TechPanel>
    </div>
    <div className="dc-grid dc-institution-lower">
      <TechPanel title="重大风险事件" kicker="INSTITUTION EVENTS" extra={<PanelLink onClick={() => navigate('/major-events')}>事件详情</PanelLink>}><EventList state={state} navigate={navigate} /></TechPanel>
      <TechPanel title="资本指标近 6 期趋势" kicker={capital?.indicatorName || 'CAPITAL TREND'}><TrendChart records={indicatorHistory(state, capital)} tone="violet" /></TechPanel>
    </div>
  </>;
}

export default function DashboardCockpit({ state, role, navigate, update, toast }: DashboardCockpitProps) {
  const allLatest = useMemo(() => indicatorPeriodService.latest(state.indicatorPeriodRecords), [state.indicatorPeriodRecords]);
  const periodOptions = useMemo(() => [...new Map([...state.indicatorPeriodRecords].sort((a, b) => a.periodOrder - b.periodOrder).map(item => [item.period, item])).values()].map(item => item.period), [state.indicatorPeriodRecords]);
  const institutionOptions = state.institutions.map(item => item.name);
  const indicatorTypes = [...new Set(allLatest.map(item => item.indicatorType))];
  const defaultFilters = (): DashboardFilters => ({ institution: role === '各金融机构' ? currentInstitution : '全部机构', indicatorType: '全部类型', light: '全部状态', startPeriod: periodOptions[0] || '', endPeriod: periodOptions[periodOptions.length - 1] || '' });
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const periodKey = periodOptions.join('|');
  useEffect(() => setFilters(defaultFilters()), [role, periodKey]);
  const periodOrders = new Map(state.indicatorPeriodRecords.map(item => [item.period, item.periodOrder]));
  const startOrder = periodOrders.get(filters.startPeriod) || Number.NEGATIVE_INFINITY;
  const endOrder = periodOrders.get(filters.endPeriod) || Number.POSITIVE_INFINITY;
  const minOrder = Math.min(startOrder, endOrder);
  const maxOrder = Math.max(startOrder, endOrder);
  const matchesInstitution = (value: string) => {
    if (filters.institution === '全部机构') return true;
    const target = state.institutions.find(item => item.name === filters.institution || item.shortName === filters.institution);
    return value.includes(filters.institution) || (!!target && (value.includes(target.name) || value.includes(target.shortName)));
  };
  const matchesPeriodDate = (value: string) => {
    const match = value.match(/(\d{4})-(\d{1,2})/);
    if (!match) return true;
    const order = Number(match[1]) * 100 + Number(match[2]);
    return order >= minOrder && order <= maxOrder;
  };
  const periodRecords = state.indicatorPeriodRecords.filter(item => item.periodOrder >= minOrder && item.periodOrder <= maxOrder && matchesInstitution(item.institution) && (filters.indicatorType === '全部类型' || item.indicatorType === filters.indicatorType) && (filters.light === '全部状态' || item.currentLightStatus === filters.light));
  const latest = useMemo(() => indicatorPeriodService.latest(periodRecords), [periodRecords]);
  const filteredState = useMemo((): DemoState => ({
    ...state,
    institutions: state.institutions.filter(item => filters.institution === '全部机构' || item.name === filters.institution || item.shortName === filters.institution),
    indicatorPeriodRecords: periodRecords,
    warningDisposals: state.warningDisposals.filter(item => matchesInstitution(item.institution) && matchesPeriodDate(item.triggerDate) && (filters.light === '全部状态' || item.level === filters.light) && (filters.indicatorType === '全部类型' || `${item.riskType}${item.indicator}`.includes(filters.indicatorType.replace('类', '')))),
    majorEvents: state.majorEvents.filter(item => matchesInstitution(item.institution) && matchesPeriodDate(item.occurredAt)),
    reports: state.reports.filter(item => matchesInstitution(item.institution)),
  }), [state, filters, periodRecords, minOrder, maxOrder]);
  const defaults = allLatest.slice(0, 6).map(item => item.id);
  const stored = state.dashboardIndicatorConfig?.[role] || [];
  const valid = stored.filter(id => allLatest.some(item => item.id === id));
  const selectedIds = valid.length >= 3 ? valid : defaults;
  const selectedIndicatorIds = selectedIds.map(id => allLatest.find(item => item.id === id)?.indicatorId).filter(Boolean);
  const selected = latest.filter(item => selectedIndicatorIds.includes(item.indicatorId));
  const displayedSelected = selected.length ? selected : latest.slice(0, 6);
  const [configOpen, setConfigOpen] = useState(false);
  const warnings = warningSummary(filteredState);
  const activeRules = filteredState.warningRules.filter(item => item.status === '生效').length;
  const capitalCount = latest.filter(item => /资本/.test(`${item.indicatorType}${item.indicatorName}`)).length;
  const green = latest.filter(item => item.currentLightStatus === '绿灯').length;
  const reportOk = filteredState.reports.filter(item => /已报送|完成|通过/.test(item.status)).length;
  const metrics = role === '集团' ? [
    ['纳入机构', filteredState.institutions.filter(item => item.status === '已纳入').length, '家', '当前筛选范围', 'blue', '/institutions'],
    ['风险并表指标', latest.length - capitalCount, '项', '覆盖五类风险域', 'violet', '/indicators/query'],
    ['资本并表指标', capitalCount, '项', '资本约束持续监测', 'blue', '/indicators/query'],
    ['当前黄灯预警', warnings.yellow, '项', '需跟踪关注', 'yellow', '/warning/disposal'],
    ['当前红灯预警', warnings.red, '项', '需重点审阅', 'red', '/warning/disposal'],
    ['重大风险事件', filteredState.majorEvents.filter(item => !isClosed(item.status)).length, '起', '集团关注事项', 'red', '/major-events'],
  ] : role === '金控公司' ? [
    ['纳管机构', filteredState.institutions.filter(item => item.status === '已纳入').length, '家', '当前筛选范围', 'blue', '/institutions'],
    ['监测指标', latest.length, '项', '本期有效监测', 'violet', '/indicators/query'],
    ['运行规则', activeRules, '条', '规则引擎正常', 'green', '/warning/rules'],
    ['红灯预警', warnings.red, '项', '重点处置', 'red', '/warning/disposal'],
    ['黄灯预警', warnings.yellow, '项', '持续跟踪', 'yellow', '/warning/disposal'],
    ['重大风险事件', filteredState.majorEvents.filter(item => !isClosed(item.status)).length, '起', '流程持续跟踪', 'red', '/major-events'],
  ] : [
    ['监测指标', latest.length, '项', `${currentInstitution}口径`, 'blue', '/indicators/query'],
    ['当前绿灯', green, '项', '运行正常', 'green', '/indicators/query'],
    ['当前黄灯', latest.filter(item => item.currentLightStatus === '黄灯').length, '项', '需要关注', 'yellow', '/warning/disposal'],
    ['当前红灯', latest.filter(item => item.currentLightStatus === '红灯').length, '项', '需要处置', 'red', '/warning/disposal'],
    ['重大风险事件', filteredState.majorEvents.filter(item => !isClosed(item.status)).length, '起', '仅本机构', 'red', '/major-events'],
    ['报送状态', `${reportOk}/${filteredState.reports.length}`, '', '本机构报表口径', reportOk === filteredState.reports.length ? 'green' : 'yellow', '/reports'],
  ];
  const period = filters.startPeriod === filters.endPeriod ? filters.endPeriod : `${filters.startPeriod}—${filters.endPeriod}`;
  return <div className={`dashboard-cockpit dc-role-${role === '集团' ? 'group' : role === '金控公司' ? 'holding' : 'institution'}`}>
    <div className="dc-scanline" />
    <header className="dc-topbar"><div className="dc-title-lockup"><span>{roleMeta[role].eyebrow}</span><h1>并表管理驾驶舱</h1></div><div className="dc-context"><span><small>当前角色</small><b>{role}</b></span><span><small>数据期次</small><b>{period}</b></span><span><small>最后更新</small><b>2024-06-30 13:22</b></span><button onClick={() => setConfigOpen(true)}><i>⌁</i>指标展示配置</button></div></header>
    <DashboardFilterBar role={role} institutions={institutionOptions} indicatorTypes={indicatorTypes} periods={periodOptions} value={filters} comparisonOpen={comparisonOpen} onChange={setFilters} onReset={() => setFilters(defaultFilters())} onToggleComparison={() => setComparisonOpen(current => !current)} />
    <div className="dc-filter-summary"><span><i />当前口径：{filters.institution} · {filters.indicatorType} · {filters.light}</span><b>{latest.length} 项指标 / {filteredState.warningDisposals.length} 项预警 / {filteredState.majorEvents.length} 起事件</b></div>
    <div className="dc-metrics">{metrics.map(([label, value, unit, note, tone, path]) => <MetricCard key={String(label)} label={String(label)} value={value as string | number} unit={String(unit)} note={String(note)} tone={tone as Light} onClick={() => navigate(String(path))} />)}</div>
    <main className="dc-stage">{comparisonOpen && <ComparisonPanel state={filteredState} latest={latest} selected={displayedSelected} navigate={navigate} />}{role === '集团' ? <GroupDashboard state={filteredState} latest={latest} selected={displayedSelected} navigate={navigate} /> : role === '金控公司' ? <HoldingDashboard state={filteredState} latest={latest} selected={displayedSelected} navigate={navigate} /> : <InstitutionDashboard state={filteredState} latest={latest} selected={displayedSelected} navigate={navigate} />}</main>
    <footer className="dc-footer"><span><i />数据链路正常</span><span>并表口径：{role === '各金融机构' ? currentInstitution : '集团金融板块'}</span><span>风险数据服务 · 资本数据服务 · 预警引擎 · 重大事件台账</span></footer>
    {configOpen && <DashboardConfig latest={allLatest} initialIds={selectedIds} onClose={() => setConfigOpen(false)} onSave={ids => { update(current => { current.dashboardIndicatorConfig = { ...current.dashboardIndicatorConfig, [role]: ids }; }); setConfigOpen(false); toast('驾驶舱指标展示配置已保存'); }} />}
  </div>;
}
