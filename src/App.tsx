import React, { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import type { DemoState, Role, Attachment, RiskPreference, WarningRule, WarningDisposal, WarningDisposalMeasure, Indicator, IndicatorPeriodRecord, MajorEvent, MajorEventMeasure, MajorRiskEventDefinition, PeriodicReport, SpecialRisk, SpecialRiskWorkOrder, WorkflowInstance, ConcentrationBusinessDetail, ConcentrationCompositionItem, ConcentrationLightStatus, ConcentrationRecord, ConcentrationType } from './types';
import { createLog, formatSize, loadState, makeAttachment, resetState, saveState, uid } from './services/storage';
import { can, canAccessRiskPreference, canApproveWarningRule, canCreateIndicator, canEditIndicator, canEditMajorEvent, canEditWarningRuleConfig, canExportConcentrationData, canHandleMajorEventNode, canHandleWarningNode, canHandleWorkflowNode, canManageIndicatorStatus, canManageMajorEventDefinitions, canMaintainLetterDeliveryMode, canMaintainWarningRule, canMaintainWarningRuleStatus, canManuallySendWarningLetter, canViewConcentrationMonitoring, canViewConcentrationWarning, canViewInstitution, canViewMajorEventOverview, canViewWarningOverview, canViewWarningRuleConfig, canViewWorkflowRecord, currentInstitution, getDefaultRouteForRole, getMajorEventActions, getMajorEventNodeRole, majorEventActionLabels, resolveStoredRole, roleLabels, scopeStateForRole } from './services/permissionService';
import { riskPreferenceService } from './services/riskPreferenceService';
import { warningRuleService } from './services/warningRuleService';
import { indicatorService } from './services/indicatorService';
import { calculateLightSummaryForRecords, getIndicatorHistoryRecords, indicatorPeriodService } from './services/indicatorPeriodService';
import { getMajorEventNodeFields, majorEventService } from './services/majorEventService';
import { getMajorRiskEventTypeOptions, isValidMajorRiskEventType, majorEventDefinitionService } from './services/majorEventDefinitionService';
import { letterDeliveryModeLabels, warningLetterService } from './services/warningLetterService';
import { isWarningLetterPending } from './services/warningConsistencyService';
import { reportService } from './services/reportService';
import { periodicReportService } from './services/periodicReportService';
import { specialRiskService } from './services/specialRiskService';
import { majorEventWorkflow, riskPreferenceWorkflow, specialRiskWorkflow, warningDisposalWorkflow, workflowService } from './services/workflowService';
import type { WorkflowDefinitionNode } from './services/workflowService';
import { getWarningNodeFormFields, getWarningNoticeType, getWarningWorkflowSteps, warningDisposalService } from './services/warningDisposalService';
import { concentrationInstitutions, concentrationLightLabels, concentrationTypeLabels, concentrationTypeSlugs, concentrationTypes, getConcentrationTypeFromSlug, getConsolidatedConcentrationBusinessDetails, getConsolidatedConcentrationRecords, loadConcentrationData, loadConcentrationDisplayConfig, saveConcentrationDisplayConfig } from './services/concentrationService';
import { getWorkbenchDataByRole } from './services/workbenchService';
import { downloadCSV, downloadText } from './utils/download';
import SmartAssistant from './SmartAssistant';
import DashboardCockpit from './dashboard/DashboardCockpit';
import GroupDashboard from './dashboard/GroupDashboard';

export default App;

const institutions = ['上海农商银行', '国际AMC', '浦发银行', '国泰海通', '中国太平洋保险'];
const institutionCoverage = institutions.join('、');
const riskTypes = ['信用风险', '市场风险', '流动性风险', '集中度风险', '资本类', '会计类'];
const specialTypes = ['风险类型A', '风险类型B', '风险类型C', '风险类型D'];
const departments = ['金融机构管理部', '风险管理部', '科技管理部', '合规管理部', '集团办公室'];
const today = () => new Date().toISOString().slice(0, 10);

type WorkspaceTone = 'indigo' | 'blue' | 'green' | 'orange' | 'red' | 'violet';
type WorkspaceMetric = { label: string; value: string | number; unit: string; trend: string; note: string; path: string; tone: WorkspaceTone; icon: string };
type WorkspaceTaskStatus = '待签收' | '办理中' | '已办' | '逾期';
type WorkspaceTaskOverride = { status: WorkspaceTaskStatus; owner: string; updatedAt: string };

function WorkspaceGlyph({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'building') return <svg viewBox="0 0 24 24" {...common}><path d="M4 21V5l8-3 8 3v16M8 7h1m6 0h1M8 11h1m6 0h1M8 15h1m6 0h1M10 21v-4h4v4" /></svg>;
  if (name === 'warning') return <svg viewBox="0 0 24 24" {...common}><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4m0 3h.01" /></svg>;
  if (name === 'capital') return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9" /><path d="M8 9h8M8 13h8m-5-7v12m2-12v12" /></svg>;
  if (name === 'report') return <svg viewBox="0 0 24 24" {...common}><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4M9 11h6m-6 4h6" /></svg>;
  if (name === 'check') return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 9" /></svg>;
  if (name === 'task') return <svg viewBox="0 0 24 24" {...common}><path d="M7 4h10v17H7zM9 4V2h6v2M10 9h4m-4 4h4m-4 4h3" /></svg>;
  if (name === 'chart') return <svg viewBox="0 0 24 24" {...common}><path d="M4 20V5m0 15h16M7 16l4-5 3 2 5-7" /></svg>;
  return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

function WorkspaceMetrics({ items, navigate }: { items: WorkspaceMetric[]; navigate: (path: string) => void }) {
  return <div className="workspace-metric-grid">{items.map(item => <button className={`workspace-metric-card tone-${item.tone}`} key={item.label} onClick={() => navigate(item.path)}>
    <span className="workspace-metric-icon"><WorkspaceGlyph name={item.icon} /></span>
    <span className="workspace-metric-copy"><span>{item.label}</span><b>{item.value}<em>{item.unit}</em></b><small><i>{item.trend}</i>{item.note}</small></span>
  </button>)}</div>;
}

function WorkspacePanelTitle({ title, description }: { title: string; description?: string }) {
  return <div className="workspace-panel-heading"><div><i /><span><b>{title}</b>{description && <small>{description}</small>}</span></div></div>;
}

function useAppState() {
  const [state, setState] = useState<DemoState>(() => loadState());
  const update = (fn: (value: DemoState) => void) => setState(prev => { const next = structuredClone(prev); fn(next); saveState(next); return next; });
  return { state, update, reset: () => setState(resetState()) };
}

function useRouter() {
  const [path, setPath] = useState(window.location.pathname || '/');
  const routePath = (next: string) => new URL(next, window.location.href).pathname;
  const navigate = (next: string) => { window.history.pushState({}, '', next); setPath(routePath(next)); window.scrollTo(0, 0); };
  const replace = (next: string) => { window.history.replaceState({}, '', next); setPath(routePath(next)); window.scrollTo(0, 0); };
  useEffect(() => { const fn = () => setPath(window.location.pathname); window.addEventListener('popstate', fn); return () => window.removeEventListener('popstate', fn); }, []);
  return { path, navigate, replace };
}

function Icon({ children }: { children: ReactNode }) { return <span className="menu-icon">{children}</span>; }
const pageDescriptions: Record<string, string> = {
  '重大风险事件定义管理': '维护重大风险事件分类、定义及参考依据。',
  '重大风险事件报告': '统一查询重大风险事件并跟踪首报、处置、续报及终报进展。',
  '指标查询': '统一查询指标最新一期及历史期间运行结果。',
  '指标新增与维护': '维护并表管理指标定义、适用范围及基础属性。',
  '指标版本管理': '查询指标版本及历次变更记录。',
  '报表与分析中心': '集中提供并表管理相关报表、专题分析及监管报表的统一入口。',
  '定期风险报告管理': '查询、上传及维护定期风险报告。',
  '专项风险提示与管理': '统一管理专项风险提示函下发、机构答复及后续跟踪反馈。',
  '风险预警规则管理': '维护风险预警规则、阈值及运行状态。',
  '预警提示与处置': '查询风险预警并跟踪反馈、处置及解除进展。',
  '集中度风险监测': '监测客户、行业、区域等维度的集中度风险。',
};
function Button({ children, onClick, variant = 'primary', disabled = false, title }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'text' | 'danger'; disabled?: boolean; title?: string }) { const [fallbackOpen, setFallbackOpen] = useState(false); const handler = onClick || (() => setFallbackOpen(true)); return <>{<button title={title || (!onClick ? '点击打开功能弹窗' : undefined)} disabled={disabled} className={`btn btn-${variant}`} onClick={handler}>{children}</button>}{fallbackOpen && <Modal title="功能入口" onClose={() => setFallbackOpen(false)} footer={<Button variant="secondary" onClick={() => setFallbackOpen(false)}>关闭</Button>}><div className="modal-note">该功能入口已打开，可在此继续完成操作。</div></Modal>}</>; }
function StatusTag({ value }: { value: string }) { const cls = value === '已下发专项风险提示函' ? 'blue' : value === '已答复专项风险提示函' ? 'orange' : value === '已审阅答复函' ? 'green' : /红灯|驳回|停用|已失效|已解除|归档/.test(value) ? 'red' : /黄灯|待审核|待反馈|待下发|评估中|草稿|待提交|暂停/.test(value) ? 'orange' : /绿灯|生效|已生效|已反馈|处理中|已报送|已下发|部分解除|提交/.test(value) ? 'green' : 'gray'; return <span className={`status ${cls}`}>{value}</span>; }
function SearchPanel({ children, onSearch, onReset }: { children: ReactNode; onSearch: () => void; onReset: () => void }) { return <div className="search-panel"><div className="search-fields">{children}</div><div className="search-actions"><Button onClick={onSearch}>⌕ 检索</Button><Button variant="secondary" onClick={onReset}>重置</Button></div></div>; }
function Field({ label, children, required = false, span = 1 }: { label: string; children: ReactNode; required?: boolean; span?: number }) { return <label className={`field span-${span}`}><span>{label}{required && <b className="required">*</b>}</span>{children}</label>; }
function Input({ value, onChange, placeholder, type = 'text', disabled = false, maxLength }: { value?: string | number; onChange?: (value: string) => void; placeholder?: string; type?: string; disabled?: boolean; maxLength?: number }) { return <input disabled={disabled} type={type} value={value ?? ''} placeholder={placeholder} maxLength={maxLength} onChange={e => onChange?.(e.target.value)} />; }
function Select({ value, onChange, options, disabled = false }: { value?: string; onChange?: (value: string) => void; options: string[]; disabled?: boolean }) { const lightOptions = options.map(x => x === '不亮灯' ? '绿灯（不预警）' : x); const selected = value === '不亮灯' ? '绿灯（不预警）' : value; return <select disabled={disabled} value={selected ?? ''} onChange={e => onChange?.(e.target.value)}><option value="">请选择</option>{lightOptions.map(x => <option key={x}>{x}</option>)}</select>; }
function Textarea({ value, onChange, placeholder, maxLength, showCount = false }: { value?: string; onChange?: (value: string) => void; placeholder?: string; maxLength?: number; showCount?: boolean }) { const text = value ?? ''; const control = <textarea value={text} placeholder={placeholder} maxLength={maxLength} onChange={e => onChange?.(e.target.value)} />; return showCount ? <div className="textarea-counted">{control}<small>{String(text).length}{maxLength ? ` / ${maxLength}` : ''}</small></div> : control; }
function Section({ title, children, extra }: { title: string; children: ReactNode; extra?: ReactNode }) { return <section className="card section"><div className="section-title"><span>{title}</span>{extra}</div>{children}</section>; }
function Tabs({ items, active, onChange }: { items: string[]; active: string; onChange: (item: string) => void }) { return <div className="tabs">{items.map(item => <button className={active === item ? 'active' : ''} onClick={() => onChange(item)} key={item}>{item}</button>)}</div>; }
function Pagination({ total, pageSize = 10, page, setPage }: { total: number; pageSize?: number; page: number; setPage: (value: number) => void }) { const pages = Math.max(1, Math.ceil(total / pageSize)); return <div className="pagination"><span>共 {total} 条</span><select value={pageSize} onChange={() => undefined}><option>10 条/页</option></select><button disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))}>‹</button>{Array.from({ length: Math.min(pages, 4) }, (_, i) => i + 1).map(p => <button key={p} className={page === p ? 'current' : ''} onClick={() => setPage(p)}>{p}</button>)}<button disabled={page >= pages} onClick={() => setPage(Math.min(pages, page + 1))}>›</button><span>前往</span><input value={page} onChange={e => setPage(Math.min(pages, Math.max(1, Number(e.target.value) || 1)))} /></div>; }
function WorkflowSteps({ steps, current, rejected = false }: { steps: string[]; current: number; rejected?: boolean }) { return <div className="workflow">{steps.map((step, index) => <div key={step} className={`workflow-step ${index < current ? 'done' : index === current ? (rejected ? 'rejected' : 'current') : ''}`}><div className="workflow-dot">{index < current ? '✓' : index + 1}</div><span>{index + 1}. {step}</span></div>)}</div>; }
function OperationHistory({ logs }: { logs: { id: string; action: string; operator: string; time: string; content: string }[] }) { return <div className="timeline">{logs.map(log => <div className="timeline-item" key={log.id}><i /><div><b>{log.action}</b><span>{log.operator} · {log.time}</span><p>{log.content}</p></div></div>)}</div>; }

function InteractiveWorkflow({ definition, instance, selectedNodeId, onSelect }: { definition: WorkflowDefinitionNode[]; instance: WorkflowInstance; selectedNodeId: string; onSelect: (nodeId: string) => void }) {
  const currentIndex = Math.max(0, definition.findIndex(node => node.id === instance.currentNodeId));
  return <div className="workflow workflow-interactive">{definition.map((node, index) => {
    const records = instance.records.filter(record => record.nodeId === node.id);
    const latest = records[records.length - 1];
    const completed = records.some(record => record.status === '已完成' || record.status === '已关闭' || record.status === '已跳过');
    const returned = latest?.status === '已退回';
    const enabled = index <= currentIndex || records.length > 0;
    return <button type="button" disabled={!enabled} key={node.id} className={'workflow-step ' + (completed ? 'done ' : '') + (index === currentIndex ? 'current ' : '') + (returned ? 'rejected ' : '') + (selectedNodeId === node.id ? 'selected' : '')} onClick={() => enabled && onSelect(node.id)}>
      <div className="workflow-dot">{completed ? '✓' : index + 1}</div><span>{index + 1}. {node.name}</span>
      {latest && <small>{latest.handler} · {latest.submittedAt}</small>}
    </button>;
  })}</div>;
}

function WorkflowFeedbackOverview({ definition, instance, role, institution, selectedNodeId, onReturnCurrent }: { definition: WorkflowDefinitionNode[]; instance: WorkflowInstance; role: Role; institution: string; selectedNodeId: string; onReturnCurrent: () => void }) {
  const order = new Map(definition.map((node, index) => [node.id, index]));
  const records = instance.records.filter(record => canViewWorkflowRecord(role, institution, record)).sort((a, b) => (order.get(a.nodeId) || 0) - (order.get(b.nodeId) || 0) || a.iteration - b.iteration);
  return <Section title="处理反馈总览" extra={selectedNodeId !== instance.currentNodeId ? <Button variant="secondary" onClick={onReturnCurrent}>返回当前节点</Button> : undefined}>
    <div className="workflow-feedback-list">{records.map(record => <article className={'workflow-feedback-card ' + (record.nodeId === selectedNodeId ? 'selected' : '')} key={record.id}>
      <div className="workflow-feedback-head"><div><span>节点 {(order.get(record.nodeId) || 0) + 1}</span><b>{record.nodeName}{record.iteration > 1 ? ' · 第' + record.iteration + '次' : ''}</b></div><StatusTag value={record.status} /></div>
      <div className="workflow-feedback-meta"><span>处理部门：{record.department}</span><span>处理角色：{record.role}</span><span>处理人：{record.handler}</span><span>处理时间：{record.submittedAt}</span><span>处理结果：{record.result}</span></div>
      <div className="workflow-form-snapshot">{Object.entries(record.formData).map(([label, value]) => <div key={label}><b>{label}</b><p>{value || '—'}</p></div>)}</div>
      {record.opinion && <div className="workflow-opinion"><b>审批意见</b><span>{record.opinion}</span></div>}
      {record.returnReason && <div className="workflow-return"><b>退回原因</b><span>{record.returnReason}</span></div>}
      <div className="workflow-record-foot"><span>操作：{record.action}</span><span>附件：{record.attachments.length ? record.attachments.map(file => file.name + '（' + formatSize(file.size) + '）').join('、') : '无'}</span></div>
    </article>)}</div>
    {!records.length && <div className="inline-empty">当前尚无已提交节点记录</div>}
  </Section>;
}
function FileUploader({ files, onChange, multiple = true }: { files: Attachment[]; onChange: (files: Attachment[]) => void; multiple?: boolean }) { const onFiles = (e: ChangeEvent<HTMLInputElement>) => { const list = Array.from(e.target.files || []).map(makeAttachment); onChange(multiple ? [...files, ...list] : list.slice(0, 1)); e.target.value = ''; }; const remove = (id: string) => onChange(files.filter(x => x.id !== id)); return <div className="file-uploader"><label className="upload-drop"><input type="file" multiple={multiple} onChange={onFiles} /><span className="upload-icon">⇧</span><b>点击上传或拖拽文件至此</b><small>支持 PDF、Word、Excel、图片等格式</small></label>{files.length > 0 && <div className="file-list">{files.map(file => <div className="file-row" key={file.id}><span>▣ {file.name}</span><small>{formatSize(file.size)} · {file.uploadedAt}</small><div><Button variant="text" onClick={() => downloadText(file.name + '.txt', `文件：${file.name}\n类型：${file.type}\n大小：${formatSize(file.size)}`)}>下载</Button><Button variant="text" onClick={() => remove(file.id)}>删除</Button></div></div>)}</div>}</div>; }
function EmptyModulePage({ title }: { title: string }) { return <Page title={title} breadcrumb={['其他模块', title]}><div className="empty-state"><div className="empty-icon">▧</div><h2>该模块详细设计见其他需求说明</h2><p>需求书 4.7–4.11 未提供字段及操作规则，当前保留统一菜单入口。</p></div></Page>; }
const isModalRoute = (path: string) => { const listRoutes = ['/warning/risk-preference', '/warning/rules', '/warning/disposal', '/indicators/maintenance', '/indicators/versions', '/indicators/query', '/indicators/latest-status', '/major-events', '/major-events/definitions', '/reports', '/periodic-reports', '/special-risks/drafts', '/special-risks/manage', '/special-risks/feedback']; return path !== '/dashboard' && path !== '/workbench' && !listRoutes.includes(path) && (path.endsWith('/new') || path.endsWith('/edit') || path.includes('/config') || path.includes('/approve') || path.includes('/submissions') || !!path.match(/^\/(warning|indicators|major-events|reports|periodic-reports|special-risks)\/[^/]+/)); };
const migratedPageTitles: Record<string, string> = { '风险偏好及目标': '风险偏好方案管理', '风险预警规则管理': '风险限额预警模型', '预警提示与处置': '风险预警处置管理', '指标新增与维护': '监测指标管理', '报表与分析中心': '报表中心', '定期风险报告管理': '定期风险报告' };
function Page({ title, breadcrumb, children, actions, onClose, inline = false, hidePageTitle = false }: { title: string; breadcrumb: string[]; children: ReactNode; actions?: ReactNode; onClose?: () => void; inline?: boolean; hidePageTitle?: boolean }) { const displayTitle = migratedPageTitles[title] || title; const displayBreadcrumb = breadcrumb.map(item => migratedPageTitles[item] || item); const description = pageDescriptions[title]; const content = <><div className="breadcrumb">集团并表管理系统 <span>›</span> {displayBreadcrumb.join(' › ')}</div>{!hidePageTitle && <div className="page-title"><div className="page-title-copy"><h1>{displayTitle}</h1>{description && <p>{description}</p>}</div><div className="page-title-actions">{actions}</div></div>}{children}</>; if (inline || !isModalRoute(window.location.pathname)) return content; return <div className="modal-mask route-modal-mask"><div className="modal route-modal"><div className="route-modal-caption"><b>{displayTitle}</b><button aria-label="关闭" title="关闭" onClick={onClose || (() => window.history.back())}>×</button></div><div className="route-modal-body">{content}</div></div></div>; }
function Table({ children }: { children: ReactNode }) { return <div className="table-wrap"><table>{children}</table></div>; }
function Modal({ title, children, onClose, footer }: { title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) { return <div className="modal-mask"><div className="modal"><div className="modal-title"><b>{title}</b><button onClick={onClose}>×</button></div><div className="modal-body">{children}</div>{footer && <div className="modal-footer">{footer}</div>}</div></div>; }

type AiFeatureName = 'AI风险报告生成' | 'AI智能问数' | 'AI辅助报送';

function AiFeatureEntry({ name }: { name: AiFeatureName }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <>
    <Button onClick={() => setOpen(true)}>{name}</Button>
    {open && <Modal title={name} onClose={close} footer={<Button variant="secondary" onClick={close}>关闭</Button>}><div className="modal-note">详细功能待后续开发</div></Modal>}
  </>;
}

const roleDescriptions: Record<Role, string> = {
  集团: '查看集团整体风险情况，开展事项审核、管理协调、跟踪处置及管理层审阅。',
  金控公司: '开展方案配置、规则维护、日常并表管理、业务审核和汇总管理。',
  各金融机构: '开展本机构数据报送、意见反馈、事件报告及风险处置。',
};

function LoginPage({ initialRole, onLogin }: { initialRole: Role | null; onLogin: (role: Role) => void }) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(initialRole);
  return <main className="login-page">
    <div className="login-shell">
      <section className="login-intro" aria-label="系统信息">
        <span className="login-brand-mark">▥</span>
        <div><h1>集团并表管理系统</h1><p>风险并表板块</p></div>
      </section>
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card-head"><h2 id="login-title">系统登录</h2><p>请选择当前登录角色进入系统</p></div>
        <div className="login-role-grid" role="radiogroup" aria-label="登录角色">
          {roleLabels.map(item => <button type="button" role="radio" aria-checked={selectedRole === item} className={`login-role-card ${selectedRole === item ? 'selected' : ''}`} key={item} onClick={() => setSelectedRole(item)}>
            <span className="login-role-check">{selectedRole === item ? '✓' : ''}</span>
            <b>{item}</b>
            <small>{roleDescriptions[item]}</small>
          </button>)}
        </div>
        <div className="login-submit"><Button disabled={!selectedRole} onClick={() => selectedRole && onLogin(selectedRole)}>登录系统</Button></div>
        <p className="login-demo-note">本系统为功能演示环境，页面数据均为模拟数据</p>
      </section>
    </div>
  </main>;
}

function Header({ path, role, setRole, onReset, onLogout }: { path: string; role: Role; setRole: (role: Role) => void; onReset: () => void; onLogout: () => void }) { const managementWorkbench = path === '/workbench' && role !== '各金融机构'; const institutionWorkbench = path === '/workbench' && role === '各金融机构'; return <header className="app-header"><div className="brand"><span className="brand-mark">▥</span><span className="brand-copy"><b>{managementWorkbench ? '金控并表管理工作台' : institutionWorkbench ? `金融机构工作台（${currentInstitution}）` : '集团并表管理系统'}</b></span></div><div className="header-date">▣ 2024-06-30　13:22:45　 星期日</div><div className="header-right"><span className="bell">♧<i>12</i></span><span>?</span><span className="divider" /><span>{role === '各金融机构' ? currentInstitution : '集团并表范围'}⌄</span><label className="role-switch"><span>当前演示角色</span><select value={role} onChange={e => setRole(e.target.value as Role)}>{roleLabels.map(x => <option key={x}>{x}</option>)}</select></label><button className="reset-demo" onClick={onReset}>恢复演示数据</button><span className="avatar">张</span><span>张三</span><Button variant="text" onClick={onLogout}>退出登录</Button></div></header>; }

type MenuItem = { label: string; path?: string; icon?: string; roles?: Role[]; queryOnlyFor?: Role[]; children?: MenuItem[] };
const menus: MenuItem[] = [
  { label: '首页', icon: '⌂', path: '/workbench' },
  { label: '驾驶舱', icon: '◩', path: '/cockpit' },
  { label: '风险偏好管理', icon: '◇', children: [
    { label: '风险偏好方案管理', path: '/warning/risk-preference', queryOnlyFor: ['各金融机构'] },
  ] },
  { label: '风险限额管理', icon: '▥', children: [
    { label: '风险限额方案管理', path: '/limits/schemes' },
    { label: '风险限额倒查', path: '/limits/backtrack' },
  ] },
  { label: '风险指标管理', icon: '▤', children: [
    { label: '监测指标管理', path: '/indicators/maintenance', queryOnlyFor: ['各金融机构'] },
    { label: '报表管理', children: [
      { label: '报表中心', path: '/reports', roles: ['集团', '金控公司'] },
      { label: '风险看板', path: '/dashboard', roles: ['集团'] },
      { label: '资本看板', path: '/empty/capital-board', roles: ['集团', '金控公司'] },
    ] },
  ] },
  { label: '风险预警与处置', icon: '★', children: [
    { label: '风险限额预警模型', path: '/warning/rules', roles: ['集团', '金控公司'] },
    { label: '风险预警处置管理', path: '/warning/disposal' },
  ] },
  { label: '风险报告管理', icon: '▧', children: [
    { label: '定期风险报告', path: '/periodic-reports', roles: ['集团', '金控公司'] },
    { label: '重大风险事件报告', path: '/major-events' },
  ] },
  { label: '知识库管理', icon: '▣', roles: ['集团', '金控公司'], children: [
    { label: '制度库', path: '/empty/policy-library' },
    { label: '法人治理', path: '/empty/corporate-governance' },
  ] },
  { label: '数据管理', icon: '▦', roles: ['集团', '金控公司'], children: [
    { label: '数据收集', path: '/empty/data-collection' },
    { label: '数据质量管理', path: '/empty/data-quality' },
  ] },
  { label: 'AI应用', icon: 'AI', path: '/ai-assistant' },
  { label: '基础与系统管理', icon: '⚙', path: '/empty/system', roles: ['集团', '金控公司'] },
];
const visibleMenuItems = (items: MenuItem[], role: Role): MenuItem[] => items
  .filter(item => !item.roles || item.roles.includes(role))
  .map(item => ({ ...item, children: item.children ? visibleMenuItems(item.children, role) : undefined }))
  .filter(item => !!item.path || !!item.children?.length);
const menuPathActive = (item: MenuItem, path: string): boolean => !!item.path && (path === item.path || path.startsWith(item.path + '/'));
const menuBranchActive = (item: MenuItem, path: string): boolean => menuPathActive(item, path) || !!item.children?.some(child => menuBranchActive(child, path));
const flattenMenus = (items: MenuItem[]): MenuItem[] => items.flatMap(item => [item, ...flattenMenus(item.children || [])]);

function Sidebar({ path, role, navigate }: { path: string; role: Role; navigate: (path: string) => void }) {
  const roleMenus = visibleMenuItems(menus, role);
  const initiallyOpen = flattenMenus(roleMenus).filter(item => item.children?.length && menuBranchActive(item, path)).map(item => item.label);
  const [open, setOpen] = useState<string[]>(initiallyOpen);
  useEffect(() => {
    const activeBranches = flattenMenus(roleMenus).filter(item => item.children?.length && menuBranchActive(item, path)).map(item => item.label);
    setOpen(value => [...new Set([...value, ...activeBranches])]);
  }, [path, role]);
  const toggle = (label: string) => setOpen(value => value.includes(label) ? value.filter(item => item !== label) : [...value, label]);
  const renderItems = (items: MenuItem[], depth = 0): ReactNode => items.map(item => {
    const children = item.children || [];
    const active = menuBranchActive(item, path);
    const expanded = open.includes(item.label);
    const queryOnly = item.queryOnlyFor?.includes(role);
    return <div className={`menu-item depth-${depth}`} key={`${depth}-${item.label}`}>
      <button className={`${depth === 0 ? 'menu-root' : 'menu-child'} ${active ? depth === 0 ? 'active-root' : 'active-child' : ''} ${children.length ? 'has-children' : ''}`} onClick={() => children.length ? toggle(item.label) : item.path && navigate(item.path)}>
        {depth === 0 && <Icon>{item.icon}</Icon>}<span>{item.label}</span>{queryOnly && <small>仅查询</small>}{children.length > 0 && <em>{expanded ? '⌃' : '⌄'}</em>}
      </button>
      {children.length > 0 && expanded && <div className={`menu-children level-${depth + 1}`}>{renderItems(children, depth + 1)}</div>}
    </div>;
  });
  return <aside className="sidebar">{renderItems(roleMenus)}</aside>;
}

const authStorageKey = 'demo-authenticated';
const roleStorageKey = 'demo-role';

type DemoSession = { authenticated: boolean; role: Role; loginRole: Role | null };

function readDemoSession(): DemoSession {
  const rawRole = localStorage.getItem(roleStorageKey);
  const storedRole = resolveStoredRole(rawRole);
  const authenticated = localStorage.getItem(authStorageKey) === 'true';
  if (rawRole && !storedRole) {
    localStorage.removeItem(roleStorageKey);
    localStorage.removeItem(authStorageKey);
  }
  if (authenticated && !storedRole) localStorage.removeItem(authStorageKey);
  if (storedRole && rawRole !== storedRole) localStorage.setItem(roleStorageKey, storedRole);
  return { authenticated: authenticated && !!storedRole, role: storedRole || '金控公司', loginRole: storedRole };
}

function canAccessRouteForRole(role: Role, path: string) {
  if (path === '/cockpit') return true;
  if (path === '/group-dashboard') return role !== '各金融机构';
  if (path === '/dashboard' || path.startsWith('/dashboard/')) return role === '集团';
  if (path === '/reports' || path.startsWith('/reports/')) return role !== '各金融机构';
  if (path === '/periodic-reports' || path.startsWith('/periodic-reports/')) return role !== '各金融机构';
  if (path === '/warning/rules' || path.startsWith('/warning/rules/')) return role !== '各金融机构';
  if (['/empty/capital-board', '/empty/policy-library', '/empty/corporate-governance', '/empty/data-collection', '/empty/data-quality', '/empty/system'].includes(path)) return role !== '各金融机构';
  if (path.startsWith('/concentration-monitoring')) return canViewConcentrationMonitoring(role);
  if (path.startsWith('/warning/risk-preference')) {
    if (!canAccessRiskPreference(role)) return false;
    if (path === '/warning/risk-preference/new' || path.endsWith('/edit')) return can(role, 'preference-create');
    return true;
  }
  if (/^\/warning\/rules\/[^/]+\/approve$/.test(path)) return can(role, 'rule-approve');
  if (path === '/warning/rules/new/config' || /^\/warning\/rules\/[^/]+\/config\/edit$/.test(path)) return canEditWarningRuleConfig(role);
  if (path === '/indicators/maintenance/new') return canCreateIndicator(role);
  if (path.startsWith('/major-events/definitions/') && (path.endsWith('/new') || path.endsWith('/edit'))) return canManageMajorEventDefinitions(role);
  if (path === '/major-events/new' || /^\/major-events\/[^/]+\/edit$/.test(path)) return can(role, 'event-create');
  if (/^\/major-events\/[^/]+\/(follow-up|final-report)$/.test(path)) return can(role, 'event-progress');
  if (path === '/reports/upload' || path.endsWith('/submissions')) return false;
  if (path === '/special-risks/new') return can(role, 'special-create');
  if (/^\/special-risks\/feedback\/[^/]+\/evaluate$/.test(path)) return canHandleWorkflowNode(role, 'special-review', currentInstitution);
  if (/^\/special-risks\/feedback\/[^/]+$/.test(path)) return canHandleWorkflowNode(role, 'special-feedback', currentInstitution);
  return true;
}

function App() {
  const { path, navigate, replace } = useRouter();
  const { state: completeState, update, reset } = useAppState();
  const [session, setSession] = useState<DemoSession>(readDemoSession);
  const { authenticated, role, loginRole } = session;
  const state = scopeStateForRole(completeState, role);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!authenticated && path !== '/login') return replace('/login');
    if (authenticated && (path === '/' || path === '/login')) replace(getDefaultRouteForRole(role));
    if (authenticated && path === '/indicators/latest-status') return replace('/indicators/query');
    if (authenticated && path.startsWith('/reports/indicator/')) return replace(path.replace('/reports/indicator/', '/indicators/query/'));
    if (authenticated && path !== '/' && path !== '/login' && !canAccessRouteForRole(role, path)) replace(getDefaultRouteForRole(role));
  }, [authenticated, path, role]);
  const operator = role;
  const toast = (message: string) => setNotice(message);
  const changeRole = (nextRole: Role) => {
    localStorage.setItem(roleStorageKey, nextRole);
    setSession(current => ({ ...current, role: nextRole, loginRole: nextRole }));
    if (!canAccessRouteForRole(nextRole, path)) navigate(getDefaultRouteForRole(nextRole));
  };
  const login = (selectedRole: Role) => {
    localStorage.setItem(authStorageKey, 'true');
    localStorage.setItem(roleStorageKey, selectedRole);
    setSession({ authenticated: true, role: selectedRole, loginRole: selectedRole });
    navigate(getDefaultRouteForRole(selectedRole));
  };
  const logout = () => {
    localStorage.removeItem(authStorageKey);
    setSession(current => ({ ...current, authenticated: false, loginRole: current.role }));
    navigate('/login');
  };
  const goBack = () => navigate('/warning/risk-preference');
  const render = () => {
    if (path === '/cockpit') return role === '各金融机构' ? <InstitutionCockpit navigate={navigate} /> : <GroupDashboard navigate={navigate} />;
    if (path === '/group-dashboard') return <GroupDashboard navigate={navigate} />;
    if (path === '/dashboard' || path.startsWith('/dashboard/institution/')) return <DashboardCockpit state={state} role={role} institutionId={path.split('/')[3]} navigate={navigate} update={update} toast={toast} />;
    if (path === '/workbench') return role === '各金融机构' ? <InstitutionWorkbench state={state} role={role} navigate={navigate} /> : <ManagementWorkbench state={state} role={role} navigate={navigate} />;
    if (path === '/institutions') return <InstitutionList state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.startsWith('/institutions/')) return <InstitutionDetail state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/limits/schemes') return <EmptyModulePage title="风险限额方案管理" />;
    if (path === '/limits/backtrack') return <IndicatorQuery state={state} role={role} navigate={navigate} update={update} toast={toast} title="风险限额倒查" />;
    if (path === '/ai-assistant') return <AiApplicationPage role={role} path={path} />;
    if (path.includes('/empty/')) return <EmptyModulePage title={flattenMenus(menus).find(item => item.path === path)?.label || '模块占位页'} />;
    if (path === '/warning/risk-preference') return <RiskPreferenceList state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.endsWith('/new') && path.startsWith('/warning/risk-preference')) return <RiskPreferenceEditor state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.startsWith('/warning/risk-preference/')) return <RiskPreferenceDetail state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/warning/rules') return <WarningRules state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.match(/^\/warning\/rules\/[^/]+\/approve$/)) return <RuleApprove state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/warning/rules/new/config' || path.match(/^\/warning\/rules\/[^/]+\/config\/edit$/)) return <RuleConfig state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.match(/^\/warning\/rules\/[^/]+\/config$/)) return <RuleConfigView state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/warning/disposal') return <WarningDisposalList state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.match(/^\/warning\/disposal\/[^/]+\/detail\/[^/]+$/)) return <WarningDisposalDetail state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.match(/^\/warning\/disposal\/[^/]+\/overview$/) || path.match(/^\/warning\/disposal\/[^/]+$/)) return <WarningDisposalOverview state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/concentration-monitoring') return <ConcentrationOverview state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.match(/^\/concentration-monitoring\/[^/]+\/[^/]+\/details$/)) return <ConcentrationBusinessDetailsPage state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.match(/^\/concentration-monitoring\/[^/]+\/[^/]+$/)) return <ConcentrationAnalysisPage state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.match(/^\/concentration-monitoring\/[^/]+$/)) return <ConcentrationSummaryPage state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/indicators/maintenance') return <IndicatorList state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/indicators/versions') return <IndicatorVersions state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/indicators/query' || path === '/indicators/latest-status') return <IndicatorQuery state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.startsWith('/indicators/query/') || path.startsWith('/reports/indicator/')) return <IndicatorHistoryDetail state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.startsWith('/indicators/maintenance/')) return <IndicatorEditor state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/major-events/definitions') return <MajorEventDefinitions state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/major-events/definitions/new' || path.match(/^\/major-events\/definitions\/[^/]+\/edit$/)) return <MajorEventDefinitionEditor state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.startsWith('/major-events/definitions/')) return <MajorEventDefinitionDetail state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/major-events') return <MajorEventList state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/major-events/new' || path.match(/^\/major-events\/[^/]+\/edit$/)) return <MajorEventEditor state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.match(/^\/major-events\/[^/]+\/nodes\/[^/]+$/)) return <MajorEventDetail state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.match(/^\/major-events\/[^/]+\/overview$/) || path.match(/^\/major-events\/[^/]+$/)) return <MajorEventOverview state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.endsWith('/follow-up') || path.endsWith('/final-report')) return <MajorEventOverview state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/reports') return <ReportAnalysisCenter state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/reports/upload') return <ReportUpload state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.endsWith('/submissions')) return <ReportSubmissions state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/periodic-reports') return <PeriodicReports state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/periodic-reports/upload' || path.endsWith('/edit')) return <PeriodicReportEditor state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/special-risks/drafts') return <SpecialRiskDrafts state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/special-risks/new') return <SpecialRiskEditor state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/special-risks/manage') return <SpecialRiskManage state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.startsWith('/special-risks/manage/')) return <SpecialRiskView state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path === '/special-risks/feedback') return <SpecialRiskFeedbackList state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.endsWith('/evaluate')) return <SpecialRiskEvaluate state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    if (path.startsWith('/special-risks/feedback/')) return <SpecialRiskFeedback state={state} role={role} navigate={navigate} update={update} toast={toast} />;
    return <RiskPreferenceList state={state} role={role} navigate={navigate} update={update} toast={toast} />;
  };
  if (!authenticated) return <><LoginPage initialRole={loginRole} onLogin={login} /><SmartAssistant role={role} path={path} /></>;
  if (path === '/' || path === '/login') return <SmartAssistant role={role} path={path} />;
  return <div className="app"><Header path={path} role={role} setRole={changeRole} onReset={() => { reset(); toast('演示数据已恢复'); }} onLogout={logout} /><Sidebar path={path} role={role} navigate={navigate} /><main className="content">{render()}</main>{notice && <Modal title="操作提示" onClose={() => setNotice(null)} footer={<Button variant="secondary" onClick={() => setNotice(null)}>关闭</Button>}><div className="modal-note">{notice}</div></Modal>}{path !== '/ai-assistant' && <SmartAssistant role={role} path={path} />}</div>;
}

function InstitutionCockpit({ navigate }: { navigate: (path: string) => void }) {
  const source = `/institution-cockpit/index.html?name=${encodeURIComponent(currentInstitution)}`;
  return <div className="institution-cockpit-host"><iframe title={`${currentInstitution}金融机构驾驶舱`} src={source} /><button className="institution-cockpit-back" onClick={() => navigate('/workbench')}>‹ 返回工作台</button></div>;
}

function AiApplicationPage({ role, path }: { role: Role; path: string }) {
  return <Page title="AI应用" breadcrumb={['AI应用']}><div className="ai-application-page"><SmartAssistant role={role} path={path} embedded /></div></Page>;
}

type PageProps = { state: DemoState; role: Role; navigate: (path: string) => void; update: (fn: (state: DemoState) => void) => void; toast: (message: string) => void };
const TextAction = ({ children, onClick, disabled = false }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) => <button className="text-action" disabled={disabled} onClick={onClick}>{children}</button>;
const permitted = (role: Role, action: string) => can(role, action);

type ManagementTask = { name: string; status: string; institution: string; path: string };
type ManagementRiskItem = { name?: string; indicator?: string; institution: string; risk: string; path: string };
type FocusedDataItem = { institution?: string; indicator: string; value: string; path: string };
type SubmissionTone = 'blue' | 'orange' | 'green' | 'slate';
type SubmissionItem = { institution?: string; period?: string; content: string; status: string; tone: SubmissionTone; path: string };
type Sentiment = 'positive' | 'neutral' | 'negative';
type SentimentItem = { institution: string; sentiment: Sentiment; importanceLevel: 1 | 2 | 3 | 4 | 5 | null; title: string; publishTime: string; summary: string; riskType: string; exposure: string; exposureRatio: string; rank: string };

function ManagementSectionTitle({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return <div className="mgmt-section-title"><div><h2>{title}</h2>{note && <span>{note}</span>}</div>{action}</div>;
}

function FocusedDataTicker({ items, showInstitution, navigate }: { items: FocusedDataItem[]; showInstitution: boolean; navigate: (path: string) => void }) {
  const [configOpen, setConfigOpen] = useState(false);
  const [institution, setInstitution] = useState(showInstitution ? '浦发银行' : currentInstitution);
  const [indicator, setIndicator] = useState(items[0]?.indicator || '流动性覆盖率');
  const repeated = [...items, ...items];
  return <>
    <section className="mgmt-panel mgmt-focus-strip">
      <div className="mgmt-focus-label"><span><WorkspaceGlyph name="chart" /></span><b>重点关注数据</b></div>
      <div className="mgmt-focus-viewport" aria-label="重点关注数据，鼠标悬停暂停滚动"><div className="mgmt-focus-track">{repeated.map((item, index) => <button key={`${item.institution || 'self'}-${item.indicator}-${index}`} onClick={() => navigate(item.path)}>{showInstitution && <strong>{item.institution}</strong>}{showInstitution && <i /> }<span>{item.indicator}</span><i /><em>{item.value}</em></button>)}</div></div>
      <button className="mgmt-focus-config" onClick={() => setConfigOpen(true)}>⚙ 自定义配置</button>
    </section>
    {configOpen && <Modal title="自定义重点关注数据" onClose={() => setConfigOpen(false)} footer={<><Button variant="secondary" onClick={() => setConfigOpen(false)}>取消</Button><Button onClick={() => setConfigOpen(false)}>保存配置</Button></>}><div className="ticker-config-grid">{showInstitution && <Field label="机构"><Select value={institution} onChange={setInstitution} options={['浦发银行', '国际AMC', '上农商', '国泰海通']} /></Field>}<Field label="指标"><Select value={indicator} onChange={setIndicator} options={[...new Set(items.map(item => item.indicator))]} /></Field></div><div className="modal-note">当前为 DEMO 配置，保存后将“{showInstitution ? `${institution} · ` : ''}{indicator}”加入重点关注。</div></Modal>}
  </>;
}

function SubmissionStatusTag({ label, tone }: { label: string; tone: SubmissionTone }) {
  return <i className={`mgmt-submission-status ${tone}`}>{label}</i>;
}

function SubmissionList({ items, showInstitution, showPeriod, navigate }: { items: SubmissionItem[]; showInstitution: boolean; showPeriod: boolean; navigate: (path: string) => void }) {
  return <div className={`mgmt-submission-table ${showInstitution ? 'with-institution' : ''} ${showPeriod ? 'with-period' : ''}`}>
    <div className="mgmt-submission-head">{showInstitution && <span>报送机构</span>}{showPeriod && <span>报送期次</span>}<span>报送内容</span><span>报送状态</span><span>操作</span></div>
    {items.map((item, index) => <button className="mgmt-submission-row" key={`${item.institution || item.period}-${index}`} onClick={() => navigate(item.path)}>{showInstitution && <span>{item.institution}</span>}{showPeriod && <span>{item.period}</span>}<span title={item.content}>{item.content}</span><span><SubmissionStatusTag label={item.status} tone={item.tone} /></span><em>查看</em></button>)}
  </div>;
}

function SentimentMonitor({ items, showInstitution }: { items: SentimentItem[]; showInstitution: boolean }) {
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<SentimentItem | null>(null);
  useEffect(() => {
    if (paused || items.length <= 3) return;
    const timer = window.setInterval(() => setStart(value => (value + 3) % items.length), 3000);
    return () => window.clearInterval(timer);
  }, [paused, items.length]);
  const visible = Array.from({ length: Math.min(3, items.length) }, (_, index) => items[(start + index) % items.length]);
  const sentimentLabel = (item: SentimentItem) => item.sentiment === 'positive' ? '正面' : item.sentiment === 'neutral' ? '中性' : `负面 · ${item.importanceLevel}级`;
  return <>
    <div className={`mgmt-sentiment-list ${showInstitution ? 'with-institution' : 'institution-scope'}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>{visible.map((item, index) => <button key={`${item.title}-${start}-${index}`} onClick={() => setSelected(item)}>{showInstitution && <span className="mgmt-sentiment-institution">{item.institution}</span>}<span className={`mgmt-sentiment-tag sentiment-${item.sentiment} ${item.sentiment === 'negative' ? `importance-${item.importanceLevel}` : ''}`}>{sentimentLabel(item)}</span><strong title={item.title}>{item.title}</strong><time><span>{item.publishTime.slice(5, 10)}</span><small>{item.publishTime.slice(11, 16)}</small></time></button>)}</div>
    {selected && <Modal title="舆情详情" onClose={() => setSelected(null)} footer={<Button variant="secondary" onClick={() => setSelected(null)}>关闭</Button>}><div className="sentiment-detail"><h3>{selected.title}</h3><p>{selected.summary}</p><div><b>发布时间<span>{selected.publishTime}</span></b><b>涉及主体<span>{selected.institution}</span></b><b>舆情倾向<span>{sentimentLabel(selected)}</span></b>{selected.sentiment === 'negative' && <b>重要等级<span>{selected.importanceLevel}级</span></b>}<b>风险类型<span>{selected.riskType}</span></b><b>敞口金额<span>{selected.exposure}</span></b><b>敞口占比<span>{selected.exposureRatio}</span></b><b>集中度排名<span>{selected.rank}</span></b></div></div></Modal>}
  </>;
}

const managementSentiments: SentimentItem[] = [
  { institution: '浦发银行', sentiment: 'positive', importanceLevel: null, title: '绿色金融项目投放获得市场积极评价', publishTime: '2024-06-30 10:26', summary: '公开信息显示，相关绿色金融项目投放保持稳健，市场评价积极。', riskType: '声誉风险', exposure: '8.6亿元', exposureRatio: '1.8%', rank: '第4位' },
  { institution: '国泰海通', sentiment: 'neutral', importanceLevel: null, title: '证券行业两融余额出现阶段性波动', publishTime: '2024-06-30 09:18', summary: '行业两融余额近期有所波动，对公司整体经营影响仍需持续观察。', riskType: '市场风险', exposure: '5.1亿元', exposureRatio: '1.1%', rank: '第6位' },
  { institution: '国际AMC', sentiment: 'negative', importanceLevel: 1, title: '重点项目偿付安排受到市场高度关注', publishTime: '2024-06-29 18:42', summary: '重点项目偿付安排受到市场高度关注，需及时评估回收计划与潜在损失。', riskType: '信用风险', exposure: '21.6亿元', exposureRatio: '5.3%', rank: '第1位' },
  { institution: '上农商', sentiment: 'negative', importanceLevel: 4, title: '区域中小银行资产质量受到市场关注', publishTime: '2024-06-29 15:06', summary: '部分区域中小企业经营承压，建议关注相关授信客户还款能力变化。', riskType: '信用风险', exposure: '9.8亿元', exposureRatio: '2.6%', rank: '第3位' },
  { institution: '浦发银行', sentiment: 'neutral', importanceLevel: null, title: '核心系统升级相关信息正式发布', publishTime: '2024-06-28 22:15', summary: '核心系统按计划完成升级，相关运行情况保持平稳。', riskType: '信息科技风险', exposure: '—', exposureRatio: '—', rank: '—' },
  { institution: '国际AMC', sentiment: 'positive', importanceLevel: null, title: '存量资产处置取得阶段性进展', publishTime: '2024-06-28 16:34', summary: '存量资产处置取得阶段性进展，回款安排符合当前计划。', riskType: '市场风险', exposure: '12.4亿元', exposureRatio: '3.2%', rank: '第2位' },
  { institution: '国泰海通', sentiment: 'negative', importanceLevel: 2, title: '核心交易对手信用风险敞口有所上升', publishTime: '2024-06-28 10:20', summary: '核心交易对手信用风险敞口有所上升，建议加强限额监测。', riskType: '信用风险', exposure: '16.2亿元', exposureRatio: '4.1%', rank: '第2位' },
  { institution: '浦发银行', sentiment: 'negative', importanceLevel: 3, title: '重点行业客户经营指标出现波动', publishTime: '2024-06-27 14:05', summary: '重点行业客户经营指标出现波动，暂未形成实质性损失。', riskType: '信用风险', exposure: '7.5亿元', exposureRatio: '1.9%', rank: '第5位' },
  { institution: '上农商', sentiment: 'negative', importanceLevel: 5, title: '个别网点服务投诉引发局部讨论', publishTime: '2024-06-27 09:40', summary: '个别网点服务投诉引发局部讨论，影响范围较小。', riskType: '声誉风险', exposure: '—', exposureRatio: '—', rank: '—' },
];

function ManagementWorkbench({ state, role, navigate }: { state: DemoState; role: Role; navigate: (path: string) => void }) {
  const [riskPage, setRiskPage] = useState(0);
  const [riskPaused, setRiskPaused] = useState(false);
  const [portraitPeriod, setPortraitPeriod] = useState(0);
  useEffect(() => { if (riskPaused) return; const timer = window.setInterval(() => setRiskPage(page => (page + 1) % 2), 4000); return () => window.clearInterval(timer); }, [riskPaused]);

  const warningPath = (level: '红灯' | '黄灯') => {
    const item = state.warningDisposals.find(candidate => candidate.level === level);
    return item ? `/warning/disposal/${item.id}/overview` : '/warning/disposal';
  };
  const eventPath = state.majorEvents[0] ? `/major-events/${state.majorEvents[0].id}/overview` : '/major-events';
  const archivedEventPath = state.majorEvents[1] ? `/major-events/${state.majorEvents[1].id}/overview` : '/major-events';
  const tasks: ManagementTask[] = [
    { name: '限额指标运行情况报告审阅', status: '待审阅', institution: '国泰海通', path: '/reports' },
    { name: '重大风险事件报告核实', status: '待核实', institution: '国际AMC', path: eventPath },
    { name: '处置进展跟踪', status: '处置中', institution: '国际AMC', path: eventPath },
    { name: '预警处置方案审阅', status: '待审阅', institution: '上农商', path: warningPath('红灯') },
    { name: '限额指标重检申请审阅', status: '待审阅', institution: '浦发银行', path: '/indicators/query' },
  ];
  const redGroups: ManagementRiskItem[][] = [
    [
      { institution: '国泰海通', risk: '市场风险', indicator: '资产负债率', path: warningPath('红灯') },
      { institution: '浦发银行', risk: '流动性风险', indicator: '净稳定资金比率', path: warningPath('红灯') },
      { institution: '上农商', risk: '资本风险', indicator: '资本充足率', path: warningPath('红灯') },
    ],
    [
      { institution: '国际AMC', risk: '信用风险', indicator: '异常类资产占比', path: warningPath('红灯') },
      { institution: '上农商', risk: '集中度风险', indicator: '单一客户投融资集中度', path: warningPath('红灯') },
      { institution: '国泰海通', risk: '操作风险', indicator: '重大操作风险事件数量', path: warningPath('红灯') },
    ],
  ];
  const yellowGroups: ManagementRiskItem[][] = [
    [
      { institution: '国际AMC', risk: '信用风险', indicator: '资产拨备率', path: warningPath('黄灯') },
      { institution: '上农商', risk: '集中度风险', indicator: '单一集团客户投融资集中度', path: warningPath('黄灯') },
      { institution: '国泰海通', risk: '操作风险', indicator: '重大操作风险事件数量', path: warningPath('黄灯') },
    ],
    [
      { institution: '浦发银行', risk: '流动性风险', indicator: '流动性比例', path: warningPath('黄灯') },
      { institution: '国泰海通', risk: '市场风险', indicator: '财务杠杆率', path: warningPath('黄灯') },
      { institution: '上农商', risk: '声誉风险', indicator: '重大声誉风险事件数量', path: warningPath('黄灯') },
    ],
  ];
  const eventGroups: ManagementRiskItem[][] = [
    [
      { name: '某项目重大合规风险', institution: '国泰海通', risk: '合规风险', path: eventPath },
      { name: '信息系统异常事件', institution: '国际AMC', risk: '信息科技风险', path: archivedEventPath },
      { name: '重大诉讼事项', institution: '浦发银行', risk: '合规风险', path: eventPath },
    ],
    [
      { name: '重点项目信用风险暴露', institution: '国际AMC', risk: '信用风险', path: eventPath },
      { name: '核心系统故障事件', institution: '浦发银行', risk: '信息科技风险', path: archivedEventPath },
      { name: '客户投诉舆情事件', institution: '上农商', risk: '声誉风险', path: '/major-events' },
    ],
  ];
  const statusClass = (status: string) => /审批/.test(status) ? 'approve' : /核实/.test(status) ? 'verify' : 'review';
  const riskRows = (items: ManagementRiskItem[], major = false) => <div className={`mgmt-risk-table ${major ? 'major' : ''}`}>
    <div className="mgmt-risk-head">{major && <span>事件名称</span>}<span>涉及机构</span><span>{major ? '风险分类' : '风险类别'}</span>{!major && <span>指标名称</span>}<span>操作</span></div>
    {items.map((item, index) => <div className="mgmt-risk-row" key={`${riskPage}-${item.institution}-${index}`}>{major && <span>{item.name}</span>}<span>{item.institution}</span><span>{item.risk}</span>{!major && <span>{item.indicator}</span>}<button onClick={() => navigate(item.path)}>查看</button></div>)}
  </div>;
  const portrait = [
    { name: '浦发银行', red: 6, yellow: 12, total: 42 },
    { name: '国际AMC', red: 8, yellow: 15, total: 48 },
    { name: '上农商', red: 5, yellow: 10, total: 38 },
    { name: '国泰海通', red: 12, yellow: 18, total: 65 },
  ];
  const points = portrait.map((item, index) => `${82 + index * 122},${180 - item.total * 2}`).join(' ');
  const pointPairs = portrait.map((item, index) => ({ x: 82 + index * 122, y: 180 - item.total * 2, value: item.total }));
  const metricCards = [
    { label: '待办任务', value: 28, tone: 'blue', glyph: 'task', trend: '↓ 3条' },
    { label: '逾期任务', value: 5, tone: 'red', glyph: 'clock', trend: '↓ 2条' },
    { label: '已办任务', value: 126, tone: 'green', glyph: 'check', trend: '↑ 12条' },
    { label: '全部任务', value: 159, tone: 'slate', glyph: 'report', trend: '↑ 7条' },
  ];
  const focusedItems: FocusedDataItem[] = [
    { institution: '浦发银行', indicator: '流动性覆盖率', value: '132.6%', path: '/indicators/query/ind-1' },
    { institution: '国际AMC', indicator: '资产负债率', value: '68.4%', path: '/indicators/query/ind-2' },
    { institution: '国泰海通', indicator: '资本杠杆率', value: '18.2%', path: '/indicators/query/ind-3' },
    { institution: '上农商', indicator: '单一客户贷款集中度', value: '6.8%', path: '/indicators/query/ind-1' },
    { institution: '浦发银行', indicator: '资本充足率', value: '14.8%', path: '/indicators/query/ind-1' },
    { institution: '国际AMC', indicator: '异常类资产占比', value: '9.6%', path: '/indicators/query/ind-2' },
  ];
  const submissions: SubmissionItem[] = [
    { institution: '浦发银行', content: '2024年5月并表数据报送', status: '确认上报数据', tone: 'blue', path: '/reports' },
    { institution: '国际AMC', content: '2024年5月并表数据报送', status: '转报', tone: 'orange', path: '/reports' },
    { institution: '国泰海通', content: '2024年5月并表数据报送', status: '发送报送通知', tone: 'slate', path: '/reports' },
    { institution: '上农商', content: '2024年5月并表数据报送', status: '报送完成通知', tone: 'green', path: '/reports' },
  ];
  const riskTrends = ['↑ 2条', '↓ 3条', '↑ 1条'];
  const periods = ['2024年5月', '2024年4月', '2024年3月'];

  return <Page title="金控并表管理工作台" breadcrumb={['工作台']} hidePageTitle>
    <div className="management-workbench" data-role={role}>
      <FocusedDataTicker items={focusedItems} showInstitution navigate={navigate} />
      <div className="mgmt-top-grid">
        <section className="mgmt-panel mgmt-reminders">
          <ManagementSectionTitle title="任务事项" note="聚焦待办任务，及时处理各项工作事项" />
          <div className="mgmt-task-metrics">{metricCards.map(item => <button key={item.label} className={`tone-${item.tone}`} onClick={() => navigate('/workbench')}><span><WorkspaceGlyph name={item.glyph} /></span><small>{item.label}</small><b>{item.value}<em>条</em></b><p>较上月 <strong>{item.trend}</strong></p></button>)}</div>
          <div className="mgmt-task-table"><div className="mgmt-task-head"><span>任务名称</span><span>任务状态</span><span>涉及机构</span><span>操作</span></div>{tasks.map(item => <div className="mgmt-task-row" key={item.name}><span>{item.name}</span><span><i className={statusClass(item.status)}>{item.status}</i></span><span>{item.institution}</span><button onClick={() => navigate(item.path)}>查看</button></div>)}</div>
          <button className="mgmt-more" onClick={() => navigate('/warning/disposal')}>查看更多任务　›</button>
        </section>

        <section className="mgmt-panel mgmt-risks" onMouseEnter={() => setRiskPaused(true)} onMouseLeave={() => setRiskPaused(false)}>
          <ManagementSectionTitle title="预警及重大风险事件" note="关注重大风险，强化预警监测" action={<span className="mgmt-refresh">每4秒自动刷新 · {riskPage + 1}/2</span>} />
          <div className="mgmt-risk-body"><div className="mgmt-risk-counts">
            <button className="red" onClick={() => navigate('/warning/disposal')}><span><WorkspaceGlyph name="warning" /></span><small>本月新增<br />红灯预警数</small><b>6<em>条</em></b><p>较上月 <strong>{riskTrends[0]}</strong></p></button>
            <button className="yellow" onClick={() => navigate('/warning/disposal')}><span><WorkspaceGlyph name="warning" /></span><small>本月新增<br />黄灯预警数</small><b>15<em>条</em></b><p>较上月 <strong>{riskTrends[1]}</strong></p></button>
            <button className="blue" onClick={() => navigate('/major-events')}><span><WorkspaceGlyph name="report" /></span><small>本月新增<br />重大风险事件数</small><b>3<em>条</em></b><p>较上月 <strong>{riskTrends[2]}</strong></p></button>
          </div><div className="mgmt-risk-groups">
            <div className="mgmt-risk-group red"><h3>红灯预警指标</h3>{riskRows(redGroups[riskPage])}</div>
            <div className="mgmt-risk-group yellow"><h3>黄灯预警指标</h3>{riskRows(yellowGroups[riskPage])}</div>
            <div className="mgmt-risk-group blue"><h3>重大风险事件</h3>{riskRows(eventGroups[riskPage], true)}</div>
          </div></div>
        </section>
      </div>

      <div className="mgmt-bottom-grid">
        <section className="mgmt-panel mgmt-portrait">
          <ManagementSectionTitle title="金融机构风险画像" note="各机构限额指标亮灯情况" action={<button className="mgmt-select" onClick={() => setPortraitPeriod(value => (value + 1) % periods.length)}>{periods[portraitPeriod]}⌄</button>} />
          <div className="mgmt-chart-legend"><span className="red">红灯指标数</span><span className="yellow">黄灯指标数</span><span className="line">限额指标总数</span></div>
          <svg className="mgmt-chart" viewBox="0 0 520 225" role="img" aria-label="四家金融机构红黄灯指标堆叠柱与限额指标总数折线图">
            {[20, 60, 100, 140, 180].map((y, index) => <g key={y}><line x1="38" x2="505" y1={y} y2={y} /><text x="28" y={y + 4}>{80 - index * 20}</text></g>)}
            <line className="axis" x1="38" x2="505" y1="180" y2="180" />
            {portrait.map((item, index) => { const x = 60 + index * 122; const redHeight = item.red * 2.2; const yellowHeight = item.yellow * 2.2; return <g key={item.name}><rect className="bar-red" x={x} y={180 - redHeight} width="46" height={redHeight} /><rect className="bar-yellow" x={x} y={180 - redHeight - yellowHeight} width="46" height={yellowHeight} /><text className="bar-label" x={x + 23} y={177 - redHeight / 2}>{item.red}</text><text className="bar-label" x={x + 23} y={177 - redHeight - yellowHeight / 2}>{item.yellow}</text><text className="org-label" x={x + 23} y="204">{item.name}</text></g>; })}
            <polyline className="total-line" points={points} />
            {pointPairs.map(point => <g key={point.x}><circle className="total-point" cx={point.x} cy={point.y} r="4" /><text className="total-label" x={point.x} y={point.y - 10}>{point.value}</text></g>)}
          </svg>
        </section>

        <section className="mgmt-panel mgmt-submissions">
          <ManagementSectionTitle title="数据报送" note="各并表金融机构数据报送情况" action={<button className="mgmt-config" onClick={() => navigate('/reports')}>查看更多　›</button>} />
          <SubmissionList items={submissions} showInstitution showPeriod={false} navigate={navigate} />
        </section>

        <section className="mgmt-panel mgmt-sentiment">
          <ManagementSectionTitle title="舆情监测" note="跨机构外部舆情动态" action={<span className="mgmt-refresh">每3秒自动轮播</span>} />
          <SentimentMonitor items={managementSentiments} showInstitution />
        </section>
      </div>
    </div>
  </Page>;
}

type InstitutionRiskItem = { name?: string; risk: string; indicator?: string; currentValue?: string; path: string };

const institutionWorkbenchProfiles: Record<string, {
  taskMetrics: [number, number, number, number];
  riskCounts: [number, number, number];
  warningNotifications: string;
  warningReplies: string;
  warningDisposals: string;
  warningResolved: string;
  redIndicators: [string, string][];
  yellowIndicators: [string, string][];
  events: [string, string][];
}> = {
  浦发银行: {
    taskMetrics: [12, 3, 26, 41], riskCounts: [6, 15, 3], warningNotifications: '12', warningReplies: '83.3', warningDisposals: '6', warningResolved: '8',
    redIndicators: [['流动性风险', '流动性覆盖率'], ['资本风险', '核心一级资本充足率'], ['信用风险', '不良贷款率'], ['流动性风险', '净稳定资金比例'], ['集中度风险', '单一客户贷款集中度'], ['资本风险', '资本充足率']],
    yellowIndicators: [['信用风险', '拨备覆盖率'], ['流动性风险', '流动性比例'], ['集中度风险', '单一集团客户授信集中度'], ['信用风险', '关注类贷款占比'], ['操作风险', '重大操作风险事件数量'], ['声誉风险', '重大声誉风险事件数量']],
    events: [['信息系统异常事件', '信息科技风险'], ['某项目重大风险事件', '信用风险'], ['重大诉讼事项', '合规风险'], ['核心系统故障事件', '信息科技风险'], ['重点客户风险暴露事件', '信用风险'], ['客户投诉舆情事件', '声誉风险']],
  },
  国际AMC: {
    taskMetrics: [11, 2, 24, 37], riskCounts: [6, 15, 3], warningNotifications: '12', warningReplies: '83.3', warningDisposals: '6', warningResolved: '8',
    redIndicators: [['信用风险', '异常类资产占比'], ['资本风险', '资本充足率'], ['集中度风险', '单一客户投融资集中度'], ['流动性风险', '流动性比例'], ['信用风险', '不良资产率'], ['集中度风险', '前十大客户集中度']],
    yellowIndicators: [['信用风险', '资产拨备率'], ['集中度风险', '单一集团客户投融资集中度'], ['操作风险', '重大操作风险事件数量'], ['流动性风险', '现金流覆盖率'], ['市场风险', '资产负债率'], ['声誉风险', '重大声誉风险事件数量']],
    events: [['重点项目风险暴露事件', '信用风险'], ['信息系统异常事件', '信息科技风险'], ['重大诉讼事项', '合规风险'], ['存量资产处置风险事件', '市场风险'], ['重点客户违约事件', '信用风险'], ['客户投诉舆情事件', '声誉风险']],
  },
  上农商: {
    taskMetrics: [9, 1, 22, 32], riskCounts: [5, 12, 2], warningNotifications: '10', warningReplies: '86.5', warningDisposals: '4', warningResolved: '7',
    redIndicators: [['资本风险', '核心一级资本充足率'], ['集中度风险', '单一客户贷款集中度'], ['流动性风险', '流动性比例'], ['信用风险', '不良贷款率'], ['资本风险', '资本充足率'], ['集中度风险', '单一集团客户授信集中度']],
    yellowIndicators: [['信用风险', '拨备覆盖率'], ['流动性风险', '流动性覆盖率'], ['集中度风险', '最大十家客户贷款集中度'], ['操作风险', '重大操作风险事件数量'], ['声誉风险', '重大声誉风险事件数量'], ['市场风险', '资产负债率']],
    events: [['涉农项目风险事件', '信用风险'], ['信息系统异常事件', '信息科技风险'], ['重大诉讼事项', '合规风险'], ['重点客户风险暴露事件', '信用风险'], ['营业网点运营事件', '操作风险'], ['客户投诉舆情事件', '声誉风险']],
  },
  国泰海通: {
    taskMetrics: [10, 2, 25, 37], riskCounts: [6, 13, 3], warningNotifications: '11', warningReplies: '84.8', warningDisposals: '5', warningResolved: '9',
    redIndicators: [['市场风险', '资产负债率'], ['市场风险', '财务杠杆率'], ['操作风险', '重大操作风险事件数量'], ['市场风险', '自营权益类证券及证券衍生品占净资本比例'], ['流动性风险', '流动性覆盖率'], ['资本风险', '净资本与风险准备之和的比例']],
    yellowIndicators: [['集中度风险', '单一客户融资集中度'], ['市场风险', '权益类证券投资比例'], ['声誉风险', '重大声誉风险事件数量'], ['信用风险', '融资融券业务违约率'], ['流动性风险', '流动性比例'], ['操作风险', '信息系统故障时长']],
    events: [['自营业务市场波动事件', '市场风险'], ['信息系统异常事件', '信息科技风险'], ['重大诉讼事项', '合规风险'], ['客户信用风险暴露事件', '信用风险'], ['交易系统故障事件', '操作风险'], ['客户投诉舆情事件', '声誉风险']],
  },
};

function InstitutionWorkbench({ state, role, navigate }: { state: DemoState; role: Role; navigate: (path: string) => void }) {
  const [riskPage, setRiskPage] = useState(0);
  const [riskPaused, setRiskPaused] = useState(false);
  useEffect(() => { if (riskPaused) return; const timer = window.setInterval(() => setRiskPage(page => (page + 1) % 2), 4000); return () => window.clearInterval(timer); }, [riskPaused]);

  const profile = institutionWorkbenchProfiles[currentInstitution] || institutionWorkbenchProfiles.浦发银行;
  const warningPath = (level: '红灯' | '黄灯') => {
    const item = state.warningDisposals.find(candidate => candidate.level === level && candidate.institution === currentInstitution)
      || state.warningDisposals.find(candidate => candidate.level === level);
    return item ? `/warning/disposal/${item.id}/overview` : '/warning/disposal';
  };
  const eventPath = state.majorEvents.find(candidate => candidate.institution === currentInstitution) || state.majorEvents[0];
  const majorPath = eventPath ? `/major-events/${eventPath.id}/overview` : '/major-events';
  const tasks = [
    { name: '2024年5月并表数据上报', status: '待上报', path: '/reports' },
    { name: '预警答复函提交（流动性风险）', status: '待答复', path: warningPath('红灯') },
    { name: '重大风险事件续报', status: '待确认', path: majorPath },
    { name: '处置方案执行情况反馈', status: '处置中', path: warningPath('黄灯') },
    { name: '指标重检申请', status: '已办结', path: '/indicators/query' },
  ];
  const statusClass = (status: string) => /审核/.test(status) ? 'approve' : /提交|报送/.test(status) ? 'verify' : 'review';
  const indicatorValues = { 红灯: ['132.6%', '8.2%', '2.7%', '101.4%', '6.8%', '14.8%'], 黄灯: ['156.4%', '38.6%', '11.2%', '3.9%', '1条', '2条'] };
  const indicatorGroups = (items: [string, string][], level: '红灯' | '黄灯') => [0, 1].map(page => items.slice(page * 3, page * 3 + 3).map(([risk, indicator], index) => ({ risk, indicator, currentValue: indicatorValues[level][page * 3 + index], path: warningPath(level) })));
  const redGroups = indicatorGroups(profile.redIndicators, '红灯');
  const yellowGroups = indicatorGroups(profile.yellowIndicators, '黄灯');
  const eventGroups = [0, 1].map(page => profile.events.slice(page * 3, page * 3 + 3).map(([name, risk]) => ({ name, risk, path: majorPath })));
  const riskRows = (items: InstitutionRiskItem[], major = false) => <div className={`mgmt-risk-table institution-risk-table ${major ? 'major' : ''}`}>
    <div className="mgmt-risk-head">{major && <span>事件名称</span>}<span>{major ? '风险分类' : '风险类别'}</span>{!major && <span>指标名称</span>}{!major && <span>指标当前值</span>}<span>操作</span></div>
    {items.map((item, index) => <div className="mgmt-risk-row" key={`${riskPage}-${item.name || item.indicator}-${index}`}>{major && <span>{item.name}</span>}<span>{item.risk}</span>{!major && <span>{item.indicator}</span>}{!major && <span>{item.currentValue}</span>}<button onClick={() => navigate(item.path)}>查看</button></div>)}
  </div>;
  const metricCards = [
    { label: '待办任务', value: profile.taskMetrics[0], tone: 'blue', glyph: 'task', trend: '↓ 2条' },
    { label: '逾期任务', value: profile.taskMetrics[1], tone: 'red', glyph: 'clock', trend: '↓ 1条' },
    { label: '已办任务', value: profile.taskMetrics[2], tone: 'green', glyph: 'check', trend: '↑ 5条' },
    { label: '全部任务', value: profile.taskMetrics[3], tone: 'slate', glyph: 'report', trend: '↑ 2条' },
  ];
  const closureCards = [
    { label: '收到预警提示函数量', value: profile.warningNotifications, unit: '条', note: '较上月', trend: '↑ 20%', glyph: 'mail' },
    { label: '预警答复率', value: profile.warningReplies, unit: '%', note: '较上月', trend: '↑ 5.1%', glyph: 'report' },
    { label: '处置中事项数', value: profile.warningDisposals, unit: '条', note: '较上月', trend: '↓ 25%', glyph: 'check' },
    { label: '已解除预警数量', value: profile.warningResolved, unit: '条', note: '较上月', trend: '↑ 33%', glyph: 'check' },
  ];
  const focusedItems: FocusedDataItem[] = [
    { indicator: '流动性覆盖率', value: '132.6%', path: '/indicators/query/ind-1' },
    { indicator: '资本充足率', value: '14.8%', path: '/indicators/query/ind-1' },
    { indicator: '单一客户集中度', value: '6.8%', path: '/indicators/query/ind-2' },
    { indicator: '净稳定资金比例', value: '118.4%', path: '/indicators/query/ind-2' },
    { indicator: '不良贷款率', value: '1.26%', path: '/indicators/query/ind-3' },
    { indicator: '拨备覆盖率', value: '156.4%', path: '/indicators/query/ind-3' },
  ];
  const submissions: SubmissionItem[] = [
    { period: '2024年5月', content: '并表数据报送', status: '确认上报数据', tone: 'blue', path: '/reports' },
    { period: '2024年4月', content: '并表数据报送', status: '报送完成通知', tone: 'green', path: '/reports' },
    { period: '2024年3月', content: '并表数据报送', status: '报送完成通知', tone: 'green', path: '/reports' },
    { period: '2024年2月', content: '并表数据补充报送', status: '转报', tone: 'orange', path: '/reports' },
    { period: '2024年1月', content: '并表数据报送', status: '发送报送通知', tone: 'slate', path: '/reports' },
  ];
  const institutionSentiments: SentimentItem[] = [
    { institution: currentInstitution, sentiment: 'positive', importanceLevel: null, title: '本机构相关业务获得市场积极评价', publishTime: '2024-06-30 10:26', summary: '本机构相关业务近期获得市场积极评价，品牌影响保持稳健。', riskType: '声誉风险', exposure: '8.6亿元', exposureRatio: '1.8%', rank: '第4位' },
    { institution: '核心交易对手A', sentiment: 'neutral', importanceLevel: null, title: '某被投企业发布经营事项公告', publishTime: '2024-06-30 09:18', summary: '主要被投企业发布经营事项公告，当前未发现明显风险影响。', riskType: '市场风险', exposure: '3.7亿元', exposureRatio: '1.1%', rank: '第5位' },
    { institution: '核心交易对手B', sentiment: 'negative', importanceLevel: 1, title: '核心交易对手出现重大负面舆情', publishTime: '2024-06-29 18:42', summary: '核心交易对手出现重大负面舆情，需立即评估敞口与传导影响。', riskType: '信用风险', exposure: '9.2亿元', exposureRatio: '2.8%', rank: '第1位' },
    { institution: '主要被投企业A', sentiment: 'negative', importanceLevel: 2, title: '主要被投企业偿债能力受到关注', publishTime: '2024-06-29 15:06', summary: '主要被投企业偿债能力受到关注，建议持续跟踪现金流变化。', riskType: '信用风险', exposure: '6.8亿元', exposureRatio: '2.0%', rank: '第2位' },
    { institution: currentInstitution, sentiment: 'negative', importanceLevel: 3, title: '重点行业客户经营指标出现波动', publishTime: '2024-06-28 22:15', summary: '重点行业客户经营指标出现波动，整体影响仍处于可控范围。', riskType: '信用风险', exposure: '4.2亿元', exposureRatio: '1.3%', rank: '第3位' },
    { institution: '核心交易对手C', sentiment: 'negative', importanceLevel: 4, title: '核心交易对手相关诉讼出现新进展', publishTime: '2024-06-28 16:34', summary: '核心交易对手相关诉讼出现新进展，需关注后续审理结果。', riskType: '法律合规风险', exposure: '2.9亿元', exposureRatio: '0.9%', rank: '第6位' },
    { institution: currentInstitution, sentiment: 'negative', importanceLevel: 5, title: '个别服务投诉引发局部市场讨论', publishTime: '2024-06-27 14:05', summary: '个别服务投诉引发局部市场讨论，当前传播范围有限。', riskType: '声誉风险', exposure: '—', exposureRatio: '—', rank: '—' },
  ];
  const riskTrends = ['↑ 2条', '↓ 3条', '↑ 1条'];

  return <Page title={`金融机构工作台（${currentInstitution}）`} breadcrumb={['工作台']} hidePageTitle>
    <div className="management-workbench institution-management-workbench" data-role={role} data-institution={currentInstitution}>
      <FocusedDataTicker items={focusedItems} showInstitution={false} navigate={navigate} />
      <div className="mgmt-top-grid">
        <section className="mgmt-panel mgmt-reminders">
          <ManagementSectionTitle title="任务事项" note="聚焦待办任务，及时处理各项工作事项" />
          <div className="mgmt-task-metrics">{metricCards.map(item => <button key={item.label} className={`tone-${item.tone}`} onClick={() => navigate('/workbench')}><span><WorkspaceGlyph name={item.glyph} /></span><small>{item.label}</small><b>{item.value}<em>条</em></b><p>较上月 <strong>{item.trend}</strong></p></button>)}</div>
          <div className="mgmt-task-table institution-task-table"><div className="mgmt-task-head"><span>任务名称</span><span>任务状态</span><span>操作</span></div>{tasks.map(item => <div className="mgmt-task-row" key={item.name}><span>{item.name}</span><span><i className={statusClass(item.status)}>{item.status}</i></span><button onClick={() => navigate(item.path)}>查看</button></div>)}</div>
          <button className="mgmt-more" onClick={() => navigate('/reports')}>查看更多任务　›</button>
        </section>

        <section className="mgmt-panel mgmt-risks" onMouseEnter={() => setRiskPaused(true)} onMouseLeave={() => setRiskPaused(false)}>
          <ManagementSectionTitle title="预警及重大风险事件" note="关注重大风险，强化预警监测" action={<span className="mgmt-refresh">每4秒自动刷新 · {riskPage + 1}/2</span>} />
          <div className="mgmt-risk-body"><div className="mgmt-risk-counts">
            <button className="red" onClick={() => navigate('/warning/disposal')}><span><WorkspaceGlyph name="warning" /></span><small>本月新增<br />红灯预警数</small><b>{profile.riskCounts[0]}<em>条</em></b><p>较上月 <strong>{riskTrends[0]}</strong></p></button>
            <button className="yellow" onClick={() => navigate('/warning/disposal')}><span><WorkspaceGlyph name="warning" /></span><small>本月新增<br />黄灯预警数</small><b>{profile.riskCounts[1]}<em>条</em></b><p>较上月 <strong>{riskTrends[1]}</strong></p></button>
            <button className="blue" onClick={() => navigate('/major-events')}><span><WorkspaceGlyph name="report" /></span><small>本月新增<br />重大风险事件数</small><b>{profile.riskCounts[2]}<em>条</em></b><p>较上月 <strong>{riskTrends[2]}</strong></p></button>
          </div><div className="mgmt-risk-groups">
            <div className="mgmt-risk-group red"><h3>红灯预警指标</h3>{riskRows(redGroups[riskPage])}</div>
            <div className="mgmt-risk-group yellow"><h3>黄灯预警指标</h3>{riskRows(yellowGroups[riskPage])}</div>
            <div className="mgmt-risk-group blue"><h3>重大风险事件</h3>{riskRows(eventGroups[riskPage], true)}</div>
          </div></div>
        </section>
      </div>

      <div className="mgmt-bottom-grid">
        <section className="mgmt-panel mgmt-submissions">
          <ManagementSectionTitle title="数据报送" note="本机构当前及近期报送任务" action={<button className="mgmt-config" onClick={() => navigate('/reports')}>查看更多　›</button>} />
          <SubmissionList items={submissions} showInstitution={false} showPeriod navigate={navigate} />
        </section>

        <section className="mgmt-panel mgmt-closure">
          <ManagementSectionTitle title="闭环办理统计" note="跟踪处置进度，推动风险闭环" />
          <div className="mgmt-closure-grid">{closureCards.map(item => <button key={item.label} onClick={() => navigate('/warning/disposal')}><span className="tone-blue"><WorkspaceGlyph name={item.glyph} /></span><div><small>{item.label}</small><b>{item.value}<em>{item.unit}</em></b><p>{item.note} <strong>{item.trend}</strong></p></div></button>)}</div>
        </section>

        <section className="mgmt-panel mgmt-sentiment">
          <ManagementSectionTitle title="舆情监测" note="本机构及重点关联主体" action={<span className="mgmt-refresh">每3秒自动轮播</span>} />
          <SentimentMonitor items={institutionSentiments} showInstitution={false} />
        </section>
      </div>
    </div>
  </Page>;
}

function RoleWorkbench({ state, role, navigate, toast }: { state: DemoState; role: Role; navigate: (path: string) => void; toast: (message: string) => void }) {
  const data = useMemo(() => getWorkbenchDataByRole(state, role, loadConcentrationData()), [state, role]);
  const latest = useMemo(() => indicatorPeriodService.latest(state.indicatorPeriodRecords), [state.indicatorPeriodRecords]);
  const categories = ['全部', ...new Set(data.tasks.map(item => item.category))];
  const [category, setCategory] = useState('全部');
  const [taskStatus, setTaskStatus] = useState('待办');
  const [taskOverrides, setTaskOverrides] = useState<Record<string, WorkspaceTaskOverride>>({});
  const [transferTaskId, setTransferTaskId] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [readMessages, setReadMessages] = useState<string[]>([]);
  const resolveTaskStatus = (item: (typeof data.tasks)[number]): WorkspaceTaskStatus => taskOverrides[item.id]?.status || (/已完成|已办结|已报送|已归档|已关闭/.test(item.status) ? '已办' : /逾期|退回/.test(item.status) ? '逾期' : '待签收');
  const matchesTaskStatus = (item: (typeof data.tasks)[number]) => {
    const status = resolveTaskStatus(item);
    return taskStatus === '全部' || (taskStatus === '待办' ? status === '待签收' || status === '办理中' : taskStatus === status);
  };
  const tasks = data.tasks.filter(item => (category === '全部' || item.category === category) && matchesTaskStatus(item));
  const taskStatusCounts = { 待办: data.tasks.filter(item => ['待签收', '办理中'].includes(resolveTaskStatus(item))).length, 已办: data.tasks.filter(item => resolveTaskStatus(item) === '已办').length, 逾期: data.tasks.filter(item => resolveTaskStatus(item) === '逾期').length };
  const transferringTask = data.tasks.find(item => item.id === transferTaskId);
  const signTask = (id: string) => { setTaskOverrides(current => ({ ...current, [id]: { status: '办理中', owner: role === '各金融机构' ? currentInstitution : role, updatedAt: '刚刚签收' } })); toast('任务已签收，已进入办理中'); };
  const remindTask = (title: string) => toast(`已向责任人发送催办提醒：${title}`);
  const variant = role === '集团' ? 'group' : role === '金控公司' ? 'holding' : 'institution';
  const warningPending = state.warningDisposals.filter(item => !/已解除|已关闭|已办结/.test(item.status)).length;
  const warningCompleted = state.warningDisposals.length - warningPending;
  const reportTotal = state.reports.length || 1;
  const reportCompleted = state.reports.filter(item => /已报送|已完成|通过/.test(item.status)).length;
  const reportRate = Math.round(reportCompleted / reportTotal * 100);
  const periodicTotal = state.periodicReports.length || 1;
  const periodicRate = Math.round(state.periodicReports.filter(item => item.status === '已提交').length / periodicTotal * 100);
  const redCapitalInstitutions = new Set(latest.filter(item => /资本/.test(`${item.indicatorType}${item.indicatorName}`) && item.currentLightStatus === '红灯').map(item => item.institution)).size;
  const institutionCount = state.institutions.filter(item => item.status === '已纳入').length;
  const workbenchTitle = variant === 'group' ? '集团并表管理工作台' : variant === 'holding' ? '金控/国资并表管理工作台' : '金融机构并表报送工作台';
  const workbenchDescription = variant === 'group' ? '面向集团统筹监督，集中掌握并表运行、重点风险、审阅事项与管理协同。' : variant === 'holding' ? '面向组织实施与过程管理，统筹任务下发、数据校核、预警处置及报告编制。' : '面向金融机构报送执行，集中办理任务、数据报送、问题补正、预警反馈与整改跟踪。';
  const metrics: WorkspaceMetric[] = variant === 'group' ? [
    { label: '纳入并表机构数', value: institutionCount, unit: '家', trend: '较上期 0', note: '并表范围保持稳定', path: '/institutions', tone: 'indigo', icon: 'building' },
    { label: '风险预警数量', value: state.warningDisposals.length, unit: '条', trend: `红灯 ${state.warningDisposals.filter(item => item.level === '红灯').length}`, note: '需持续跟踪', path: '/warning/disposal', tone: 'red', icon: 'warning' },
    { label: '资本缺口机构数', value: redCapitalInstitutions, unit: '家', trend: redCapitalInstitutions ? '需重点审阅' : '运行正常', note: '资本指标监测', path: '/indicators/query', tone: 'orange', icon: 'capital' },
    { label: '会计并表完成率', value: `${reportRate}%`, unit: '', trend: '本期进度', note: '报送持续推进', path: '/reports', tone: 'blue', icon: 'chart' },
    { label: '重大风险事件数量', value: state.majorEvents.length, unit: '起', trend: `${state.majorEvents.filter(item => /已归档|已关闭/.test(item.status)).length} 起归档`, note: '事件台账', path: '/major-events', tone: 'red', icon: 'report' },
    { label: '待审阅报告数量', value: state.periodicReports.filter(item => item.status !== '已提交').length, unit: '份', trend: `${periodicRate}% 已完成`, note: '报告审阅进度', path: '/periodic-reports', tone: 'violet', icon: 'task' },
  ] : variant === 'holding' ? [
    { label: '本期任务总数', value: data.tasks.length, unit: '项', trend: '按期推进', note: '当前周期任务', path: '/workbench', tone: 'indigo', icon: 'task' },
    { label: '数据报送完成率', value: `${reportRate}%`, unit: '', trend: `${reportCompleted}/${state.reports.length}`, note: '机构报送进度', path: '/reports', tone: 'green', icon: 'chart' },
    { label: '校验问题数量', value: state.reports.filter(item => !/已报送|已完成|通过/.test(item.status)).length, unit: '项', trend: '待协调补正', note: '数据质量检查', path: '/reports', tone: 'orange', icon: 'warning' },
    { label: '预警处置数量', value: state.warningDisposals.length, unit: '项', trend: `${warningPending} 项办理中`, note: '全流程跟踪', path: '/warning/disposal', tone: 'red', icon: 'warning' },
    { label: '整改中事项数量', value: state.warningDisposals.filter(item => /跟踪|执行|整改/.test(item.status)).length, unit: '项', trend: '持续督办', note: '整改闭环管理', path: '/warning/disposal', tone: 'orange', icon: 'check' },
    { label: '报告编制进度', value: `${periodicRate}%`, unit: '', trend: '本期进度', note: '报告编制与审阅', path: '/periodic-reports', tone: 'blue', icon: 'report' },
  ] : [
    { label: '待办任务数', value: data.tasks.length, unit: '项', trend: '当前待办理', note: '任务集中处理', path: '/workbench', tone: 'indigo', icon: 'task' },
    { label: '待报送数据项数', value: state.reports.filter(item => !/已报送|已完成|通过/.test(item.status)).length, unit: '项', trend: '本期报送', note: '按期完成填报', path: '/reports', tone: 'blue', icon: 'report' },
    { label: '待补正问题数', value: data.tasks.filter(item => /校验|补正|报送/.test(item.category + item.title)).length, unit: '项', trend: '需及时处理', note: '数据质量问题', path: '/reports', tone: 'orange', icon: 'warning' },
    { label: '待回函预警数', value: state.warningDisposals.filter(item => /反馈|原因|方案|待处理/.test(item.status)).length, unit: '项', trend: '等待机构办理', note: '预警答复反馈', path: '/warning/disposal', tone: 'red', icon: 'warning' },
    { label: '整改中事项数', value: state.warningDisposals.filter(item => /跟踪|执行|整改/.test(item.status)).length, unit: '项', trend: '持续跟踪', note: '整改任务', path: '/warning/disposal', tone: 'orange', icon: 'check' },
    { label: '已完成任务数', value: data.recent.length + warningCompleted, unit: '项', trend: '本期累计', note: '办理记录可追溯', path: '/workbench', tone: 'green', icon: 'check' },
  ];
  const taskTable = <><div className="workspace-task-toolbar"><div className="workspace-task-status"><Tabs items={['待办', '已办', '逾期', '全部']} active={taskStatus} onChange={setTaskStatus} /><span>待办 <b>{taskStatusCounts.待办}</b></span><span>已办 <b>{taskStatusCounts.已办}</b></span><span>逾期 <b>{taskStatusCounts.逾期}</b></span></div><label>任务类型<Select value={category} onChange={setCategory} options={categories} /></label></div><Table><thead><tr><th>任务事项</th><th>任务类型</th><th>责任范围</th><th>办理时限</th><th>进度</th><th>状态</th><th>操作</th></tr></thead><tbody>{tasks.slice(0, 8).map(item => { const workflowStatus = resolveTaskStatus(item); const progress = workflowStatus === '已办' ? 100 : workflowStatus === '办理中' ? 55 : workflowStatus === '逾期' ? 72 : 18; const owner = taskOverrides[item.id]?.owner; return <tr key={item.id}><td><b className="workspace-table-title">{item.title}</b><small className="workspace-task-update">{taskOverrides[item.id]?.updatedAt || '等待接收处理'}</small></td><td>{item.category}</td><td>{owner || item.institution}</td><td>{item.deadline}</td><td><div className="workspace-task-progress"><i className={workflowStatus === '逾期' ? 'overdue' : workflowStatus === '已办' ? 'done' : ''} style={{ width: `${progress}%` }} /><span>{progress}%</span></div></td><td><span className={`workspace-task-tag status-${workflowStatus}`}>{workflowStatus}</span></td><td><div className="workspace-row-actions">{workflowStatus === '待签收' ? <TextAction onClick={() => signTask(item.id)}>签收</TextAction> : workflowStatus !== '已办' && <TextAction onClick={() => navigate(item.path)}>办理</TextAction>}<TextAction onClick={() => navigate(item.path)}>详情</TextAction>{workflowStatus !== '已办' && <TextAction onClick={() => { setTransferTaskId(item.id); setTransferTarget(''); setTransferNote(''); }}>转办</TextAction>}{variant !== 'institution' && workflowStatus !== '已办' && <TextAction onClick={() => remindTask(item.title)}>催办</TextAction>}</div></td></tr>; })}</tbody></Table>{!tasks.length && <div className="empty-state compact"><p>当前筛选条件下暂无任务</p></div>}</>;
  const messageCenter = <section className="workspace-message-center"><div className="workspace-message-title"><span><WorkspaceGlyph name="task" /></span><div><b>消息与提醒</b><small>{Math.max(0, data.focus.length - readMessages.length)} 条未读 · 审核结果、风险提示和任务动态</small></div></div><div className="workspace-message-items">{data.focus.slice(0, 3).map(item => <button className={readMessages.includes(item.id) ? 'read' : ''} key={item.id} onClick={() => { setReadMessages(current => current.includes(item.id) ? current : [...current, item.id]); navigate(item.path); }}><i /><span><b>{item.title}</b><small>{item.detail}</small></span><StatusTag value={item.status} /></button>)}{!data.focus.length && <span className="workspace-no-message">当前没有新的风险提醒</span>}</div>{data.focus.length > 0 && <TextAction onClick={() => { setReadMessages(data.focus.map(item => item.id)); toast('工作台消息已全部标记为已读'); }}>全部已读</TextAction>}</section>;
  const focusList = <div className="workspace-focus-list">{data.focus.slice(0, 5).map(item => <button key={item.id} onClick={() => navigate(item.path)}><span><b>{item.title}</b><small>{item.detail}</small></span><StatusTag value={item.status} /></button>)}{!data.focus.length && <div className="empty-state compact"><p>暂无风险提示事项</p></div>}</div>;
  const mergeOverview = <div className="workspace-merge-grid">{[
    { name: '风险并表', value: Math.max(0, 100 - Math.min(30, state.warningDisposals.length * 3)), status: '持续监测', path: '/warning/disposal', tone: 'indigo' },
    { name: '资本并表', value: Math.max(0, 100 - redCapitalInstitutions * 12), status: redCapitalInstitutions ? '存在缺口' : '运行正常', path: '/indicators/query', tone: 'orange' },
    { name: '会计并表', value: reportRate, status: '本期进度', path: '/reports', tone: 'green' },
  ].map(item => <button key={item.name} onClick={() => navigate(item.path)}><div><span className={`merge-dot ${item.tone}`} /><b>{item.name}</b><StatusTag value={item.status} /></div><strong>{item.value}<em>%</em></strong><div className="workspace-progress"><i className={item.tone} style={{ width: `${item.value}%` }} /></div><small>进入模块查看详细运行情况</small></button>)}</div>;
  const institutionTable = <Table><thead><tr><th>机构名称</th><th>红灯</th><th>黄灯</th><th>重大事件</th><th>待办</th><th>报送状态</th><th>操作</th></tr></thead><tbody>{data.institutions.slice(0, 5).map(item => { const target = state.institutions.find(candidate => candidate.name === item.institution || candidate.shortName === item.institution); return <tr key={item.institution}><td><b className="workspace-table-title">{item.institution}</b></td><td><b className="risk-number red">{item.red}</b></td><td><b className="risk-number yellow">{item.yellow}</b></td><td>{item.majorEvents}</td><td>{item.pending}</td><td><StatusTag value={item.reportStatus} /></td><td><TextAction onClick={() => navigate(target ? `/institutions/${target.id}` : '/institutions')}>查看</TextAction></td></tr>; })}</tbody></Table>;
  const recentTable = <Table><thead><tr><th>操作事项</th><th>办理说明</th><th>办理时间</th></tr></thead><tbody>{data.recent.slice(0, 5).map(item => <tr key={item.id}><td><b className="workspace-table-title">{item.action}</b></td><td>{item.detail}</td><td>{item.time}</td></tr>)}</tbody></Table>;
  const warningStages = <div className="workspace-stage-stats"><button onClick={() => navigate('/warning/disposal')}><span className="red"><WorkspaceGlyph name="warning" /></span><b>{state.warningDisposals.length}</b><small>预警触发</small></button><i /><button onClick={() => navigate('/warning/disposal')}><span className="orange"><WorkspaceGlyph name="task" /></span><b>{warningPending}</b><small>处置中</small></button><i /><button onClick={() => navigate('/warning/disposal')}><span className="green"><WorkspaceGlyph name="check" /></span><b>{warningCompleted}</b><small>已办结</small></button></div>;
  const quickActions = (variant === 'institution' ? [
    ['数据报送任务', '下载模板、填报并提交', '/reports', 'report'], ['校验问题', '查看问题并完成补正', '/reports', 'warning'], ['预警提示函', '查看提示并提交反馈', '/warning/disposal', 'task'], ['整改任务', '更新整改办理进展', '/warning/disposal', 'check'],
  ] : variant === 'holding' ? [
    ['任务与流程', '组织任务下发及跟踪', '/workbench', 'task'], ['指标维护', '维护指标及版本信息', '/indicators/maintenance', 'chart'], ['预警规则', '配置监测规则', '/warning/rules', 'warning'], ['报告管理', '编制与审阅风险报告', '/periodic-reports', 'report'],
  ] : [
    ['风险报告', '查阅报告成果', '/reports', 'report'], ['指标查询', '查看指标运行情况', '/indicators/query', 'chart'], ['重大风险事件', '进入事件报告台账', '/major-events', 'warning'], ['集中度监测', '查看风险集中度', '/concentration-monitoring', 'building'],
  ]) as [string, string, string, string][];
  const quickActionGrid = <div className="workspace-action-grid">{quickActions.map(([name, note, path, icon], index) => <button key={name} onClick={() => navigate(path)}><span className={`tone-${(['indigo', 'blue', 'orange', 'green'] as WorkspaceTone[])[index]}`}><WorkspaceGlyph name={icon} /></span><b>{name}</b><small>{note}</small><em>进入办理 →</em></button>)}</div>;

  return <Page title="工作台" breadcrumb={['工作台']} hidePageTitle>
    <div className={`workspace-shell workspace-${variant}`}>
      <div className="workspace-hero"><div><span className="workspace-role-chip">{variant === 'group' ? '集团本部 / 统筹监督' : variant === 'holding' ? '金控公司 / 国资公司' : '金融机构 / 报送反馈'}</span><h1>{workbenchTitle}</h1><p>{workbenchDescription}</p></div><div className="workspace-hero-actions"><Button variant="secondary" onClick={() => navigate('/cockpit')}>{variant === 'institution' ? '进入金融机构驾驶舱' : '集团及国资公司驾驶舱'}</Button><Button variant="secondary" onClick={() => navigate('/concentration-monitoring')}>集中度风险监测</Button>{variant === 'group' && <Button onClick={() => navigate('/dashboard')}>进入风险看板</Button>}</div></div>
      <WorkspaceMetrics items={metrics} navigate={navigate} />
      {messageCenter}

      {variant === 'group' && <>
        <div className="workspace-grid workspace-group-main"><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="三类并表总览" description="风险、资本、会计运行概况" /></div>{mergeOverview}</section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="重点预警与重大事项" description="高优先级事项集中呈现" /><TextAction onClick={() => navigate('/warning/disposal')}>查看全部</TextAction></div>{focusList}</section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="集团待办与审阅" description="待处理、待审阅事项" /></div>{taskTable}</section></div>
        <div className="workspace-grid workspace-support-three"><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="金融机构风险画像" description="机构风险与报送概览" /></div>{institutionTable}</section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="闭环办理统计" description="预警事项办理效率" /></div>{warningStages}<div className="workspace-closure-note"><b>{state.warningDisposals.length ? Math.round(warningCompleted / state.warningDisposals.length * 100) : 100}%</b><span>本期预警闭环率</span></div></section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="报告成果与常用入口" description="管理成果快速直达" /></div>{quickActionGrid}</section></div>
      </>}

      {variant === 'institution' && <>
        <div className="workspace-grid workspace-institution-main"><section className="workspace-card workspace-task-card"><div className="workspace-card-head"><WorkspacePanelTitle title="我的任务" description="按优先级集中办理本机构事项" /><TextAction onClick={() => navigate('/workbench')}>查看全部</TextAction></div>{taskTable}</section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="状态提醒与审核结果" description="反馈、审核与退回结果" /></div>{focusList}</section></div>
        <section className="workspace-card workspace-action-section"><div className="workspace-card-head"><WorkspacePanelTitle title="报送与反馈办理区" description="围绕报送、补正、回函和整改快速办理" /></div>{quickActionGrid}</section>
        <div className="workspace-grid workspace-support-four"><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="历史报送记录" description="最近办理与提交记录" /></div>{recentTable}</section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="本机构指标趋势" description="风险、资本、会计指标" /></div><div className="workspace-trend-grid">{latest.slice(0, 3).map((item, index) => <button key={item.id} onClick={() => navigate(`/indicators/query/${item.id}`)}><span><b>{item.indicatorName}</b><StatusTag value={item.currentLightStatus} /></span><strong>{item.indicatorValue}<em>{item.indicatorUnit}</em></strong><svg viewBox="0 0 180 38" preserveAspectRatio="none"><polyline points={index === 1 ? '0,25 30,17 60,22 90,12 120,16 150,9 180,13' : '0,28 30,24 60,25 90,18 120,20 150,12 180,8'} fill="none" stroke="currentColor" strokeWidth="2.5" /></svg></button>)}</div></section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="本机构预警闭环" description="预警办理状态" /></div>{warningStages}</section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="常用直达与下载" description="常用模板和办理入口" /></div>{quickActionGrid}</section></div>
      </>}

      {variant === 'holding' && <>
        <div className="workspace-grid workspace-holding-main"><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="任务下发与进度看板" description="组织实施与过程督办" /></div>{taskTable}</section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="数据质量与校验问题" description="机构报送质量检查" /><TextAction onClick={() => navigate('/reports')}>问题清单</TextAction></div><div className="workspace-quality-list">{data.institutions.slice(0, 5).map((item, index) => <button key={item.institution} onClick={() => navigate('/reports')}><span><b>{item.institution}</b><small>{item.reportStatus}</small></span><div><i style={{ width: `${Math.max(48, 96 - item.pending * 8 - index * 2)}%` }} /></div><strong>{Math.max(0, item.pending)}<em>项问题</em></strong></button>)}</div></section></div>
        <div className="workspace-grid workspace-holding-middle"><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="预警与整改闭环" description="处置进度与整改跟踪" /><TextAction onClick={() => navigate('/warning/disposal')}>进入管理</TextAction></div>{warningStages}{focusList}</section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="三类并表执行区" description="组织实施进度" /></div>{mergeOverview}</section></div>
        <div className="workspace-grid workspace-support-four"><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="机构报送质量排名" description="按完成率和问题数综合呈现" /></div><div className="workspace-ranking-list">{data.institutions.slice().sort((a, b) => a.pending - b.pending).slice(0, 5).map((item, index) => <button key={item.institution} onClick={() => navigate('/reports')}><i>{index + 1}</i><span><b>{item.institution}</b><small>{item.reportStatus}</small></span><strong>{Math.max(60, 98 - item.pending * 6)}<em>分</em></strong></button>)}</div></section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="超期待办清单" description="需优先协调事项" /></div>{focusList}</section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="报告编制区" description="定期报告编制进度" /></div><div className="workspace-report-progress"><b>{periodicRate}%</b><div><i style={{ width: `${periodicRate}%` }} /></div><span>本期报告编制整体进度</span><Button variant="secondary" onClick={() => navigate('/periodic-reports')}>进入报告管理</Button></div></section><section className="workspace-card"><div className="workspace-card-head"><WorkspacePanelTitle title="规则配置与常用功能" description="管理入口快速直达" /></div>{quickActionGrid}</section></div>
      </>}
    </div>
    {transferringTask && <Modal title="任务转办" onClose={() => setTransferTaskId(null)} footer={<><Button variant="secondary" onClick={() => setTransferTaskId(null)}>取消</Button><Button disabled={!transferTarget} onClick={() => { setTaskOverrides(current => ({ ...current, [transferringTask.id]: { status: '办理中', owner: transferTarget, updatedAt: '刚刚转办' } })); setTransferTaskId(null); toast(`任务已转办至${transferTarget}`); }}>确认转办</Button></>}><div className="form-grid"><Field label="任务事项"><Input value={transferringTask.title} disabled /></Field><Field label="当前责任范围"><Input value={taskOverrides[transferringTask.id]?.owner || transferringTask.institution} disabled /></Field><Field label="转办至" required><Select value={transferTarget} onChange={setTransferTarget} options={departments} /></Field><Field label="转办说明" span={2}><Textarea value={transferNote} onChange={setTransferNote} placeholder="请输入转办原因和办理要求" maxLength={200} showCount /></Field></div></Modal>}
  </Page>;
}

function InstitutionList({ state, role, navigate }: PageProps) {
  const [q, setQ] = useState({ name: '', type: '', status: '', includedAt: '' });
  const items = state.institutions.filter(item => (!q.name || item.name.includes(q.name)) && (!q.type || item.type === q.type) && (!q.status || item.status === q.status) && (!q.includedAt || item.includedAt === q.includedAt));
  return <Page title="纳入机构信息" breadcrumb={['并表看板', '纳入机构信息']}>
    <SearchPanel onSearch={() => undefined} onReset={() => setQ({ name: '', type: '', status: '', includedAt: '' })}>
      <Field label="机构名称"><Input value={q.name} onChange={value => setQ({ ...q, name: value })} /></Field>
      <Field label="机构类型"><Select value={q.type} onChange={value => setQ({ ...q, type: value })} options={[...new Set(state.institutions.map(item => item.type))]} /></Field>
      <Field label="纳入状态"><Select value={q.status} onChange={value => setQ({ ...q, status: value })} options={['已纳入', '暂缓纳入']} /></Field>
      <Field label="纳入时间"><Input type="date" value={q.includedAt} onChange={value => setQ({ ...q, includedAt: value })} /></Field>
    </SearchPanel>
    <div className="institution-list-head"><span>当前可查看机构 · {items.length} 家</span><small>{role === '各金融机构' ? '仅展示当前机构' : '集团并表范围'}</small></div>
    <div className="institution-card-grid">{items.map(item => <article className="institution-card" key={item.id}>
      <div className="institution-card-title"><div><h2>{item.name}</h2><span>{item.shortName} · {item.type}</span></div><StatusTag value={item.status} /></div>
      <div className="institution-card-details">
        <b>成立时间<span>{item.establishedAt}</span></b><b>注册资本<span>{item.registeredCapital}</span></b>
        <b>股权结构摘要<span>{item.ownership}</span></b><b>纳入并表时间<span>{item.includedAt}</span></b>
        <b className="wide">主要业务范围<span>{item.businessScope}</span></b>
      </div>
      <div className="institution-card-stats"><span>有效指标 <b>{item.activeIndicatorCount}</b></span><span>当前预警 <b>{item.warningCount}</b></span><Button variant="text" onClick={() => navigate('/institutions/' + item.id)}>查看详情 ›</Button></div>
    </article>)}</div>
    {!items.length && <div className="inline-empty">未查询到符合条件的机构</div>}
  </Page>;
}

function InstitutionDetail({ state, navigate }: PageProps) {
  const id = window.location.pathname.split('/')[2];
  const item = state.institutions.find(institution => institution.id === id);
  const [tab, setTab] = useState('机构概览');
  if (!item) return <Page title="机构详情" breadcrumb={['并表看板', '纳入机构信息']} actions={<Button variant="secondary" onClick={() => navigate('/institutions')}>返回</Button>}><div className="empty-state"><div className="empty-icon">!</div><h2>无权查看该机构或机构不存在</h2><p>各金融机构仅可查看本机构信息。</p></div></Page>;
  return <Page title={item.name + ' - 机构详情'} breadcrumb={['并表看板', '纳入机构信息', item.name]} actions={<Button variant="secondary" onClick={() => navigate('/institutions')}>返回机构列表</Button>}>
    <Section title="机构基本信息"><div className="detail-grid"><b>机构全称<span>{item.name}</span></b><b>机构简称<span>{item.shortName}</span></b><b>机构类型<span>{item.type}</span></b><b>纳入状态<span><StatusTag value={item.status} /></span></b><b>纳入并表时间<span>{item.includedAt}</span></b><b>当前有效指标<span>{item.activeIndicatorCount}</span></b><b>当前预警事项<span>{item.warningCount}</span></b></div></Section>
    <Tabs items={['机构概览', '基础指标', '监管及外部评价', '集中度信息', '关联方信息']} active={tab} onChange={setTab} />
    {tab === '机构概览' && <Section title="机构概览"><div className="detail-grid institution-detail-grid"><b>成立时间<span>{item.establishedAt}</span></b><b>注册资本<span>{item.registeredCapital}</span></b><b>统一社会信用代码<span>{item.creditCode}</span></b><b>企业地址<span>{item.address}</span></b><b>企业官网<span>{item.website}</span></b><b>应急联系人<span>{item.emergencyContact}</span></b><b>联系方式<span>{item.phone}</span></b><b className="wide">股权结构<span>{item.ownership}</span></b><b className="wide">业务范围<span>{item.businessScope}</span></b><b className="wide">管理机构情况<span>{item.management}</span></b><b className="wide">分支机构情况<span>{item.branches}</span></b></div><div className="read-block"><b>机构简介</b><p>{item.overview}</p></div></Section>}
    {tab === '基础指标' && <Section title="基础指标"><Table><thead><tr><th>指标名称</th><th>指标单位</th><th>本期值</th><th>上年同期</th><th>同比</th><th>上期值</th><th>环比</th><th>当前灯号</th></tr></thead><tbody>{item.indicators.map(indicator => <tr key={indicator.name}><td>{indicator.name}</td><td>{indicator.unit}</td><td>{indicator.current}</td><td>{indicator.lastYear}</td><td>{indicator.yearOnYear}</td><td>{indicator.previous}</td><td>{indicator.monthOnMonth}</td><td><StatusTag value={indicator.light} /></td></tr>)}</tbody></Table></Section>}
    {tab === '监管及外部评价' && <Section title="监管及外部评价"><div className="detail-grid"><b>监管评级<span>{item.rating.regulatory}</span></b><b>外部评级<span>{item.rating.external}</span></b><b>市场排名<span>{item.rating.marketRank}</span></b><b>近3年评级变化<span>{item.rating.history.join(' → ')}</span></b></div><div className="read-block"><b>主要监管关注事项</b><p>{item.rating.concerns}</p></div></Section>}
    {tab === '集中度信息' && <Section title="集中度信息"><div className="concentration-grid">{item.concentrations.map(row => <div key={row.category}><span>{row.category}</span><b>{row.value}</b><small>{row.description}</small></div>)}</div></Section>}
    {tab === '关联方信息' && <Section title="关联方信息"><Table><thead><tr><th>关联方名称</th><th>关联关系</th><th>持股比例</th><th>表内风险敞口</th><th>表外风险敞口</th><th>占净资产比例</th></tr></thead><tbody>{item.relatedParties.map(row => <tr key={row.name}><td>{row.name}</td><td>{row.relation}</td><td>{row.shareholding}</td><td>{row.onBalanceExposure}</td><td>{row.offBalanceExposure}</td><td>{row.netAssetRatio}</td></tr>)}</tbody></Table></Section>}
  </Page>;
}

function RiskPreferenceList({ state, role, navigate, update, toast }: PageProps) { const [q, setQ] = useState({ name: '', institution: '', status: '', running: true }); const [page, setPage] = useState(1); const items = state.riskPreferences.filter(x => (!q.name || x.name.includes(q.name)) && (!q.institution || x.institution.includes(q.institution)) && (!q.status || x.status === q.status) && (!q.running || x.status === '已生效')); return <Page title="风险偏好及目标" breadcrumb={['预警管理', '风险偏好及目标']} actions={permitted(role, 'preference-create') && <Button onClick={() => navigate('/warning/risk-preference/new')}>＋ 新增方案</Button>}><SearchPanel onSearch={() => setPage(1)} onReset={() => setQ({ name: '', institution: '', status: '', running: true })}><Field label="方案名称"><Input value={q.name} onChange={v => setQ({ ...q, name: v })} placeholder="请输入方案名称" /></Field><Field label="覆盖机构"><Select value={q.institution} onChange={v => setQ({ ...q, institution: v })} options={institutions} /></Field><Field label="方案状态"><Select value={q.status} onChange={v => setQ({ ...q, status: v })} options={['待提交', '待审核', '已生效', '已失效']} /></Field><Field label="生效起止时间"><div className="date-range"><Input type="date" /><span>至</span><Input type="date" /></div></Field><Field label="指标名称"><Input placeholder="请输入指标名称" /></Field><label className="check-field"><input type="checkbox" checked={q.running} onChange={e => setQ({ ...q, running: e.target.checked })} /> 仅展示运行中方案</label></SearchPanel><div className="list-toolbar"><span>风险偏好方案列表</span><Button variant="secondary" onClick={() => downloadCSV('风险偏好方案.csv', [['方案编号', '方案名称', '覆盖机构', '状态'], ...items.map(x => [x.code, x.name, x.institution, x.status])])}>⇩ 批量导出</Button></div><Table><thead><tr><th>序号</th><th>方案编号</th><th>方案名称</th><th>覆盖机构范围</th><th>生效时间</th><th>失效时间</th><th>方案状态</th><th>操作</th><th>方案流程</th></tr></thead><tbody>{items.map((item, i) => <tr key={item.id}><td>{i + 1}</td><td className="link">{item.code}</td><td>{item.name}</td><td>{item.institution}</td><td>{item.effectiveDate}</td><td>{item.expiryDate || '—'}</td><td><StatusTag value={item.status} /></td><td><TextAction disabled={!permitted(role, 'preference-edit')} onClick={() => navigate(`/warning/risk-preference/${item.id}/edit`)}>编辑</TextAction><TextAction onClick={() => navigate(`/warning/risk-preference/${item.id}`)}>查看</TextAction></td><td><TextAction onClick={() => toast(`流程：${item.logs.map(x => x.action).join(' → ')}`)}>查看流程</TextAction></td></tr>)}</tbody></Table><Pagination total={items.length} page={page} setPage={setPage} /></Page>; }

function RiskPreferenceEditor({ state, role, navigate, update, toast }: PageProps) { const editingId = window.location.pathname.split('/')[3]; const editing = state.riskPreferences.find(x => x.id === editingId); const [form, setForm] = useState<Partial<RiskPreference>>(() => editing ? structuredClone(editing) : { name: '', institution: '', effectiveDate: '', expiryDate: '', department: '金融机构管理部', summary: '', statement: '', indicators: [], attachments: [] }); const [files, setFiles] = useState<Attachment[]>(form.attachments || []); const indicators = form.indicators || []; const set = (patch: Partial<RiskPreference>) => setForm(x => ({ ...x, ...patch })); const save = (submit: boolean) => { if (!form.name || !form.institution || !form.effectiveDate || !form.expiryDate || !form.statement) return toast('请完整填写方案名称、覆盖机构、生效/失效时间和定性风险偏好陈述'); update(s => { if (editing) { const item = s.riskPreferences.find(x => x.id === editing.id)!; riskPreferenceService.update(item, { ...form, attachments: files, status: submit ? '待审核' : item.status }, submit ? '提交审阅' : '保存草稿', submit ? '方案已提交审阅' : '保存方案草稿', role); } else { const item = riskPreferenceService.create(s, { ...form, attachments: files }, role); if (submit) riskPreferenceService.update(item, { status: '待审核' }, '提交审阅', '方案已提交审阅', role); } }); toast(submit ? '方案已提交审阅' : '草稿已保存'); navigate('/warning/risk-preference'); }; const addIndicator = () => set({ indicators: [...indicators, { id: uid('rpi'), category: '资本充足类', name: '', definition: '', unit: '%', institution: form.institution || '上海农商银行', frequency: '月度', warning: '', tolerance: '', effectiveDate: form.effectiveDate || today() }] }); const updateIndicator = (id: string, patch: Record<string, string>) => set({ indicators: indicators.map(x => x.id === id ? { ...x, ...patch } : x) }); return <Page title={editing ? '风险偏好及目标 - 编辑方案' : '风险偏好及目标 - 新建方案'} breadcrumb={['预警管理', '风险偏好及目标', editing ? '编辑方案' : '新建方案']} actions={<><Button variant="secondary" onClick={() => navigate('/warning/risk-preference')}>返回</Button><Button variant="secondary" onClick={() => save(false)}>保存草稿</Button><Button onClick={() => save(true)} disabled={!permitted(role, 'preference-create')}>提交审阅</Button></>}><Section title="基本信息"><div className="form-grid"><Field label="方案编号"><Input value={editing?.code || '系统自动生成'} disabled /></Field><Field label="方案状态"><StatusTag value={editing?.status || '待提交'} /></Field><Field label="方案名称" required><Input value={form.name} onChange={v => set({ name: v })} /></Field><Field label="覆盖机构范围" required><Select value={form.institution} onChange={v => set({ institution: v })} options={institutions} /></Field><Field label="生效时间" required><Input type="date" value={form.effectiveDate} onChange={v => set({ effectiveDate: v })} /></Field><Field label="失效时间" required><Input type="date" value={form.expiryDate} onChange={v => set({ expiryDate: v })} /></Field><Field label="编制部门"><Select value={form.department} onChange={v => set({ department: v })} options={departments} /></Field><Field label="编制摘要" span={2}><Textarea value={form.summary} onChange={v => set({ summary: v })} /></Field></div></Section><Section title="定性风险偏好陈述"><Field label="定性风险偏好陈述" required><Textarea value={form.statement} onChange={v => set({ statement: v })} /></Field></Section><Section title="风险偏好指标配置" extra={<><Button variant="secondary" onClick={addIndicator}>＋ 新增指标</Button><Button variant="secondary" onClick={() => toast('批量导入模板已打开，可继续选择本地文件')}>批量导入</Button></>}><Table><thead><tr><th>序号</th><th>风险类别</th><th>指标名称</th><th>指标定义</th><th>单位</th><th>适用机构</th><th>控制频率</th><th>预警值</th><th>容忍值</th><th>操作</th></tr></thead><tbody>{indicators.map((x, i) => <tr key={x.id}><td>{i + 1}</td><td><Select value={x.category} onChange={v => updateIndicator(x.id, { category: v })} options={riskTypes} /></td><td><Input value={x.name} onChange={v => updateIndicator(x.id, { name: v })} /></td><td><Input value={x.definition} onChange={v => updateIndicator(x.id, { definition: v })} /></td><td><Input value={x.unit} onChange={v => updateIndicator(x.id, { unit: v })} /></td><td><Select value={x.institution} onChange={v => updateIndicator(x.id, { institution: v })} options={institutions} /></td><td><Select value={x.frequency} onChange={v => updateIndicator(x.id, { frequency: v })} options={['日度', '月度', '季度', '年度']} /></td><td><Input value={x.warning} onChange={v => updateIndicator(x.id, { warning: v })} /></td><td><Input value={x.tolerance} onChange={v => updateIndicator(x.id, { tolerance: v })} /></td><td><TextAction onClick={() => set({ indicators: indicators.filter(y => y.id !== x.id) })}>删除</TextAction></td></tr>)}</tbody></Table>{indicators.length === 0 && <div className="inline-empty">暂无指标，请新增或批量导入</div>}</Section><Section title="方案附件"><FileUploader files={files} onChange={setFiles} /></Section></Page>; }

function RiskPreferenceDetail({ state, role, navigate }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const item = state.riskPreferences.find(preference => preference.id === id);
  const [tab, setTab] = useState('概览');
  const workflow = item?.workflow || { currentNodeId: 'rp-prepare', records: [] };
  const [selectedNodeId, setSelectedNodeId] = useState(workflow.currentNodeId);
  if (!item) return <Page title="风险偏好及目标 - 方案详情" breadcrumb={['预警管理', '风险偏好及目标']} actions={<Button variant="secondary" onClick={() => navigate('/warning/risk-preference')}>返回</Button>}><div className="empty-state"><h2>无权查看该方案</h2></div></Page>;
  return <Page title="风险偏好及目标 - 方案详情" breadcrumb={['预警管理', '风险偏好及目标', item.name]} actions={<><Button variant="secondary" onClick={() => downloadCSV(item.code + '.csv', [['方案编号', '方案名称', '状态'], [item.code, item.name, item.status]])}>⇩ 导出</Button><Button variant="secondary" onClick={() => navigate('/warning/risk-preference')}>返回</Button></>}>
    <Section title="基本信息"><div className="detail-grid"><b>方案编号<span>{item.code}</span></b><b>方案名称<span>{item.name}</span></b><b>覆盖机构范围<span>{item.institution}</span></b><b>生效时间<span>{item.effectiveDate} 至 {item.expiryDate}</span></b><b>方案状态<span><StatusTag value={item.status} /></span></b><b>编制部门<span>{item.department}</span></b><b>编制依据<span>{item.basis}</span></b></div></Section>
    <InteractiveWorkflow definition={riskPreferenceWorkflow} instance={workflow} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />
    <WorkflowFeedbackOverview definition={riskPreferenceWorkflow} instance={workflow} role={role} institution={item.institution} selectedNodeId={selectedNodeId} onReturnCurrent={() => setSelectedNodeId(workflow.currentNodeId)} />
    <Tabs active={tab} onChange={setTab} items={['概览', '风险偏好指标明细', '方案附件']} />
    {tab === '概览' && <Section title="方案概览"><div className="read-block"><b>定性风险偏好陈述</b><p>{item.statement}</p><b>方案说明</b><p>{item.summary}</p></div></Section>}
    {tab === '风险偏好指标明细' && <Section title="风险偏好指标明细"><Table><thead><tr><th>序号</th><th>风险类别</th><th>指标名称</th><th>指标定义</th><th>单位</th><th>适用机构</th><th>监测频率</th><th>预警值</th><th>容忍值</th><th>生效时间</th></tr></thead><tbody>{item.indicators.map((indicator, index) => <tr key={indicator.id}><td>{index + 1}</td><td>{indicator.category}</td><td>{indicator.name}</td><td>{indicator.definition}</td><td>{indicator.unit}</td><td>{indicator.institution}</td><td>{indicator.frequency}</td><td>{indicator.warning}</td><td>{indicator.tolerance}</td><td>{indicator.effectiveDate}</td></tr>)}</tbody></Table></Section>}
    {tab === '方案附件' && <Section title="方案附件"><div className="file-list">{item.attachments.length ? item.attachments.map(file => <div className="file-row" key={file.id}><span>▣ {file.name}</span><small>{formatSize(file.size)}</small><TextAction onClick={() => downloadText(file.name + '.txt', '风险偏好方案附件预览')}>下载</TextAction></div>) : <div className="inline-empty">暂无附件</div>}</div></Section>}
    <Section title="操作记录"><OperationHistory logs={item.logs} /></Section>
  </Page>;
}


function WarningRules({ state, role, navigate, update, toast }: PageProps) {
  const [q, setQ] = useState({ code: '', indicator: '', risk: '', institution: '', status: '', running: true });
  const [statusItem, setStatusItem] = useState<WarningRule | null>(null);
  const [maintenanceItem, setMaintenanceItem] = useState<WarningRule | null>(null);
  const [letterModeItem, setLetterModeItem] = useState<WarningRule | null>(null);
  const [recordItem, setRecordItem] = useState<WarningRule | null>(null);
  const items = state.warningRules.filter(item => (!q.code || item.code.includes(q.code)) && (!q.indicator || item.indicator.includes(q.indicator)) && (!q.risk || item.riskType === q.risk) && (!q.institution || item.institution === q.institution) && (!q.status || item.status === q.status) && (!q.running || item.status === '生效'));
  const submitStatus = (item: WarningRule, target: WarningRule['status'], date: string, reason: string, review: boolean, files: Attachment[]) => {
    update(current => {
      const targetRule = current.warningRules.find(rule => rule.id === item.id);
      if (targetRule) warningRuleService.submitStatusChange(targetRule, target, date, reason, files, role, review);
    });
    setStatusItem(null);
    toast(review ? '状态变更申请已提交审核' : '规则状态已更新并保留操作记录');
  };
  const submitLetterMode = (item: WarningRule, mode: NonNullable<WarningRule['letterDeliveryMode']>, reason: string, effectiveDate: string) => {
    update(current => {
      const targetRule = current.warningRules.find(rule => rule.id === item.id);
      if (targetRule) warningRuleService.stageLetterDeliveryMode(targetRule, mode, reason, effectiveDate, role);
    });
    setLetterModeItem(null);
    toast('提示函下发方式变更已提交审核，现行方式保持不变');
  };
  return <Page title="风险预警规则管理" breadcrumb={['预警管理', '风险预警规则管理']} actions={canEditWarningRuleConfig(role) && <Button onClick={() => navigate('/warning/rules/new/config')}>＋ 预警规则新增</Button>}>
    <SearchPanel onSearch={() => undefined} onReset={() => setQ({ code: '', indicator: '', risk: '', institution: '', status: '', running: true })}>
      <Field label="生效起止时间"><div className="date-range"><Input type="date" /><span>~</span><Input type="date" /></div></Field>
      <Field label="指标风险类型"><Select value={q.risk} onChange={value => setQ({ ...q, risk: value })} options={riskTypes} /></Field>
      <Field label="适用机构"><Select value={q.institution} onChange={value => setQ({ ...q, institution: value })} options={institutions} /></Field>
      <Field label="规则状态"><Select value={q.status} onChange={value => setQ({ ...q, status: value })} options={['草稿', '未生效', '待审核', '状态变更待审核', '规则配置变更待审核', '提示函方式变更待审核', '被退回', '生效', '暂停预警', '停用', '作废']} /></Field>
      <Field label="规则编号"><Input value={q.code} onChange={value => setQ({ ...q, code: value })} placeholder="请输入规则编号" /></Field>
      <Field label="指标名称"><Input value={q.indicator} onChange={value => setQ({ ...q, indicator: value })} placeholder="请输入指标名称" /></Field>
      <label className="check-field"><input type="checkbox" checked={q.running} onChange={event => setQ({ ...q, running: event.target.checked })} /> 仅展示运行中规则</label>
    </SearchPanel>
    <div className="list-toolbar"><div>{canEditWarningRuleConfig(role) && <Button variant="secondary" onClick={() => toast('批量上传模板已下载')}>＋ 批量规则上传</Button>}<Button variant="secondary" onClick={() => downloadCSV('预警规则.csv', [['规则编号', '指标名称', '状态'], ...items.map(item => [item.code, item.indicator, item.status])])}>⇩ 导出</Button></div><span>共 {items.length} 条</span></div>
    <Table><thead><tr><th>序号</th><th>指标名称</th><th>指标风险类型</th><th>适用机构</th><th>监测频率</th><th>规则编号</th><th>规则类型</th><th>提示函下发方式</th><th>黄灯规则</th><th>红灯规则</th><th>生效时间</th><th>规则状态</th><th>操作</th><th>操作记录</th><th>规则配置</th></tr></thead><tbody>{items.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.indicator}</td><td>{item.riskType}</td><td>{item.institution}</td><td>{item.frequency}</td><td>{item.code}</td><td>{item.ruleType}</td><td>{letterDeliveryModeLabels[item.letterDeliveryMode || 'manual']}</td><td>{item.yellow}</td><td>{item.red}</td><td>{item.effectiveDate}</td><td><StatusTag value={item.status} /></td><td className="actions">{canMaintainWarningRule(role) && <TextAction onClick={() => setMaintenanceItem(item)}>维护</TextAction>}{canApproveWarningRule(role, item) && <TextAction onClick={() => navigate('/warning/rules/' + item.id + '/approve')}>审核</TextAction>}{!canMaintainWarningRule(role) && !canApproveWarningRule(role, item) && '—'}</td><td><TextAction onClick={() => setRecordItem(item)}>查看</TextAction></td><td>{canViewWarningRuleConfig(role, item) && <TextAction onClick={() => navigate('/warning/rules/' + item.id + '/config')}>查看</TextAction>}{canEditWarningRuleConfig(role) && <TextAction onClick={() => navigate('/warning/rules/' + item.id + '/config/edit')}>编辑</TextAction>}</td></tr>)}</tbody></Table>
    {statusItem && <StatusModal item={statusItem} onClose={() => setStatusItem(null)} onSubmit={submitStatus} />}
    {maintenanceItem && <RuleMaintenanceModal item={maintenanceItem} role={role} onClose={() => setMaintenanceItem(null)} onStatus={() => { setMaintenanceItem(null); setStatusItem(maintenanceItem); }} onLetterMode={() => { setMaintenanceItem(null); setLetterModeItem(maintenanceItem); }} />}
    {letterModeItem && <LetterDeliveryModeModal item={letterModeItem} onClose={() => setLetterModeItem(null)} onSubmit={submitLetterMode} />}
    {recordItem && <RuleOperationModal item={recordItem} onClose={() => setRecordItem(null)} />}
  </Page>;
}

function RuleMaintenanceModal({ item, role, onClose, onStatus, onLetterMode }: { item: WarningRule; role: Role; onClose: () => void; onStatus: () => void; onLetterMode: () => void }) {
  return <Modal title="预警规则维护" onClose={onClose} footer={<Button variant="secondary" onClick={onClose}>关闭</Button>}>
    <div className="detail-grid"><b>规则编号<span>{item.code}</span></b><b>指标名称<span>{item.indicator}</span></b><b>适用机构<span>{item.institution}</span></b><b>当前状态<span><StatusTag value={item.status} /></span></b><b>当前提示函方式<span>{letterDeliveryModeLabels[item.letterDeliveryMode || 'manual']}</span></b></div>
    <div className="maintenance-choice-grid">
      <button onClick={onStatus} disabled={!canMaintainWarningRuleStatus(role)}><b>预警状态编辑</b><span>维护规则生效、暂停、停用或作废状态，并保留审批记录。</span></button>
      <button onClick={onLetterMode} disabled={!canMaintainLetterDeliveryMode(role)}><b>提示函下发方式</b><span>调整自动发函、不发函或手动发函方式，提交后进入审核。</span></button>
    </div>
  </Modal>;
}

function LetterDeliveryModeModal({ item, onClose, onSubmit }: { item: WarningRule; onClose: () => void; onSubmit: (item: WarningRule, mode: NonNullable<WarningRule['letterDeliveryMode']>, reason: string, effectiveDate: string) => void }) {
  const [mode, setMode] = useState<NonNullable<WarningRule['letterDeliveryMode']>>(item.letterDeliveryMode || 'manual');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(today());
  const submit = () => {
    if (!reason || !effectiveDate) return window.alert('请填写变更原因和生效日期');
    if (mode === (item.letterDeliveryMode || 'manual')) return window.alert('请选择不同于当前配置的下发方式');
    onSubmit(item, mode, reason, effectiveDate);
  };
  return <Modal title="提示函下发方式维护" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>取消</Button><Button onClick={submit}>提交审核</Button></>}>
    <div className="detail-grid"><b>规则编号<span>{item.code}</span></b><b>指标名称<span>{item.indicator}</span></b><b>当前方式<span>{letterDeliveryModeLabels[item.letterDeliveryMode || 'manual']}</span></b></div>
    <div className="setting-mode-grid">{(Object.keys(letterDeliveryModeLabels) as NonNullable<WarningRule['letterDeliveryMode']>[]).map(value => <label className={mode === value ? 'selected' : ''} key={value}><input type="radio" checked={mode === value} onChange={() => setMode(value)} /><b>{letterDeliveryModeLabels[value]}</b><span>{value === 'auto' ? '规则触发亮灯后由系统直接模拟下发提示函。' : value === 'none' ? '规则触发时只亮灯，不生成提示函。' : '亮灯后生成待下发提示，由金控公司人工确认。'}</span></label>)}</div>
    <div className="form-grid"><Field label="变更后方式" required><Input value={letterDeliveryModeLabels[mode]} disabled /></Field><Field label="计划生效日期" required><Input type="date" value={effectiveDate} onChange={setEffectiveDate} /></Field><Field label="变更原因" required span={2}><Textarea value={reason} onChange={setReason} /></Field></div>
  </Modal>;
}

function StatusModal({ item, onClose, onSubmit }: { item: WarningRule; onClose: () => void; onSubmit: (item: WarningRule, target: WarningRule['status'], date: string, reason: string, review: boolean, files: Attachment[]) => void }) {
  const options = item.status === '生效' ? ['停用', '暂停预警', '删除或作废'] : item.status === '暂停预警' ? ['恢复预警', '停用', '删除或作废'] : item.status === '停用' ? ['生效', '删除或作废'] : ['生效', '删除或作废'];
  const [target, setTarget] = useState(options[0]);
  const [date, setDate] = useState(today());
  const [reason, setReason] = useState('');
  const [review, setReview] = useState(true);
  const [files, setFiles] = useState<Attachment[]>([]);
  const submit = () => {
    if (!reason) return window.alert('请输入状态变更原因');
    const mappedTarget = target === '恢复预警' ? '生效' : target === '删除或作废' ? '作废' : target;
    onSubmit(item, mappedTarget as WarningRule['status'], date, reason, review, files);
  };
  return <Modal title="预警规则状态编辑" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>取消</Button><Button onClick={submit}>确认提交</Button></>}>
    <div className="modal-note">状态维护与规则配置相互独立；已进入正式运行的规则只允许停用或作废，不进行物理删除。</div>
    <div className="detail-grid"><b>规则编号<span>{item.code}</span></b><b>指标名称<span>{item.indicator}</span></b><b>当前状态<span><StatusTag value={item.status} /></span></b></div>
    <div className="form-grid"><Field label="目标状态" required><Select value={target} onChange={setTarget} options={options} /></Field><Field label="生效时间" required><Input type="date" value={date} onChange={setDate} /></Field><Field label="状态变更原因" required span={2}><Textarea value={reason} onChange={setReason} /></Field></div>
    <Field label="状态变更附件"><FileUploader files={files} onChange={setFiles} /></Field>
    <label className="check-field"><input type="checkbox" checked={review} onChange={event => setReview(event.target.checked)} /> 提交审核</label>
  </Modal>;
}

function RuleOperationModal({ item, onClose }: { item: WarningRule; onClose: () => void }) {
  const records = item.operationRecords || [];
  return <Modal title={'操作记录 · ' + item.code} onClose={onClose} footer={<Button variant="secondary" onClick={onClose}>关闭</Button>}>
    <Table><thead><tr><th>操作类型</th><th>操作前状态</th><th>操作后状态</th><th>操作人 / 角色</th><th>操作时间</th><th>操作原因</th><th>审批意见</th><th>附件</th><th>版本号</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><td>{record.action}</td><td>{record.beforeStatus}</td><td>{record.afterStatus}</td><td>{record.operator}<small className="table-subtext">{record.role}</small></td><td>{record.time}</td><td>{record.reason}</td><td>{record.opinion}</td><td>{record.attachments.length ? record.attachments.map(file => file.name).join('、') : '—'}</td><td>{record.version}</td></tr>)}</tbody></Table>
    {!records.length && <div className="inline-empty">暂无结构化操作记录</div>}
  </Modal>;
}

function RuleConfig({ state, role, navigate, update, toast }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const existing = state.warningRules.find(item => item.id === id);
  const source = existing?.pendingConfig || existing;
  const [rule, setRule] = useState<WarningRule>(() => ({ id: existing?.id || uid('wr'), code: existing?.code || '系统自动生成', indicator: source?.indicator || '', riskType: source?.riskType || '', institution: source?.institution || '', frequency: source?.frequency || '月度', ruleType: source?.ruleType || '阈值预警', yellow: source?.yellow || '', red: source?.red || '', effectiveDate: source?.effectiveDate || '', status: existing?.status || '未生效', nodes: structuredClone(source?.nodes || [{ id: uid('node'), threshold: '', light: '黄灯' }, { id: uid('node'), threshold: '', light: '红灯' }]), segments: structuredClone(source?.segments || []), pushMethods: [...(source?.pushMethods || ['平台通知'])], submitter: source?.submitter || role, logs: existing?.logs || [] }));
  const [letterDeliveryMode, setLetterDeliveryMode] = useState<NonNullable<WarningRule['letterDeliveryMode']>>(source?.letterDeliveryMode || existing?.letterDeliveryMode || 'manual');
  const [reason, setReason] = useState(existing?.pendingConfig?.reason || '');
  if (!canEditWarningRuleConfig(role)) return <Page title="预警规则配置编辑" breadcrumb={['预警管理', '风险预警规则管理']} actions={<Button variant="secondary" onClick={() => navigate('/warning/rules')}>返回</Button>}><div className="empty-state"><div className="empty-icon">!</div><h2>当前角色无权编辑规则配置</h2></div></Page>;
  const generate = () => {
    const nodes = rule.nodes.filter(node => node.threshold).sort((a, b) => Number(a.threshold) - Number(b.threshold));
    setRule({ ...rule, nodes, yellow: nodes[0] ? '≥' + nodes[0].threshold + '%' : '', red: nodes[1] ? '≥' + nodes[1].threshold + '%' : '', segments: [{ name: '区间1', range: '< ' + (nodes[0]?.threshold || '—') + '%', light: '绿灯（不预警）' }, ...nodes.slice(0, -1).map((node, index) => ({ name: '区间' + (index + 2), range: node.threshold + '% - ' + nodes[index + 1].threshold + '%', light: '黄灯' })), { name: '区间' + (nodes.length + 1), range: '≥ ' + (nodes[nodes.length - 1]?.threshold || '—') + '%', light: '红灯' }] });
  };
  const submit = () => {
    if (!rule.indicator || !rule.institution || !rule.effectiveDate || !reason) return toast('请填写适用机构、指标名称、生效时间和配置变更原因');
    update(current => {
      let item = current.warningRules.find(candidate => candidate.id === id);
      const isNew = !item;
      if (!item) item = warningRuleService.create(current, role);
      if (isNew) Object.assign(item, { indicator: rule.indicator, riskType: rule.riskType, institution: rule.institution, frequency: rule.frequency, ruleType: rule.ruleType, yellow: rule.yellow, red: rule.red, effectiveDate: rule.effectiveDate, nodes: structuredClone(rule.nodes), segments: structuredClone(rule.segments), pushMethods: [...rule.pushMethods], submitter: rule.submitter });
      warningRuleService.stageConfig(item, { indicator: rule.indicator, riskType: rule.riskType, institution: rule.institution, frequency: rule.frequency, ruleType: rule.ruleType, yellow: rule.yellow, red: rule.red, effectiveDate: rule.effectiveDate, nodes: structuredClone(rule.nodes), segments: structuredClone(rule.segments), pushMethods: [...rule.pushMethods], letterDeliveryMode, submitter: rule.submitter, reason }, role);
    });
    toast(existing ? '配置变更已形成待审核版本，当前生效版本未被覆盖' : '新规则配置已提交审核');
    navigate('/warning/rules');
  };
  return <Page title={existing ? '预警规则配置 - 编辑' : '预警规则配置 - 新增'} breadcrumb={['预警管理', '风险预警规则管理', existing ? '配置编辑' : '新增规则']} actions={<><Button variant="secondary" onClick={() => navigate('/warning/rules')}>取消</Button><Button onClick={submit}>提交审核</Button></>}>
    {existing?.versions?.length ? <div className="modal-note">当前生效版本：{existing.versions[0].version}。本次修改将生成新版本，审核通过前不会覆盖当前配置。</div> : null}
    <Section title="提示函下发方式"><Field label="提示函下发方式" required><Select value={letterDeliveryModeLabels[letterDeliveryMode]} onChange={value => setLetterDeliveryMode((Object.entries(letterDeliveryModeLabels).find(([, label]) => label === value)?.[0] || 'manual') as NonNullable<WarningRule['letterDeliveryMode']>)} options={Object.values(letterDeliveryModeLabels)} /></Field></Section>
    <Section title="基本信息"><div className="form-grid"><Field label="规则适用机构" required><Select value={rule.institution} onChange={value => setRule({ ...rule, institution: value })} options={institutions} /></Field><Field label="指标名称" required><Select value={rule.indicator} onChange={value => setRule({ ...rule, indicator: value, riskType: state.indicators.find(item => item.name === value)?.subtype || rule.riskType })} options={state.indicators.map(item => item.name)} /></Field><Field label="指标风险类型"><Input value={rule.riskType} onChange={value => setRule({ ...rule, riskType: value })} /></Field><Field label="监测频率"><Select value={rule.frequency} onChange={value => setRule({ ...rule, frequency: value })} options={['日度', '月度', '季度', '年度']} /></Field><Field label="规则类型"><Select value={rule.ruleType} onChange={value => setRule({ ...rule, ruleType: value })} options={['指标绝对值', '同比增幅', '同比绝对值', '环比增幅', '环比绝对值']} /></Field><Field label="生效时间" required><Input type="date" value={rule.effectiveDate} onChange={value => setRule({ ...rule, effectiveDate: value })} /></Field></div></Section>
    <Section title="预警值分段节点" extra={<Button variant="secondary" onClick={() => setRule({ ...rule, nodes: [...rule.nodes, { id: uid('node'), threshold: '', light: '绿灯（不预警）' }] })}>＋ 新增分段节点</Button>}><Table><thead><tr><th>节点</th><th>阈值（%）</th><th>节点赋灯</th><th>操作</th></tr></thead><tbody>{rule.nodes.map((node, index) => <tr key={node.id}><td>节点{index + 1}</td><td><Input value={node.threshold} onChange={value => setRule({ ...rule, nodes: rule.nodes.map(item => item.id === node.id ? { ...item, threshold: value } : item) })} /></td><td><Select value={node.light} onChange={value => setRule({ ...rule, nodes: rule.nodes.map(item => item.id === node.id ? { ...item, light: value } : item) })} options={['红灯', '黄灯', '绿灯（不预警）']} /></td><td><TextAction onClick={() => setRule({ ...rule, nodes: rule.nodes.filter(item => item.id !== node.id) })}>删除</TextAction></td></tr>)}</tbody></Table><Button variant="secondary" onClick={generate}>生成分段区间</Button></Section>
    <Section title="区间及节点赋灯"><Table><thead><tr><th>区间</th><th>区间范围</th><th>区间预警灯</th><th>节点赋灯说明</th></tr></thead><tbody>{rule.segments.map((segment, index) => <tr key={segment.name}><td>{segment.name}</td><td>{segment.range}</td><td><Select value={segment.light} onChange={value => setRule({ ...rule, segments: rule.segments.map((item, itemIndex) => itemIndex === index ? { ...item, light: value } : item) })} options={['红灯', '黄灯', '绿灯（不预警）']} /></td><td>指标值进入该区间时触发对应灯号</td></tr>)}</tbody></Table></Section>
    <Section title="推送及提交"><div className="form-grid"><Field label="推送方式"><div className="checks">{['邮件', 'OA系统内', '平台通知'].map(method => <label key={method}><input type="checkbox" checked={rule.pushMethods.includes(method)} onChange={() => setRule({ ...rule, pushMethods: rule.pushMethods.includes(method) ? rule.pushMethods.filter(item => item !== method) : [...rule.pushMethods, method] })} />{method}</label>)}</div></Field><Field label="提交人"><Input value={rule.submitter} disabled /></Field><Field label="配置变更原因" required span={2}><Textarea value={reason} onChange={setReason} /></Field></div></Section>
  </Page>;
}

function RuleConfigView({ state, role, navigate }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const item = state.warningRules.find(rule => rule.id === id);
  if (!item || !canViewWarningRuleConfig(role, item)) return <Page title="规则配置查看" breadcrumb={['预警管理', '风险预警规则管理']} actions={<Button variant="secondary" onClick={() => navigate('/warning/rules')}>返回</Button>}><div className="empty-state"><h2>无权查看该规则配置</h2></div></Page>;
  return <Page title="预警规则配置 - 查看" breadcrumb={['预警管理', '风险预警规则管理', item.code]} actions={<><Button variant="secondary" onClick={() => navigate('/warning/rules')}>返回</Button>{canEditWarningRuleConfig(role) && <Button onClick={() => navigate('/warning/rules/' + item.id + '/config/edit')}>编辑配置</Button>}</>}>
    {item.pendingConfig && <div className="modal-note">存在待审核配置 {item.pendingConfig.version}，当前页面仍展示现行版本。</div>}
    <div className="read-row">提示函下发方式：<b>{letterDeliveryModeLabels[item.letterDeliveryMode || 'manual']}</b></div>
    <Section title="基本信息"><div className="detail-grid"><b>规则编号<span>{item.code}</span></b><b>指标名称<span>{item.indicator}</span></b><b>指标风险类型<span>{item.riskType}</span></b><b>适用机构<span>{item.institution}</span></b><b>监测频率<span>{item.frequency}</span></b><b>规则类型<span>{item.ruleType}</span></b><b>生效期间<span>{item.effectiveDate} 至 长期</span></b><b>规则状态<span><StatusTag value={item.status} /></span></b><b>黄灯规则<span>{item.yellow}</span></b><b>红灯规则<span>{item.red}</span></b></div></Section>
    <Section title="历史趋势或历史阈值"><Table><thead><tr><th>版本号</th><th>生效日期</th><th>黄灯规则</th><th>红灯规则</th><th>状态</th><th>变更原因</th></tr></thead><tbody>{(item.versions || []).map(version => <tr key={version.version}><td>{version.version}</td><td>{version.effectiveDate}</td><td>{version.yellow}</td><td>{version.red}</td><td>{version.status}</td><td>{version.reason}</td></tr>)}</tbody></Table></Section>
    <Section title="分段节点、区间及赋灯"><Table><thead><tr><th>节点</th><th>阈值</th><th>区间</th><th>区间赋灯</th><th>节点赋灯</th></tr></thead><tbody>{item.nodes.map((node, index) => <tr key={node.id}><td>节点{index + 1}</td><td>{node.threshold}%</td><td>{item.segments[index]?.range || '—'}</td><td><StatusTag value={item.segments[index]?.light || '绿灯'} /></td><td><StatusTag value={node.light} /></td></tr>)}</tbody></Table></Section>
    <Section title="推送及提交信息"><div className="detail-grid"><b>推送方式<span>{item.pushMethods.join('、')}</span></b><b>提交人<span>{item.submitter}</span></b><b>当前版本<span>{item.versions?.[0]?.version || 'V1.0'}</span></b></div></Section>
    <Section title="操作记录"><OperationHistory logs={item.logs} /></Section>
  </Page>;
}

function RuleApprove({ state, role, navigate, update, toast }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const item = state.warningRules.find(rule => rule.id === id);
  const [opinion, setOpinion] = useState('');
  if (!item || !canApproveWarningRule(role, item)) return <Page title="预警规则审核" breadcrumb={['预警管理', '风险预警规则管理']} actions={<Button variant="secondary" onClick={() => navigate('/warning/rules')}>返回</Button>}><div className="empty-state"><div className="empty-icon">!</div><h2>当前规则不在可审核状态或当前角色无审核权限</h2></div></Page>;
  const pending = item.pendingConfig;
  const pendingLetter = item.pendingLetterDelivery;
  const operation = [...(item.operationRecords || [])].reverse().find(record => record.opinion === '待审核');
  const nodes = pending?.nodes || item.nodes;
  const segments = pending?.segments || item.segments;
  const act = (pass: boolean) => {
    if (!opinion) return toast('请填写审批意见');
    update(current => {
      const target = current.warningRules.find(rule => rule.id === item.id);
      if (target) warningRuleService.approve(target, pass, opinion, role);
    });
    toast(pass ? '审核通过，待审核版本或状态已正式生效' : '已驳回并保留本次提交记录');
    navigate('/warning/rules');
  };
  return <Page title="预警规则审核" breadcrumb={['预警管理', '风险预警规则管理', '审核']} actions={<Button variant="secondary" onClick={() => navigate('/warning/rules')}>返回</Button>}>
    <WorkflowSteps steps={['提交变更', '金控公司审核', '发布生效']} current={1} />
    {pendingLetter && <Section title="提示函下发方式变更"><div className="detail-grid"><b>当前方式<span>{letterDeliveryModeLabels[pendingLetter.currentMode]}</span></b><b>拟变更方式<span>{letterDeliveryModeLabels[pendingLetter.requestedMode]}</span></b><b>变更原因<span>{pendingLetter.reason}</span></b><b>计划生效日期<span>{pendingLetter.effectiveDate}</span></b><b>申请人<span>{pendingLetter.applicant}</span></b><b>申请时间<span>{pendingLetter.appliedAt}</span></b></div></Section>}
    <Section title="规则基本信息"><div className="detail-grid"><b>规则编号<span>{item.code}</span></b><b>指标名称<span>{pending?.indicator || item.indicator}</span></b><b>适用机构<span>{pending?.institution || item.institution}</span></b><b>规则类型<span>{pending?.ruleType || item.ruleType}</span></b><b>当前状态<span>{item.status}</span></b><b>黄灯规则<span>{pending?.yellow || item.yellow}</span></b><b>红灯规则<span>{pending?.red || item.red}</span></b><b>提交版本<span>{pending?.version || operation?.version || 'V1.0'}</span></b></div></Section>
    <Section title="当前提交配置（只读）"><Table><thead><tr><th>节点</th><th>阈值</th><th>区间</th><th>区间预警灯</th><th>节点赋灯</th></tr></thead><tbody>{nodes.map((node, index) => <tr key={node.id}><td>节点{index + 1}</td><td>{node.threshold}%</td><td>{segments[index]?.range || '—'}</td><td><StatusTag value={segments[index]?.light || '绿灯'} /></td><td><StatusTag value={node.light} /></td></tr>)}</tbody></Table><div className="read-row">推送方式：{(pending?.pushMethods || item.pushMethods).join('、')}</div></Section>
    <Section title="历史规则"><Table><thead><tr><th>版本</th><th>生效日期</th><th>黄灯规则</th><th>红灯规则</th><th>状态</th><th>原因</th></tr></thead><tbody>{(item.versions || []).map(version => <tr key={version.version}><td>{version.version}</td><td>{version.effectiveDate}</td><td>{version.yellow}</td><td>{version.red}</td><td>{version.status}</td><td>{version.reason}</td></tr>)}</tbody></Table></Section>
    <Section title="提交信息"><div className="detail-grid"><b>审核类型<span>{pendingLetter ? '提示函下发方式变更' : pending ? '规则配置变更' : '预警状态变更'}</span></b><b>提交人<span>{pendingLetter?.applicant || pending?.submitter || operation?.operator || item.submitter}</span></b><b>提交时间<span>{pendingLetter?.appliedAt || pending?.submittedAt || operation?.time || '—'}</span></b><b>变更原因<span>{pendingLetter?.reason || pending?.reason || operation?.reason || '—'}</span></b><b>附件<span>{operation?.attachments.length ? operation.attachments.map(file => file.name).join('、') : '无附件'}</span></b></div></Section>
    <Section title="审批意见"><Field label="审批意见" required><Textarea value={opinion} onChange={setOpinion} /></Field><div className="form-actions"><Button variant="danger" onClick={() => act(false)}>驳回</Button><Button onClick={() => act(true)}>通过</Button></div></Section>
  </Page>;
}

function LegacyWarningDisposalList({ state, role, navigate, update, toast }: PageProps) {
  const [q, setQ] = useState({ level: '', institution: '', risk: '', indicator: '', status: '' });
  const items = state.warningDisposals.filter(x => (!q.level || x.level === q.level) && (!q.institution || x.institution === q.institution) && (!q.risk || x.riskType === q.risk) && (!q.indicator || x.indicator.includes(q.indicator)) && (!q.status || x.status === q.status));
  const sendLetter = (item: WarningDisposal) => {
    if (!window.confirm(`确认向“${item.institution}”下发提示函 ${item.letterNo} 吗？`)) return;
    let sent = false;
    update(current => { sent = warningLetterService.send(current, item.id, role); });
    toast(sent ? '提示函已下发，流程已进入各金融机构原因分析节点' : '当前事项不满足手动下发条件');
  };
  return <Page title="预警提示与处置" breadcrumb={['预警管理', '预警提示与处置']}><SearchPanel onSearch={() => undefined} onReset={() => setQ({ level: '', institution: '', risk: '', indicator: '', status: '' })}><Field label="预警等级"><Select value={q.level} onChange={v => setQ({ ...q, level: v })} options={['黄灯', '红灯']} /></Field><Field label="所属机构"><Select value={q.institution} onChange={v => setQ({ ...q, institution: v })} options={role === '各金融机构' ? [currentInstitution] : institutions} disabled={role === '各金融机构'} /></Field><Field label="风险类型"><Select value={q.risk} onChange={v => setQ({ ...q, risk: v })} options={riskTypes} /></Field><Field label="指标名称"><Input value={q.indicator} onChange={v => setQ({ ...q, indicator: v })} /></Field><Field label="处理状态"><Select value={q.status} onChange={v => setQ({ ...q, status: v })} options={['待填写原因分析答复', '待提交应对处置方案', '待审阅处置方案', '持续跟踪执行情况', '待评估反馈']} /></Field><Field label="预警时间"><div className="date-range"><Input type="date" /><span>~</span><Input type="date" /></div></Field></SearchPanel><div className="list-toolbar"><span>预警事项列表 · {items.length} 条</span><Button variant="secondary" onClick={() => downloadCSV('预警事项.csv', [['提示函号', '等级', '机构', '规则版本', '提示函方式', '函件状态'], ...items.map(x => [x.letterNo, x.level, x.institution, x.ruleVersion || 'V1.0', letterDeliveryModeLabels[x.letterDeliveryMode || 'manual'], x.letterStatus || '待下发'])])}>⇩ 导出</Button></div><Table><thead><tr><th>序号</th><th>预警等级</th><th>所属机构</th><th>风险类型</th><th>指标名称</th><th>关联规则</th><th>规则版本</th><th>提示函方式</th><th>提示函号</th><th>函件状态</th><th>处理状态</th><th>预警时间</th><th>操作</th></tr></thead><tbody>{items.map((item, i) => { const manual = canManuallySendWarningLetter(role) && item.letterDeliveryMode === 'manual' && item.letterStatus === '待下发'; return <tr key={item.id}><td>{i + 1}</td><td><StatusTag value={item.level} /></td><td>{item.institution}</td><td>{item.riskType}</td><td>{item.indicator}</td><td>{state.warningRules.find(rule => rule.id === item.associatedRuleId)?.code || '—'}</td><td>{item.ruleVersion || 'V1.0'}</td><td>{letterDeliveryModeLabels[item.letterDeliveryMode || 'manual']}</td><td>{item.letterNo}</td><td><StatusTag value={item.letterStatus || '待下发'} /></td><td><button className="status-link" onClick={() => navigate(`/warning/disposal/${item.id}`)}><StatusTag value={item.status} /></button></td><td>{item.triggerDate}</td><td><TextAction onClick={() => navigate(`/warning/disposal/${item.id}`)}>查看详情</TextAction>{manual && <TextAction onClick={() => sendLetter(item)}>下发提示函</TextAction>}</td></tr>; })}</tbody></Table><Pagination total={items.length} page={1} setPage={() => undefined} /></Page>;
}

function LegacyWarningDisposalDetail({ state, role, navigate, update, toast }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const item = state.warningDisposals.find(disposal => disposal.id === id);
  if (!item) return <Page title="预警处置工单" breadcrumb={['预警管理', '预警提示与处置']} actions={<Button variant="secondary" onClick={() => navigate('/warning/disposal')}>返回</Button>}><div className="empty-state"><h2>无权查看该工单或工单不存在</h2></div></Page>;
  const workflow = item.workflow || { currentNodeId: 'reason-fill', records: [] };
  const [selectedNodeId, setSelectedNodeId] = useState(workflow.currentNodeId);
  const [form, setForm] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Attachment[]>([]);
  const fields: Record<string, string[]> = {
    'reason-fill': ['原因分析', '影响情况', '初步应对措施'],
    'reason-review': ['审核意见', '是否要求补充材料'],
    'plan-fill': ['处置目标', '处置措施', '责任部门', '责任人', '计划完成时间', '资源保障', '预期效果'],
    'plan-review': ['审核意见', '补充要求', '是否提交金融机构管理部门协同'],
    'management-coordination': ['管理意见', '协调事项', '管理要求', '是否需要向集团管理层汇报'],
    execution: ['本期执行情况', '已完成措施', '未完成措施', '存在问题', '风险变化', '下一步计划', '预计完成时间'],
    'tracking-release': ['跟踪意见', '是否达到处置目标', '是否解除预警', '是否继续跟踪', '是否发起指标或规则重检', '关闭意见'],
  };
  const currentNode = warningDisposalWorkflow.find(node => node.id === workflow.currentNodeId) || warningDisposalWorkflow[0];
  const canHandle = canHandleWorkflowNode(role, currentNode.id, item.institution);
  const submitNode = (action: '提交' | '通过' | '退回' | '追加反馈' | '完成反馈') => {
    const requiredField = fields[currentNode.id]?.[0];
    if (requiredField && !form[requiredField]) return toast('请填写' + requiredField);
    const returned = action === '退回';
    const keepCurrent = action === '追加反馈';
    const returnTarget = currentNode.id === 'reason-review' ? 'reason-fill' : currentNode.id === 'plan-review' ? 'plan-fill' : 'reason-fill';
    const nextIndex = warningDisposalWorkflow.findIndex(node => node.id === currentNode.id) + 1;
    const nextNodeId = returned ? returnTarget : keepCurrent ? currentNode.id : warningDisposalWorkflow[Math.min(nextIndex, warningDisposalWorkflow.length - 1)].id;
    update(current => {
      const target = current.warningDisposals.find(disposal => disposal.id === item.id);
      if (!target) return;
      target.workflow ||= { currentNodeId: currentNode.id, records: [] };
      workflowService.append(target.workflow, currentNode, { role, action, result: returned ? '退回修改' : action === '通过' ? '审核通过' : action === '追加反馈' ? '本期反馈已提交' : '已提交', formData: { ...form }, opinion: form['审核意见'] || form['管理意见'] || form['跟踪意见'], returnReason: returned ? form['审核意见'] || '请补充完善后重新提交' : undefined, attachments: files, status: returned ? '已退回' : undefined });
      if (returned) workflowService.returnTo(target.workflow, returnTarget);
      else if (!keepCurrent) workflowService.moveNext(target.workflow, warningDisposalWorkflow, currentNode.id);
      if (currentNode.id === 'reason-fill') target.reason = form['原因分析'] || target.reason;
      if (currentNode.id === 'reason-review') target.assessment = form['审核意见'] || target.assessment;
      if (currentNode.id === 'plan-fill') target.plan = form['处置措施'] || target.plan;
      if (currentNode.id === 'plan-review') target.review = form['审核意见'] || target.review;
      if (currentNode.id === 'execution') target.followUp = form['本期执行情况'] || target.followUp;
      if (currentNode.id === 'tracking-release') target.releaseAssessment = form['跟踪意见'] || target.releaseAssessment;
      const statuses: Record<string, string> = { 'reason-fill': '原因分析待审核', 'reason-review': returned ? '待填写原因分析答复' : '待提交应对处置方案', 'plan-fill': '待审阅处置方案', 'plan-review': returned ? '待提交应对处置方案' : '待管理协同', 'management-coordination': '持续跟踪执行情况', execution: keepCurrent ? '持续跟踪执行情况' : '待跟踪确认', 'tracking-release': form['是否解除预警'] === '否' ? '持续跟踪执行情况' : '已解除' };
      target.status = statuses[currentNode.id] || target.status;
      target.attachments = [...target.attachments, ...files];
      target.logs.push(createLog(action, currentNode.name + '：' + (returned ? '退回修改' : '处理完成'), role));
    });
    setForm({});
    setFiles([]);
    setSelectedNodeId(nextNodeId);
    toast(action === '退回' ? '已退回前一办理节点，历史审批记录已保留' : action === '追加反馈' ? '本期执行反馈已追加，未覆盖历史反馈' : '当前节点已提交并进入下一环节');
  };
  return <Page title={(item.level === '红灯' ? '重大风险提示函' : '预警提示函') + '处置工单'} breadcrumb={['预警管理', '预警提示与处置', item.letterNo]} actions={<Button variant="secondary" onClick={() => navigate('/warning/disposal')}>返回列表</Button>}>
    <Section title="工单基本信息"><div className="detail-grid"><b>工单编号<span>{item.letterNo}</span></b><b>事项名称<span>{item.indicator + '预警处置'}</span></b><b>所属机构<span>{item.institution}</span></b><b>风险类型<span>{item.riskType}</span></b><b>预警等级<span><StatusTag value={item.level} /></span></b><b>当前状态<span><StatusTag value={item.status} /></span></b><b>当前节点<span>{currentNode.name}</span></b><b>发起时间<span>{item.triggerDate}</span></b><b>发起人<span>系统监测</span></b><b>当前处理部门<span>{currentNode.department}</span></b><b>当前处理人<span>{currentNode.role}</span></b><b>要求完成时间<span>{item.expectedReleaseDate || '按流程要求完成'}</span></b></div></Section>
    <InteractiveWorkflow definition={warningDisposalWorkflow} instance={workflow} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />
    <Section title="预警基本信息"><div className="detail-grid"><b>指标当前值<span>{item.value}</span></b><b>黄灯或红灯规则<span>{item.rule}</span></b><b>触发时间<span>{item.triggerDate}</span></b><b>当前灯号<span><StatusTag value={item.signal} /></span></b></div><div className="trend-card"><span>历史趋势</span><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /></div><b>{item.value}</b></div></Section>
    <WorkflowFeedbackOverview definition={warningDisposalWorkflow} instance={workflow} role={role} institution={item.institution} selectedNodeId={selectedNodeId} onReturnCurrent={() => setSelectedNodeId(workflow.currentNodeId)} />
    {selectedNodeId === workflow.currentNodeId && canHandle && <Section title={'当前节点操作 · ' + currentNode.name}><div className="current-node-note">前序节点内容均为只读，本区域只记录当前节点的新反馈。</div><div className="form-grid">{(fields[currentNode.id] || []).map((label, index) => <Field label={label} required={index === 0} key={label}>{label === '责任部门' ? <Input value={form[label] || ''} maxLength={100} placeholder="手工输入，多个部门请使用顿号或逗号分隔" onChange={value => setForm({ ...form, [label]: value })} /> : <Textarea value={form[label] || ''} onChange={value => setForm({ ...form, [label]: value })} />}</Field>)}</div><Field label="本节点附件"><FileUploader files={files} onChange={setFiles} /></Field><div className="form-actions">{['reason-review', 'plan-review'].includes(currentNode.id) && <Button variant="danger" onClick={() => submitNode('退回')}>退回</Button>}{currentNode.id === 'execution' ? <><Button variant="secondary" onClick={() => submitNode('追加反馈')}>提交本期反馈</Button><Button onClick={() => submitNode('完成反馈')}>提交并进入跟踪确认</Button></> : <Button onClick={() => submitNode(['reason-review', 'plan-review'].includes(currentNode.id) ? '通过' : '提交')}>{['reason-review', 'plan-review'].includes(currentNode.id) ? '通过' : '提交当前节点'}</Button>}</div></Section>}
    {selectedNodeId === workflow.currentNodeId && !canHandle && <div className="readonly-current-node">当前节点由“{currentNode.role}”办理，当前角色可查看全部历史反馈但不能修改。</div>}
    <Section title="完整操作记录"><OperationHistory logs={item.logs} /></Section>
  </Page>;
}

function WarningDisposalList({ state, role, navigate, update, toast }: PageProps) {
  const [q, setQ] = useState({ level: '', institution: '', risk: '', indicator: '', status: '' });
  const items = state.warningDisposals.filter(item => (!q.level || item.level === q.level) && (!q.institution || item.institution === q.institution) && (!q.risk || item.riskType === q.risk) && (!q.indicator || item.indicator.includes(q.indicator)) && (!q.status || item.status === q.status));
  const openOverview = (item: WarningDisposal) => navigate(`/warning/disposal/${item.id}/overview`);
  const sendLetter = (item: WarningDisposal) => {
    if (!window.confirm(`确认向“${item.institution}”下发提示函 ${item.letterNo} 吗？`)) return;
    let sent = false;
    update(current => { sent = warningLetterService.send(current, item.id, role); });
    toast(sent ? '提示函已下发，流程已进入各金融机构原因分析节点' : '当前事项不满足手动下发条件');
  };
  return <Page title="预警提示与处置" breadcrumb={['预警管理', '预警提示与处置']}>
    <SearchPanel onSearch={() => undefined} onReset={() => setQ({ level: '', institution: '', risk: '', indicator: '', status: '' })}>
      <Field label="预警等级"><Select value={q.level} onChange={level => setQ({ ...q, level })} options={['黄灯', '红灯']} /></Field>
      <Field label="所属机构"><Select value={q.institution} onChange={institution => setQ({ ...q, institution })} options={role === '各金融机构' ? [currentInstitution] : institutions} disabled={role === '各金融机构'} /></Field>
      <Field label="风险类型"><Select value={q.risk} onChange={risk => setQ({ ...q, risk })} options={riskTypes} /></Field>
      <Field label="指标名称"><Input value={q.indicator} onChange={indicator => setQ({ ...q, indicator })} /></Field>
      <Field label="处理状态"><Select value={q.status} onChange={status => setQ({ ...q, status })} options={['待下发预警提示函', '待下发重大风险提示', '原因分析中', '处置方案编制中', '待集团评估', '待集团审阅', '执行跟踪中', '待解除评估', '常态化跟踪', '已解除']} /></Field>
      <Field label="预警时间"><div className="date-range"><Input type="date" /><span>~</span><Input type="date" /></div></Field>
    </SearchPanel>
    <div className="list-toolbar"><span>预警事项列表 · {items.length} 条</span><Button variant="secondary" onClick={() => downloadCSV('预警事项.csv', [['提示函号', '等级', '机构', '指标', '当前节点', '状态'], ...items.map(item => [item.letterNo, item.level, item.institution, item.indicator, getWarningWorkflowSteps(item).find(node => node.id === item.workflow?.currentNodeId)?.name || '—', item.status])])}>⇩ 导出</Button></div>
    <Table><thead><tr><th>序号</th><th>预警等级</th><th>所属机构</th><th>风险类型</th><th>指标名称</th><th>提示类型</th><th>提示函号</th><th>提示函方式</th><th>函件状态</th><th>当前节点</th><th>处理状态</th><th>预警时间</th><th>操作</th></tr></thead><tbody>{items.map((item, index) => {
      const currentNode = getWarningWorkflowSteps(item).find(node => node.id === item.workflow?.currentNodeId);
      const manual = canManuallySendWarningLetter(role) && isWarningLetterPending(item);
      return <tr key={item.id}><td>{index + 1}</td><td><StatusTag value={item.level} /></td><td>{item.institution}</td><td>{item.riskType}</td><td>{item.indicator}</td><td>{item.noticeType || getWarningNoticeType(item.level)}</td><td>{item.letterNo}</td><td>{letterDeliveryModeLabels[item.letterDeliveryMode || 'manual']}</td><td><StatusTag value={item.letterStatus || '待下发'} /></td><td>{currentNode?.name || '—'}</td><td><button className="status-link" onClick={() => openOverview(item)}><StatusTag value={item.status} /></button></td><td>{item.triggerDate}</td><td><TextAction onClick={() => openOverview(item)}>查看详情</TextAction>{manual && <TextAction onClick={() => sendLetter(item)}>下发提示函</TextAction>}</td></tr>;
    })}</tbody></Table>
    <Pagination total={items.length} page={1} setPage={() => undefined} />
  </Page>;
}

function WarningDisposalOverview({ state, role, navigate, update, toast }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const item = state.warningDisposals.find(disposal => disposal.id === id);
  const requestedReturn = new URLSearchParams(window.location.search).get('returnTo');
  const returnPath = requestedReturn?.startsWith('/concentration-monitoring') ? requestedReturn : '/warning/disposal';
  if (!item || !canViewWarningOverview(role, item)) return <Page title="预警进度总览" breadcrumb={['预警管理', '预警提示与处置']} onClose={() => navigate(returnPath)} actions={<Button variant="secondary" onClick={() => navigate(returnPath)}>返回列表</Button>}><div className="empty-state"><h2>无权查看该事项或事项不存在</h2></div></Page>;
  const definition = getWarningWorkflowSteps(item);
  const workflow = item.workflow || { currentNodeId: definition[1].id, records: [] };
  const currentIndex = definition.findIndex(node => node.id === workflow.currentNodeId);
  const letterPending = isWarningLetterPending(item);
  const downloadAttachment = (file: Attachment) => {
    downloadText(file.name + '.txt', `文件：${file.name}\n类型：${file.type}\n大小：${formatSize(file.size)}\n上传时间：${file.uploadedAt}`);
    update(current => { current.warningDisposals.find(candidate => candidate.id === item.id)?.logs.push(createLog('下载附件', `下载附件：${file.name}`, role)); });
    toast('附件已下载并记录操作日志');
  };
  return <Page title="预警进度总览" breadcrumb={['预警管理', '预警提示与处置', item.letterNo, '进度总览']} onClose={() => navigate(returnPath)} actions={<Button variant="secondary" onClick={() => navigate(returnPath)}>返回列表</Button>}>
    <div className={`warning-overview-banner ${item.level === '红灯' ? 'red' : 'yellow'}`}><div><span>{item.noticeType || getWarningNoticeType(item.level)}</span><h2>{item.indicator}预警处置</h2><p>{item.institution} · {item.riskType} · {item.triggerDate}</p></div><div><StatusTag value={item.level} /><StatusTag value={item.status} /></div></div>
    <Section title="预警事项基本信息"><div className="detail-grid warning-info-grid"><b>提示编号<span>{item.letterNo}</span></b><b>机构名称<span>{item.institution}</span></b><b>指标编码<span>{item.indicatorCode || '—'}</span></b><b>指标名称<span>{item.indicator}</span></b><b>指标风险类型<span>{item.riskType}</span></b><b>监测频率<span>{item.monitoringFrequency || '—'}</span></b><b>指标期次<span>{item.period || '—'}</span></b><b>本期指标值<span>{item.value}</span></b><b>当期亮灯情况<span><StatusTag value={item.currentLightStatus || item.level} /></span></b><b>黄灯规则<span>{item.yellowRule || '—'}</span></b><b>红灯规则<span>{item.redRule || '—'}</span></b><b>提示类型<span>{item.noticeType || getWarningNoticeType(item.level)}</span></b><b>触发日期<span>{item.triggerDate}</span></b><b>关联预警规则编号<span>{item.ruleCode || state.warningRules.find(rule => rule.id === item.associatedRuleId)?.code || '—'}</span></b><b>规则版本<span>{item.ruleVersion || 'V1.0'}</span></b><b>提示函下发方式<span>{letterDeliveryModeLabels[item.letterDeliveryMode || 'manual']}</span></b><b>函件状态<span><StatusTag value={item.letterStatus || '待下发'} /></span></b><b>当前处理节点<span>{definition.find(node => node.id === workflow.currentNodeId)?.name || '—'}</span></b><b>事项状态<span><StatusTag value={item.status} /></span></b></div></Section>
    <Section title={item.level === '黄灯' ? '黄灯处置流程（5个节点）' : '红灯处置流程（7个节点）'}>
      <div className={`warning-overview-flow ${item.level === '红灯' ? 'red' : 'yellow'}`}>{definition.map((node, index) => {
        const nodeRecords = workflow.records.filter(record => record.nodeId === node.id);
        const latest = nodeRecords[nodeRecords.length - 1];
        const isCurrent = node.id === workflow.currentNodeId;
        const completed = !letterPending && (index < currentIndex || (!!latest && !['进行中', '已退回'].includes(latest.status) && !isCurrent) || node.role === '系统');
        const returned = latest?.status === '已退回';
        const canEdit = isCurrent && canHandleWarningNode(role, node.id, item);
        const canOpen = isCurrent || completed || nodeRecords.length > 0;
        const label = canEdit ? (node.role === '各金融机构' ? '填写' : '办理') : canOpen ? '查看' : '未开始';
        return <React.Fragment key={node.id}><div className={`warning-flow-node ${isCurrent ? 'current' : ''} ${completed ? 'completed' : ''} ${returned ? 'returned' : ''}`}><div className="warning-flow-index">{completed ? '✓' : index + 1}</div><b>{node.name}</b><span>{isCurrent ? '进行中' : returned ? '已退回' : completed ? '已完成' : '未开始'}</span><small>{latest ? `${latest.role} · ${latest.submittedAt}` : node.role}</small><Button variant={canEdit ? 'primary' : 'secondary'} disabled={!canOpen} onClick={() => navigate(`/warning/disposal/${item.id}/detail/${node.id}?mode=${canEdit ? 'edit' : 'view'}`)}>{label}</Button></div>{index < definition.length - 1 && <i className="warning-flow-arrow">›</i>}</React.Fragment>;
      })}</div>
    </Section>
    <Section title="处置附件"><div className="warning-attachment-list">{item.attachments.length ? item.attachments.map(file => <div key={file.id}><span>▣ {file.name}</span><small>{formatSize(file.size)} · {file.uploadedAt}</small><TextAction onClick={() => downloadAttachment(file)}>下载</TextAction></div>) : <div className="empty-inline">暂无附件</div>}</div></Section>
    <Section title="操作记录"><OperationHistory logs={item.logs} /></Section>
  </Page>;
}

const createWarningMeasure = (): WarningDisposalMeasure => ({ id: uid('warning-measure'), responsibleDepartment: '', responsiblePerson: '', measure: '', plannedStartDate: '', plannedCompletionDate: '', expectedEffect: '', resourceSupport: '', submitted: false });

function WarningDisposalDetail({ state, role, navigate, update, toast }: PageProps) {
  const parts = window.location.pathname.split('/');
  const id = parts[3];
  const requestedNodeId = parts[5];
  const requestedEdit = new URLSearchParams(window.location.search).get('mode') === 'edit';
  const item = state.warningDisposals.find(disposal => disposal.id === id);
  const definition = item ? getWarningWorkflowSteps(item) : [];
  const node = definition.find(candidate => candidate.id === requestedNodeId);
  const [form, setForm] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Attachment[]>([]);
  const [measures, setMeasures] = useState<WarningDisposalMeasure[]>([]);
  useEffect(() => {
    if (!item || !node) return;
    const draft = item.drafts?.[node.id];
    setForm(draft?.formData || {});
    setFiles(draft?.attachments || []);
    setMeasures(draft?.measures?.length ? structuredClone(draft.measures) : item.disposalMeasures?.length ? structuredClone(item.disposalMeasures) : [createWarningMeasure()]);
  }, [item?.id, node?.id]);
  const back = () => navigate(`/warning/disposal/${id}/overview`);
  if (!item || !node || !item.workflow || !canViewWarningOverview(role, item)) return <Page title="预警处置详情" breadcrumb={['预警管理', '预警提示与处置']} onClose={() => navigate('/warning/disposal')} actions={<Button variant="secondary" onClick={() => navigate('/warning/disposal')}>返回</Button>}><div className="empty-state"><h2>无权查看该节点或节点不存在</h2></div></Page>;
  const workflow = item.workflow;
  const nodeRecords = workflow.records.filter(record => record.nodeId === node.id);
  const current = workflow.currentNodeId === node.id;
  const started = definition.findIndex(candidate => candidate.id === node.id) <= definition.findIndex(candidate => candidate.id === workflow.currentNodeId) || node.role === '系统' || nodeRecords.length > 0;
  const editable = requestedEdit && current && canHandleWarningNode(role, node.id, item);
  const fields = getWarningNodeFormFields(node.id, role);
  const setField = (name: string, value: string) => setForm(currentForm => ({ ...currentForm, [name]: value }));
  const updateMeasure = (index: number, key: keyof WarningDisposalMeasure, value: string) => setMeasures(currentMeasures => currentMeasures.map((measure, measureIndex) => measureIndex === index ? { ...measure, [key]: value } : measure));
  const validate = () => {
    const missing = fields.find(field => field.required && !String(form[field.name] || '').trim());
    if (missing) { toast(`请填写${missing.label}`); return false; }
    if (node.id.endsWith('-plan')) {
      const invalid = !measures.length || measures.some(measure => !measure.responsibleDepartment || !measure.responsiblePerson || !measure.measure || !measure.plannedStartDate || !measure.plannedCompletionDate || !measure.expectedEffect);
      if (invalid) { toast('请完整填写至少一条处置措施、责任部门、责任人、计划时间和预期效果'); return false; }
    }
    if (node.id === 'yellow-release' && (form['是否恢复绿灯'] !== '是' || form['风险是否得到有效控制'] !== '是')) { toast('指标恢复绿灯且风险得到有效控制后方可提交解除评估'); return false; }
    return true;
  };
  const saveDraft = () => {
    update(currentState => { warningDisposalService.saveDraft(currentState, item.id, node.id, role, form, files, node.id.endsWith('-plan') ? measures : undefined); });
    toast('当前节点草稿已保存至本地存储');
  };
  const submit = (action: string) => {
    if (!canHandleWarningNode(role, node.id, item)) return toast('当前角色无权办理该节点');
    if (!validate()) return;
    if (node.id === 'red-release' && action === '确认解除' && (form['是否建议解除'] !== '是' || form['是否恢复绿灯'] !== '是' || form['风险是否得到有效控制'] !== '是')) return toast('恢复绿灯、风险有效控制且建议解除后方可确认解除');
    if (node.id === 'red-release' && action === '转入常态化跟踪' && form['是否转入常态化跟踪'] !== '是') return toast('请选择“是”后再转入常态化跟踪');
    let success = false;
    update(currentState => { success = warningDisposalService.submitNode(currentState, item.id, node.id, role, form, files, action, node.id.endsWith('-plan') ? measures : undefined); });
    if (!success) return toast('节点状态已变化，请返回进度总览后重试');
    toast(`${action}成功，流程状态已更新`);
    back();
  };
  const downloadAttachment = (file: Attachment) => {
    downloadText(file.name + '.txt', `文件：${file.name}\n类型：${file.type}\n大小：${formatSize(file.size)}\n上传时间：${file.uploadedAt}`);
    update(currentState => { currentState.warningDisposals.find(candidate => candidate.id === item.id)?.logs.push(createLog('下载附件', `在${node.name}下载附件：${file.name}`, role)); });
    toast('附件已下载并记录操作日志');
  };
  const actionButtons = () => {
    if (node.id.endsWith('-reason') || node.id.endsWith('-plan')) return <Button onClick={() => submit('提交')}>提交</Button>;
    if (node.id === 'yellow-execution') return <><Button variant="secondary" onClick={() => submit('提交进展')}>提交进展</Button><Button onClick={() => submit('发起解除评估')}>发起解除评估</Button></>;
    if (node.id === 'yellow-release') return <Button onClick={() => submit('提交解除评估')}>提交解除评估</Button>;
    if (node.id === 'red-group-assessment') return <><Button variant="danger" onClick={() => submit('退回修改')}>退回</Button><Button onClick={() => submit('提交审阅')}>提交审阅</Button></>;
    if (node.id === 'red-group-review') return <><Button variant="danger" onClick={() => submit('退回调整')}>退回调整</Button><Button onClick={() => submit('审阅通过')}>审阅通过</Button></>;
    if (node.id === 'red-execution' && role === '各金融机构') return <Button onClick={() => submit('提交进展')}>提交进展</Button>;
    if (node.id === 'red-execution') return <><Button variant="secondary" onClick={() => submit('审核进展')}>审核进展</Button><Button variant="secondary" onClick={() => submit('退回补充')}>退回补充</Button><Button variant="secondary" onClick={() => submit('催办')}>催办</Button><Button variant="secondary" onClick={() => submit('记录协调情况')}>记录协调情况</Button><Button onClick={() => submit('发起解除评估')}>发起解除评估</Button></>;
    if (node.id === 'red-release') return <><Button variant="secondary" onClick={() => submit('继续跟踪')}>继续跟踪</Button><Button variant="secondary" onClick={() => submit('转入常态化跟踪')}>转入常态化跟踪</Button><Button onClick={() => submit('确认解除')}>确认解除</Button></>;
    return null;
  };
  if (!started) return <Page title="预警处置详情" breadcrumb={['预警管理', '预警提示与处置', item.letterNo]} onClose={back} actions={<Button variant="secondary" onClick={back}>返回进度总览</Button>}><div className="empty-state"><h2>该流程节点尚未开始</h2><p>请在前序节点完成后再查看或办理。</p></div></Page>;
  return <Page title={item.level === '黄灯' ? '预警提示处置详情' : '重大风险提示处置详情'} breadcrumb={['预警管理', '预警提示与处置', item.letterNo, node.name]} onClose={back} actions={<Button variant="secondary" onClick={back}>返回进度总览</Button>}>
    <Section title="事项基本信息"><div className="detail-grid warning-info-grid"><b>提示编号<span>{item.letterNo}</span></b><b>机构名称<span>{item.institution}</span></b><b>指标编码<span>{item.indicatorCode || '—'}</span></b><b>指标名称<span>{item.indicator}</span></b><b>指标风险类型<span>{item.riskType}</span></b><b>监测频率<span>{item.monitoringFrequency || '—'}</span></b><b>指标期次<span>{item.period || '—'}</span></b><b>本期指标值<span>{item.value}</span></b><b>当期亮灯情况<span><StatusTag value={item.currentLightStatus || item.level} /></span></b><b>黄灯规则<span>{item.yellowRule || '—'}</span></b><b>红灯规则<span>{item.redRule || '—'}</span></b><b>提示类型<span>{item.noticeType || getWarningNoticeType(item.level)}</span></b><b>提示函下发方式<span>{letterDeliveryModeLabels[item.letterDeliveryMode || 'manual']}</span></b><b>函件状态<span><StatusTag value={item.letterStatus || '待下发'} /></span></b><b>触发日期<span>{item.triggerDate}</span></b><b>当前节点<span>{node.name}</span></b><b>事项状态<span><StatusTag value={item.status} /></span></b><b>关联规则编号<span>{item.ruleCode || state.warningRules.find(rule => rule.id === item.associatedRuleId)?.code || '—'}</span></b><b>关联规则版本<span>{item.ruleVersion || 'V1.0'}</span></b></div></Section>
    <Section title={item.level === '黄灯' ? '黄灯处置流程' : '红灯处置流程'}><div className={`warning-detail-workflow ${item.level === '红灯' ? 'red' : 'yellow'}`}><InteractiveWorkflow definition={definition} instance={workflow} selectedNodeId={node.id} onSelect={nodeId => navigate(`/warning/disposal/${item.id}/detail/${nodeId}?mode=${nodeId === workflow.currentNodeId && canHandleWarningNode(role, nodeId, item) ? 'edit' : 'view'}`)} /></div></Section>
    <WorkflowFeedbackOverview definition={definition} instance={workflow} role={role} institution={item.institution} selectedNodeId={node.id} onReturnCurrent={() => navigate(`/warning/disposal/${item.id}/detail/${workflow.currentNodeId}?mode=${canHandleWarningNode(role, workflow.currentNodeId, item) ? 'edit' : 'view'}`)} />
    {editable && <Section title={`节点办理 · ${node.name}`}><div className="current-node-note">当前节点内容支持保存草稿；提交后形成一条独立办理记录并进入下一流程节点。</div><div className="form-grid">{fields.map(field => <Field label={field.label} required={field.required} span={field.type === 'textarea' ? 2 : 1} key={field.name}>{field.type === 'textarea' ? <Textarea value={form[field.name] || ''} onChange={value => setField(field.name, value)} maxLength={field.maxLength} showCount /> : field.type === 'select' ? <Select value={form[field.name] || ''} onChange={value => setField(field.name, value)} options={field.options || []} /> : <Input type={field.type || 'text'} value={form[field.name] || ''} onChange={value => setField(field.name, value)} maxLength={field.maxLength} />}</Field>)}</div>
      {node.id.endsWith('-plan') && <div className="warning-measures"><div className="warning-subsection-head"><b>处置措施清单</b><Button variant="secondary" onClick={() => setMeasures(currentMeasures => [...currentMeasures, createWarningMeasure()])}>＋ 新增措施</Button></div>{measures.map((measure, index) => <div className="warning-measure-card" key={measure.id}><div className="warning-measure-title"><b>措施 {index + 1}{measure.submitted ? '（已提交记录）' : ''}</b><TextAction disabled={measures.length === 1 || measure.submitted} onClick={() => setMeasures(currentMeasures => currentMeasures.filter((_, measureIndex) => measureIndex !== index))}>删除</TextAction></div><div className="form-grid"><Field label="责任部门" required><Input value={measure.responsibleDepartment} onChange={value => updateMeasure(index, 'responsibleDepartment', value)} /></Field><Field label="责任人" required><Input value={measure.responsiblePerson} onChange={value => updateMeasure(index, 'responsiblePerson', value)} /></Field><Field label="处置措施" required span={2}><Textarea value={measure.measure} onChange={value => updateMeasure(index, 'measure', value)} maxLength={1500} showCount /></Field><Field label="计划开始时间" required><Input type="date" value={measure.plannedStartDate} onChange={value => updateMeasure(index, 'plannedStartDate', value)} /></Field><Field label="计划完成时间" required><Input type="date" value={measure.plannedCompletionDate} onChange={value => updateMeasure(index, 'plannedCompletionDate', value)} /></Field><Field label="预期效果" required span={2}><Textarea value={measure.expectedEffect} onChange={value => updateMeasure(index, 'expectedEffect', value)} /></Field><Field label="资源保障" span={2}><Textarea value={measure.resourceSupport || ''} onChange={value => updateMeasure(index, 'resourceSupport', value)} /></Field></div></div>)}</div>}
      <Field label="本节点附件"><FileUploader files={files} onChange={setFiles} /></Field><div className="form-actions"><Button variant="secondary" onClick={saveDraft}>保存草稿</Button>{actionButtons()}<Button variant="secondary" onClick={back}>返回</Button></div></Section>}
    {current && !editable && <div className="readonly-current-node">当前节点由“{node.role}”办理，当前角色仅可查看已提交记录。{requestedEdit ? '系统已自动切换为只读模式。' : ''}</div>}
    <Section title="事项附件"><div className="warning-attachment-list">{item.attachments.length ? item.attachments.map(file => <div key={file.id}><span>▣ {file.name}</span><small>{formatSize(file.size)} · {file.uploadedAt}</small><TextAction onClick={() => downloadAttachment(file)}>下载</TextAction></div>) : <div className="empty-inline">暂无附件</div>}</div></Section>
    <Section title="全部操作记录"><OperationHistory logs={item.logs} /></Section>
  </Page>;
}

function IndicatorList({ state, role, navigate, update, toast }: PageProps) {
  const [q, setQ] = useState({ code: '', name: '', status: '', institution: role === '各金融机构' ? currentInstitution : '' });
  const items = state.indicators.filter(x => (!q.code || x.code.includes(q.code)) && (!q.name || x.name.includes(q.name)) && (!q.status || x.status === q.status) && (!q.institution || x.institution.includes(q.institution)));
  const changeStatus = (item: Indicator, status: Indicator['status']) => update(current => {
    const target = current.indicators.find(candidate => candidate.id === item.id);
    if (!target) return;
    target.status = status;
    target.logs.push(createLog(status, `指标状态调整为${status}`, role));
    current.indicatorPeriodRecords.filter(record => record.indicatorId === item.id).forEach(record => { record.indicatorStatus = status === '草稿' ? '未生效' : status; });
  });
  const removeDraft = (item: Indicator) => {
    if (state.indicatorPeriodRecords.some(record => record.indicatorId === item.id)) return toast('该指标已被历史数据引用，不允许物理删除');
    if (!window.confirm(`确认删除草稿指标“${item.name}”吗？`)) return;
    update(current => { current.indicators = current.indicators.filter(candidate => candidate.id !== item.id); });
    toast('指标草稿已删除');
  };
  return <Page title="指标新增与维护" breadcrumb={['指标管理', '指标新增与维护']} actions={canCreateIndicator(role) ? <Button onClick={() => navigate('/indicators/maintenance/new')}>＋ 新增指标</Button> : undefined}>
    <SearchPanel onSearch={() => undefined} onReset={() => setQ({ code: '', name: '', status: '', institution: role === '各金融机构' ? currentInstitution : '' })}><Field label="指标编码"><Input value={q.code} onChange={v => setQ({ ...q, code: v })} /></Field><Field label="指标名称"><Input value={q.name} onChange={v => setQ({ ...q, name: v })} /></Field><Field label="指标状态"><Select value={q.status} onChange={v => setQ({ ...q, status: v })} options={['草稿', '未生效', '生效', '停用', '作废']} /></Field><Field label="适用机构"><Select disabled={role === '各金融机构'} value={q.institution} onChange={v => setQ({ ...q, institution: v })} options={role === '各金融机构' ? [currentInstitution] : institutions} /></Field></SearchPanel>
    <div className="list-toolbar"><span>指标定义列表 · {items.length} 条</span><Button variant="secondary" onClick={() => downloadCSV('指标定义.csv', [['指标编码', '指标名称', '状态', '适用机构'], ...items.map(item => [item.code, item.name, item.status, item.institution])])}>⇩ 导出</Button></div>
    <Table><thead><tr><th>序号</th><th>指标编码</th><th>指标名称</th><th>指标状态</th><th>指标定义</th><th>指标类型</th><th>指标子类</th><th>适用机构</th><th>操作</th></tr></thead><tbody>{items.map((item, i) => <tr key={item.id}><td>{i + 1}</td><td className="link" onClick={() => navigate(`/indicators/maintenance/${item.id}`)}>{item.code}</td><td>{item.name}</td><td><StatusTag value={item.status} /></td><td>{item.definition}</td><td>{item.type}</td><td>{item.subtype}</td><td>{item.institution}</td><td><TextAction onClick={() => navigate(`/indicators/maintenance/${item.id}`)}>{canEditIndicator(role, item) ? '编辑' : '查看'}</TextAction><TextAction onClick={() => toast(item.logs.map(x => `${x.time} ${x.action} ${x.content}`).join('\n'))}>查看操作记录</TextAction>{canManageIndicatorStatus(role) && item.status !== '生效' && <TextAction onClick={() => changeStatus(item, '生效')}>发布生效</TextAction>}{canManageIndicatorStatus(role) && item.status === '生效' && <TextAction onClick={() => changeStatus(item, '停用')}>停用</TextAction>}{canManageIndicatorStatus(role) && !['生效', '作废'].includes(item.status) && <TextAction onClick={() => changeStatus(item, '作废')}>作废</TextAction>}{canManageIndicatorStatus(role) && item.status === '草稿' && <TextAction onClick={() => removeDraft(item)}>删除</TextAction>}</td></tr>)}</tbody></Table><Pagination total={items.length} page={1} setPage={() => undefined} />
  </Page>;
}

function IndicatorEditor({ state, role, navigate, update, toast }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const editing = state.indicators.find(x => x.id === id);
  const editable = editing ? canEditIndicator(role, editing) : canCreateIndicator(role);
  const [form, setForm] = useState<Partial<Indicator>>(() => editing ? structuredClone(editing) : { name: '', definition: '', institution: '', type: '风险类', subtype: '', managementType: '监测指标', effectiveDate: '', frequency: '月度', sourceTables: [''] });
  const set = (patch: Partial<Indicator>) => setForm(x => ({ ...x, ...patch }));
  if (!editing && id !== 'new') return <Page title="查看指标定义" breadcrumb={['指标管理']} actions={<Button variant="secondary" onClick={() => navigate('/indicators/maintenance')}>返回</Button>}><div className="empty-state"><h2>指标不存在或无权查看</h2></div></Page>;
  if (!editable && !editing) return <Page title="指标维护" breadcrumb={['指标管理']} actions={<Button variant="secondary" onClick={() => navigate('/indicators/maintenance')}>返回</Button>}><div className="empty-state"><h2>当前角色无权新增或维护指标</h2></div></Page>;
  if (editing && !editable) return <Page title="查看指标定义" breadcrumb={['指标管理', '指标新增与维护', '查看指标']} actions={<Button variant="secondary" onClick={() => navigate('/indicators/maintenance')}>返回</Button>}><Section title="指标基本信息"><div className="detail-grid"><b>指标编码<span>{editing.code}</span></b><b>指标名称<span>{editing.name}</span></b><b>指标状态<span><StatusTag value={editing.status} /></span></b><b>适用机构<span>{editing.institution}</span></b><b>指标类型<span>{editing.type}</span></b><b>指标子类<span>{editing.subtype}</span></b><b>监测频率<span>{editing.frequency}</span></b><b>生效时间<span>{editing.effectiveDate}</span></b></div><div className="read-block"><b>指标定义</b><p>{editing.definition}</p><b>数据来源</b><p>{editing.sourceTables.join('、')}</p></div></Section><Section title="操作记录"><OperationHistory logs={editing.logs} /></Section></Page>;
  const submit = () => { if (!form.name || !form.institution || !form.type || !form.effectiveDate || !(form.sourceTables || []).filter(Boolean).length) return toast('请填写指标名称、适用机构、类型、生效日期和至少一个源头表'); update(s => { if (editing) { const x = s.indicators.find(y => y.id === editing.id)!; const nextVersion = `V${x.versions.length + 1}.0`; x.versions.unshift({ version: nextVersion, operation: '维护', name: form.name || x.name, definition: form.definition || x.definition, effectiveDate: form.effectiveDate || x.effectiveDate, institution: form.institution || x.institution, type: form.type || x.type, subtype: form.subtype || x.subtype, frequency: form.frequency || x.frequency, sourceTable: (form.sourceTables || []).join('、'), stopDate: '—' }); Object.assign(x, form, { logs: [...x.logs, createLog('维护', `生成完整快照 ${nextVersion}`, role)] }); } else indicatorService.create(s, form, role); }); toast(editing ? '指标维护已保存并生成新版本' : '指标草稿已新增，编码自动生成'); navigate('/indicators/maintenance'); };
  return <Page title={editing ? '维护指标' : '新增指标'} breadcrumb={['指标管理', '指标新增与维护', editing ? '维护指标' : '新增指标']} actions={<><Button variant="secondary" onClick={() => navigate('/indicators/maintenance')}>关闭</Button><Button onClick={submit}>保存</Button></>}><Section title="基本信息"><div className="form-grid"><Field label="指标编码"><Input value={editing?.code || '系统自动生成'} disabled /></Field><Field label="指标名称" required><Input value={form.name} onChange={v => set({ name: v })} /></Field><Field label="适用机构" required><Select value={form.institution} onChange={v => set({ institution: v })} options={institutions} /></Field><Field label="指标类型" required><Select value={form.type} onChange={v => set({ type: v })} options={['财务类', '资本类', '风险类']} /></Field><Field label="指标子类"><Input value={form.subtype} onChange={v => set({ subtype: v })} /></Field><Field label="指标管理类型"><Select value={form.managementType} onChange={v => set({ managementType: v })} options={['风险限额指标', '监测指标', '会计校验指标']} /></Field><Field label="指标定义" required span={2}><Textarea value={form.definition} onChange={v => set({ definition: v })} /></Field></div></Section><Section title="运行设置"><div className="form-grid"><Field label="生效起始日期" required><Input type="date" value={form.effectiveDate} onChange={v => set({ effectiveDate: v })} /></Field><Field label="监测频率"><Select value={form.frequency} onChange={v => set({ frequency: v })} options={['日度', '月度', '季度', '年度', '发生即报']} /></Field></div></Section><Section title="数据来源" extra={<Button variant="secondary" onClick={() => set({ sourceTables: [...(form.sourceTables || []), ''] })}>＋ 添加源头表</Button>}><div className="source-list">{(form.sourceTables || []).map((source, i) => <div key={i}><Input value={source} onChange={v => set({ sourceTables: (form.sourceTables || []).map((x, j) => j === i ? v : x) })} placeholder="请输入源头表名称" />{(form.sourceTables || []).length > 1 && <TextAction onClick={() => set({ sourceTables: (form.sourceTables || []).filter((_, j) => j !== i) })}>删除</TextAction>}</div>)}</div></Section></Page>;
}

function IndicatorVersions({ state, role, navigate, update, toast }: PageProps) { const [q, setQ] = useState({ code: '', name: '', version: '' }); const [history, setHistory] = useState<Indicator | null>(null); const items = state.indicators.filter(x => (!q.code || x.code.includes(q.code)) && (!q.name || x.name.includes(q.name)) && (!q.version || x.versions.some(v => v.version.includes(q.version)))); return <Page title="指标版本管理" breadcrumb={['指标管理', '指标版本管理']}><SearchPanel onSearch={() => undefined} onReset={() => setQ({ code: '', name: '', version: '' })}><Field label="指标编码"><Input value={q.code} onChange={v => setQ({ ...q, code: v })} /></Field><Field label="指标名称"><Input value={q.name} onChange={v => setQ({ ...q, name: v })} /></Field><Field label="版本号"><Input value={q.version} onChange={v => setQ({ ...q, version: v })} /></Field></SearchPanel><Table><thead><tr><th>序号</th><th>指标编码</th><th>指标名称</th><th>指标状态</th><th>指标定义</th><th>监测频率</th><th>当前版本号</th><th>操作</th></tr></thead><tbody>{items.map((item, i) => <tr key={item.id}><td>{i + 1}</td><td>{item.code}</td><td>{item.name}</td><td><StatusTag value={item.status} /></td><td>{item.definition}</td><td>{item.frequency}</td><td>{item.versions[0]?.version}</td><td><TextAction onClick={() => setHistory(item)}>查看历史版本</TextAction></td></tr>)}</tbody></Table>{history && <Modal title={`指标历史版本 · ${history.code}`} onClose={() => setHistory(null)} footer={<><Button variant="secondary" onClick={() => setHistory(null)}>关闭</Button><Button onClick={() => downloadCSV(`${history.code}-历史版本.csv`, [['版本号', '维护操作', '指标名称', '生效日期'], ...history.versions.map(v => [v.version, v.operation, v.name, v.effectiveDate])])}>下载</Button></>}><Table><thead><tr><th>版本号</th><th>维护操作</th><th>指标名称</th><th>指标定义</th><th>生效起始日期</th><th>适用机构</th><th>指标类型</th><th>源头表</th><th>停用日期</th></tr></thead><tbody>{history.versions.map(v => <tr key={v.version}><td>{v.version}</td><td>{v.operation}</td><td>{v.name}</td><td>{v.definition}</td><td>{v.effectiveDate}</td><td>{v.institution}</td><td>{v.type}/{v.subtype}</td><td>{v.sourceTable}</td><td>{v.stopDate}</td></tr>)}</tbody></Table></Modal>}</Page>; }

function IndicatorLightHistoryModal({ record, records, onClose }: { record: IndicatorPeriodRecord; records: IndicatorPeriodRecord[]; onClose: () => void }) {
  const history = getIndicatorHistoryRecords(records, record);
  const summary = calculateLightSummaryForRecords(history);
  return <Modal title="累计亮灯情况" onClose={onClose} footer={<Button variant="secondary" onClick={onClose}>关闭</Button>}>
    <div className="modal-note">{record.indicatorName}｜{record.institution}　统计截至：{record.period}</div>
    <div className="detail-grid"><b>指标编码<span>{record.indicatorCode}</span></b><b>指标名称<span>{record.indicatorName}</span></b><b>指标定义<span>{record.indicatorDefinition}</span></b><b>指标类型<span>{record.indicatorType}</span></b><b>指标子类<span>{record.indicatorSubType}</span></b><b>适用机构<span>{record.institution}</span></b><b>监测频率<span>{record.monitoringFrequency}</span></b><b>当前指标期次<span>{record.period}</span></b></div>
    <div className="light-summary-line">累计红灯 {summary.red} 次，黄灯 {summary.yellow} 次，绿灯 {summary.green} 次</div>
    <Table><thead><tr><th>序号</th><th>指标期次</th><th>监测频率</th><th>指标值</th><th>黄灯规则</th><th>红灯规则</th><th>当期亮灯情况</th></tr></thead><tbody>{history.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.period}</td><td>{item.monitoringFrequency}</td><td>{item.indicatorValue}</td><td>{item.yellowRule}</td><td>{item.redRule}</td><td><StatusTag value={item.currentLightStatus} /></td></tr>)}</tbody></Table>
  </Modal>;
}

function IndicatorPeriodTable({ records, onViewCumulative }: { records: IndicatorPeriodRecord[]; onViewCumulative: (record: IndicatorPeriodRecord) => void }) {
  return <Table><thead><tr><th>序号</th><th>指标编码</th><th>指标名称</th><th>监测频率</th><th>指标值</th><th>当期亮灯情况</th><th>累计亮灯情况</th><th>指标定义</th><th>指标类型</th><th>指标子类</th><th>适用机构</th><th>预测范围</th><th>黄灯规则</th><th>红灯规则</th><th>指标期次</th></tr></thead><tbody>{records.map((record, index) => <tr key={record.id}><td>{index + 1}</td><td>{record.indicatorCode}</td><td>{record.indicatorName}</td><td>{record.monitoringFrequency}</td><td>{record.indicatorValue}</td><td><StatusTag value={record.currentLightStatus} /></td><td><TextAction onClick={() => onViewCumulative(record)}>查看</TextAction></td><td>{record.indicatorDefinition}</td><td>{record.indicatorType}</td><td>{record.indicatorSubType}</td><td>{record.institution}</td><td>{record.forecastRange}</td><td>{record.yellowRule}</td><td>{record.redRule}</td><td>{record.period}</td></tr>)}</tbody></Table>;
}

function IndicatorQuery({ state, role, title = '指标查询' }: PageProps & { title?: string }) {
  const initialInstitution = role === '各金融机构' ? currentInstitution : '';
  const [historyItem, setHistoryItem] = useState<IndicatorPeriodRecord | null>(null);
  const [q, setQ] = useState({ code: '', name: '', type: '', subtype: '', institution: initialInstitution, frequency: '', light: '', periodStart: '', periodEnd: '' });
  const startOrder = periodInputOrder(q.periodStart);
  const endOrder = periodInputOrder(q.periodEnd);
  const hasPeriodQuery = !!q.periodStart || !!q.periodEnd;
  const sourceRecords = hasPeriodQuery ? indicatorPeriodService.history(state.indicatorPeriodRecords) : indicatorPeriodService.latest(state.indicatorPeriodRecords);
  const records = sourceRecords.filter(record => (!q.code || record.indicatorCode.includes(q.code)) && (!q.name || record.indicatorName.includes(q.name)) && (!q.type || record.indicatorType === q.type) && (!q.subtype || record.indicatorSubType.includes(q.subtype)) && (!q.institution || record.institution === q.institution) && (!q.frequency || record.monitoringFrequency === q.frequency) && (!q.light || record.currentLightStatus === q.light) && (!startOrder || record.periodOrder >= startOrder) && (!endOrder || record.periodOrder <= endOrder));
  const summaryText = (record: IndicatorPeriodRecord) => { const summary = calculateLightSummaryForRecords(getIndicatorHistoryRecords(state.indicatorPeriodRecords, record)); return `累计红灯${summary.red}次，黄灯${summary.yellow}次，绿灯${summary.green}次`; };
  const exportRows = () => downloadCSV('指标查询.csv', [['序号', '指标编码', '指标名称', '监测频率', '指标值', '当期亮灯情况', '累计亮灯情况', '指标定义', '指标类型', '指标子类', '适用机构', '预测范围', '黄灯规则', '红灯规则', '指标期次'], ...records.map((record, index) => [index + 1, record.indicatorCode, record.indicatorName, record.monitoringFrequency, record.indicatorValue, record.currentLightStatus, summaryText(record), record.indicatorDefinition, record.indicatorType, record.indicatorSubType, record.institution, record.forecastRange, record.yellowRule, record.redRule, record.period])]);
  return <Page title={title} breadcrumb={[title === '风险限额倒查' ? '风险限额管理' : '风险指标管理', title]}><SearchPanel onSearch={() => undefined} onReset={() => setQ({ code: '', name: '', type: '', subtype: '', institution: initialInstitution, frequency: '', light: '', periodStart: '', periodEnd: '' })}><Field label="指标编码"><Input value={q.code} onChange={value => setQ({ ...q, code: value })} /></Field><Field label="指标名称"><Input value={q.name} onChange={value => setQ({ ...q, name: value })} /></Field><Field label="指标类型"><Select value={q.type} onChange={value => setQ({ ...q, type: value })} options={['财务类', '资本类', '风险类']} /></Field><Field label="指标子类"><Input value={q.subtype} onChange={value => setQ({ ...q, subtype: value })} /></Field><Field label="适用机构"><Select disabled={role === '各金融机构'} value={q.institution} onChange={value => setQ({ ...q, institution: value })} options={role === '各金融机构' ? [currentInstitution] : institutions} /></Field><Field label="监测频率"><Select value={q.frequency} onChange={value => setQ({ ...q, frequency: value })} options={['日', '周', '月', '季', '半年', '年', '不定期']} /></Field><Field label="当期亮灯"><Select value={q.light} onChange={value => setQ({ ...q, light: value })} options={['绿灯', '黄灯', '红灯']} /></Field><Field label="指标期次"><div className="date-range"><Input value={q.periodStart} onChange={periodStart => setQ({ ...q, periodStart })} placeholder="单一期次或起始期次" /><span>至</span><Input value={q.periodEnd} onChange={periodEnd => setQ({ ...q, periodEnd })} placeholder="结束期次（可选）" /></div></Field></SearchPanel><div className="list-toolbar"><span>{hasPeriodQuery ? '历史期间指标数据' : '默认展示各指标最新一期'} · {records.length} 条</span><Button variant="secondary" onClick={exportRows}>⇩ 导出</Button></div><IndicatorPeriodTable records={records} onViewCumulative={setHistoryItem} /><Pagination total={records.length} page={1} setPage={() => undefined} />{historyItem && <IndicatorLightHistoryModal record={historyItem} records={state.indicatorPeriodRecords} onClose={() => setHistoryItem(null)} />}</Page>;
}

function MajorEventDefinitions({ state, role, navigate, update, toast }: PageProps) {
  const [q, setQ] = useState({ name: '', status: '', reference: '', updatedAt: '' });
  const [moreId, setMoreId] = useState<string | null>(null);
  const items = state.majorRiskEventDefinitions.filter(item => (!q.name || item.name.includes(q.name)) && (!q.status || item.status === q.status) && (!q.reference || item.referenceBasis.includes(q.reference)) && (!q.updatedAt || item.updatedAt === q.updatedAt));
  const setStatus = (item: MajorRiskEventDefinition, status: '生效' | '停用') => {
    if (!window.confirm(`确认${status === '生效' ? '启用' : '停用'}“${item.name}”吗？`)) return;
    update(current => { const target = current.majorRiskEventDefinitions.find(candidate => candidate.id === item.id); if (target) majorEventDefinitionService.setStatus(target, status, role); });
    toast(`重大风险事件定义已${status === '生效' ? '启用' : '停用'}`);
  };
  return <Page title="重大风险事件定义管理" breadcrumb={['风险报告', '重大风险事件报告', '重大风险事件定义管理']} actions={canManageMajorEventDefinitions(role) ? <Button onClick={() => navigate('/major-events/definitions/new')}>＋ 新增定义</Button> : undefined}><SearchPanel onSearch={() => undefined} onReset={() => setQ({ name: '', status: '', reference: '', updatedAt: '' })}><Field label="事件类型名称"><Input value={q.name} onChange={name => setQ({ ...q, name })} /></Field><Field label="定义状态"><Select value={q.status} onChange={status => setQ({ ...q, status })} options={['生效', '停用', '草稿']} /></Field><Field label="参考依据"><Input value={q.reference} onChange={reference => setQ({ ...q, reference })} /></Field><Field label="更新时间"><Input type="date" value={q.updatedAt} onChange={updatedAt => setQ({ ...q, updatedAt })} /></Field></SearchPanel><Table><thead><tr><th>序号</th><th>事件类型编码</th><th>事件类型名称</th><th>事件定义摘要</th><th>参考依据</th><th>定义状态</th><th>版本号</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{items.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.code}</td><td>{item.name}</td><td className="ellipsis">{item.criteria.join(' ').slice(0, 100)}{item.criteria.join(' ').length > 100 ? '…' : ''}</td><td>{item.referenceBasis}</td><td><StatusTag value={item.status} /></td><td>{item.version}</td><td>{item.updatedAt}</td><td className="operation-cell"><TextAction onClick={() => navigate(`/major-events/definitions/${item.id}`)}>查看</TextAction><span className="more-actions"><button className="more-trigger" aria-label="更多操作" title="更多操作" onClick={() => setMoreId(moreId === item.id ? null : item.id)}>···</button>{moreId === item.id && <span className="more-menu">{canManageMajorEventDefinitions(role) && <button onClick={() => navigate(`/major-events/definitions/${item.id}/edit`)}>编辑</button>}{canManageMajorEventDefinitions(role) && item.status !== '生效' && <button onClick={() => { setStatus(item, '生效'); setMoreId(null); }}>启用</button>}{canManageMajorEventDefinitions(role) && item.status === '生效' && <button className="danger" onClick={() => { setStatus(item, '停用'); setMoreId(null); }}>停用</button>}<button onClick={() => { toast(item.logs.map(log => `${log.time} ${log.action} ${log.content}`).join('\n')); setMoreId(null); }}>查看操作记录</button></span>}</span></td></tr>)}</tbody></Table><Pagination total={items.length} page={1} setPage={() => undefined} /></Page>;
}

function MajorEventDefinitionDetail({ state, navigate }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const item = state.majorRiskEventDefinitions.find(definition => definition.id === id);
  if (!item) return <Page title="重大风险事件定义" breadcrumb={['风险报告', '重大风险事件报告']} actions={<Button variant="secondary" onClick={() => navigate('/major-events/definitions')}>返回</Button>}><div className="empty-state"><h2>定义不存在</h2></div></Page>;
  return <Page title="重大风险事件定义查看" breadcrumb={['风险报告', '重大风险事件报告', '重大风险事件定义管理', item.name]} actions={<Button variant="secondary" onClick={() => navigate('/major-events/definitions')}>返回</Button>}><div className="definition-view-grid"><Section title="风险事件类型"><div className="definition-type"><span>{item.code}</span><h2>{item.name}</h2><StatusTag value={item.status} /><small>{item.version} · {item.updatedAt}</small></div></Section><Section title="风险事件定义"><p className="definition-intro">各金融机构如发生下列情形，应依规及时识别并上报：</p><ol className="definition-criteria">{item.criteria.map((criterion, index) => <li key={index}>{criterion}</li>)}</ol></Section><Section title="参考依据"><div className="reference-basis">{item.referenceBasis || '/'}</div>{item.notes && <div className="read-block"><b>备注</b><p>{item.notes}</p></div>}</Section></div><Section title="操作记录"><OperationHistory logs={item.logs} /></Section></Page>;
}

function MajorEventDefinitionEditor({ state, role, navigate, update, toast }: PageProps) {
  const id = window.location.pathname.endsWith('/edit') ? window.location.pathname.split('/')[3] : undefined;
  const existing = state.majorRiskEventDefinitions.find(definition => definition.id === id);
  const [form, setForm] = useState<Partial<MajorRiskEventDefinition>>(() => existing ? structuredClone(existing) : { code: '', name: '', criteria: [''], referenceBasis: '/', status: '草稿', version: 'V1.0', notes: '' });
  if (!canManageMajorEventDefinitions(role)) return <Page title="重大风险事件定义管理" breadcrumb={['风险报告', '重大风险事件报告']} actions={<Button variant="secondary" onClick={() => navigate('/major-events/definitions')}>返回</Button>}><div className="empty-state"><h2>当前角色无权维护事件定义</h2></div></Page>;
  const criteria = form.criteria || [''];
  const save = () => {
    if (!form.name?.trim() || !criteria.some(item => item.trim())) return toast('请填写事件类型名称和至少一条事件定义');
    update(current => majorEventDefinitionService.save(current, { ...form, name: form.name?.trim(), criteria: criteria.map(item => item.trim()).filter(Boolean) }, role));
    toast(existing ? '重大风险事件定义已更新' : '重大风险事件定义已新增');
    navigate('/major-events/definitions');
  };
  return <Page title={existing ? '编辑重大风险事件定义' : '新增重大风险事件定义'} breadcrumb={['风险报告', '重大风险事件报告', '重大风险事件定义管理', existing ? '编辑' : '新增']} actions={<><Button variant="secondary" onClick={() => navigate('/major-events/definitions')}>取消</Button><Button onClick={save}>保存</Button></>}><Section title="基本信息"><div className="form-grid"><Field label="事件类型编码"><Input value={form.code} onChange={code => setForm({ ...form, code })} placeholder="不填写则自动生成" /></Field><Field label="事件类型名称" required><Input value={form.name} onChange={name => setForm({ ...form, name })} /></Field><Field label="定义状态"><Select value={form.status} onChange={status => setForm({ ...form, status: status as MajorRiskEventDefinition['status'] })} options={['生效', '停用', '草稿']} /></Field><Field label="版本号"><Input value={existing?.version || 'V1.0'} disabled /></Field><Field label="参考依据" span={2}><Textarea value={form.referenceBasis} onChange={referenceBasis => setForm({ ...form, referenceBasis })} /></Field><Field label="备注" span={2}><Textarea value={form.notes} onChange={notes => setForm({ ...form, notes })} /></Field></div></Section><Section title="事件定义判断标准" extra={<Button variant="secondary" onClick={() => setForm({ ...form, criteria: [...criteria, ''] })}>＋ 增加一条</Button>}><div className="criteria-editor">{criteria.map((criterion, index) => <div key={index}><span>{index + 1}</span><Textarea value={criterion} onChange={value => setForm({ ...form, criteria: criteria.map((item, itemIndex) => itemIndex === index ? value : item) })} />{criteria.length > 1 && <TextAction onClick={() => setForm({ ...form, criteria: criteria.filter((_, itemIndex) => itemIndex !== index) })}>删除</TextAction>}</div>)}</div></Section></Page>;
}

const concentrationMoney = (value: number) => `${value.toFixed(2)}亿元`;
const concentrationLightText = (status: ConcentrationLightStatus) => concentrationLightLabels[status];
const concentrationObjectFilter = (type: ConcentrationType, name: string) => type === 'singleCustomer' ? { customer: name } : type === 'groupCustomer' ? { groupCustomer: name } : type === 'industry' ? { industry: name } : { region: name };
const concentrationObjectLabel = (type: ConcentrationType) => type === 'singleCustomer' ? '客户名称' : type === 'groupCustomer' ? '集团客户名称' : type === 'industry' ? '行业名称' : '区域名称';
const concentrationBalanceLabel = (type: ConcentrationType) => type === 'singleCustomer' ? '单一客户投融资余额' : type === 'groupCustomer' ? '单一集团客户投融资余额' : type === 'industry' ? '行业业务余额' : '地区业务余额';

function ConcentrationOverview({ role, navigate }: PageProps) {
  const data = useMemo(loadConcentrationData, []);
  const [q, setQ] = useState({ period: '2026年6月', type: '' });
  const [config, setConfig] = useState<ConcentrationType[]>(() => loadConcentrationDisplayConfig(role));
  const [configOpen, setConfigOpen] = useState(false);
  const [draftConfig, setDraftConfig] = useState<ConcentrationType[]>(config);
  const visibleTypes = config.filter(type => !q.type || concentrationTypeLabels[type] === q.type);
  const move = (type: ConcentrationType, direction: -1 | 1) => setDraftConfig(current => {
    const index = current.indexOf(type); const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next;
  });
  const saveConfig = () => { if (!draftConfig.length) return; saveConcentrationDisplayConfig(role, draftConfig); setConfig(draftConfig); setConfigOpen(false); };
  return <Page title="集中度风险监测" breadcrumb={['预警管理', '集中度风险监测']} actions={<Button variant="secondary" onClick={() => { setDraftConfig(config); setConfigOpen(true); }}>集中度类型设置</Button>}>
    <SearchPanel onSearch={() => undefined} onReset={() => setQ({ period: '2026年6月', type: '' })}>
      <Field label="数据期次"><Select value={q.period} onChange={period => setQ({ ...q, period })} options={['2026年6月', '2026年5月', '2026年4月']} /></Field>
      <Field label="集中度类型"><Select value={q.type} onChange={type => setQ({ ...q, type })} options={concentrationTypes.map(type => concentrationTypeLabels[type])} /></Field>
    </SearchPanel>
    <div className="concentration-overview-cards">{visibleTypes.map(type => {
      const records = getConsolidatedConcentrationRecords(data, type).filter(record => !q.period || record.period === q.period);
      const counts = { red: records.filter(record => record.lightStatus === 'red').length, yellow: records.filter(record => record.lightStatus === 'yellow').length, green: records.filter(record => record.lightStatus === 'green').length };
      return <section className="card concentration-card" key={type}><div className="concentration-card-head"><div><span>CONCENTRATION MONITORING</span><h3>{concentrationTypeLabels[type]}</h3></div><b>{records.length}</b></div><p>{type === 'singleCustomer' ? '按客户统计监测对象' : type === 'groupCustomer' ? '按集团客户统计监测对象' : type === 'industry' ? '按行业统计监测对象' : '按区域统计监测对象'}</p><div className="concentration-light-counts"><span className="red"><i />红灯 <b>{counts.red}个</b></span><span className="yellow"><i />黄灯 <b>{counts.yellow}个</b></span><span className="green"><i />绿灯 <b>{counts.green}个</b></span></div><div className="concentration-card-foot"><small>当前期次：{q.period}</small><Button variant="secondary" onClick={() => navigate(`/concentration-monitoring/${concentrationTypeSlugs[type]}`)}>查看详情</Button></div></section>;
    })}</div>
    <Section title="监测口径说明"><div className="detail-grid concentration-definition-grid"><b>单一客户集中度<span>单一客户投融资余额跨机构汇总 ÷ 净资产 × 100%</span></b><b>单一集团客户投融资集中度<span>集团客户投融资余额跨机构汇总 ÷ 净资产 × 100%</span></b><b>行业集中度<span>行业业务余额 ÷ 净资产 × 100%</span></b><b>区域集中度<span>地区业务余额 ÷ 净资产 × 100%；演示以业务所属地区归集</span></b></div></Section>
    {configOpen && <Modal title="展示集中度类型配置" onClose={() => setConfigOpen(false)} footer={<><Button variant="secondary" onClick={() => setConfigOpen(false)}>取消</Button><Button disabled={!draftConfig.length} onClick={saveConfig}>保存配置</Button></>}><div className="configuration-note">从现有集中度指标定义中选择总览卡片；至少保留一个类型，并可调整展示顺序。配置按当前角色保存至本地存储。</div><div className="concentration-config-list">{concentrationTypes.map(type => { const enabled = draftConfig.includes(type); const index = draftConfig.indexOf(type); return <div key={type}><label><input type="checkbox" checked={enabled} onChange={event => setDraftConfig(current => event.target.checked ? [...current, type] : current.length > 1 ? current.filter(item => item !== type) : current)} />{concentrationTypeLabels[type]}</label><span><Button variant="secondary" disabled={!enabled || index <= 0} onClick={() => move(type, -1)}>上移</Button><Button variant="secondary" disabled={!enabled || index < 0 || index >= draftConfig.length - 1} onClick={() => move(type, 1)}>下移</Button></span></div>; })}</div></Modal>}
  </Page>;
}

function ConcentrationSummaryPage({ role, navigate }: PageProps) {
  const type = getConcentrationTypeFromSlug(window.location.pathname.split('/')[2]);
  const data = useMemo(loadConcentrationData, []);
  const [q, setQ] = useState({ name: '', period: '2026年6月', min: '', max: '' });
  if (!type) return <EmptyModulePage title="集中度类型不存在" />;
  const records = getConsolidatedConcentrationRecords(data, type).filter(record => (!q.name || record.objectName.includes(q.name)) && (!q.period || record.period === q.period) && (!q.min || record.concentrationRate >= Number(q.min)) && (!q.max || record.concentrationRate <= Number(q.max)));
  const exportRows = () => downloadCSV(`${concentrationTypeLabels[type]}汇总.csv`, [[concentrationObjectLabel(type), concentrationTypeLabels[type], concentrationBalanceLabel(type), '当期亮灯', '指标期次'], ...records.map(record => [record.objectName, `${record.concentrationRate.toFixed(2)}%`, concentrationMoney(record.businessBalance), concentrationLightText(record.lightStatus), record.period])]);
  return <Page title={`${concentrationTypeLabels[type]}汇总`} breadcrumb={['预警管理', '集中度风险监测', `${concentrationTypeLabels[type]}汇总`]} actions={<Button variant="secondary" onClick={() => navigate('/concentration-monitoring')}>返回总览</Button>}>
    <SearchPanel onSearch={() => undefined} onReset={() => setQ({ name: '', period: '2026年6月', min: '', max: '' })}><Field label={concentrationObjectLabel(type)}><Input value={q.name} onChange={name => setQ({ ...q, name })} /></Field><Field label="指标期次"><Select value={q.period} onChange={period => setQ({ ...q, period })} options={['2026年6月']} /></Field><Field label="集中度区间"><div className="date-range"><Input type="number" value={q.min} onChange={min => setQ({ ...q, min })} placeholder="最低%" /><span>至</span><Input type="number" value={q.max} onChange={max => setQ({ ...q, max })} placeholder="最高%" /></div></Field></SearchPanel>
    <div className="list-toolbar"><span>{concentrationTypeLabels[type]}监测对象 · {records.length} 条</span>{canExportConcentrationData(role) && <Button variant="secondary" onClick={exportRows}>⇩ 导出</Button>}</div>
    <Table><thead><tr><th>序号</th><th>{concentrationObjectLabel(type)}</th><th>{concentrationTypeLabels[type]}</th><th>{concentrationBalanceLabel(type)}</th><th>当期亮灯</th><th>指标期次</th><th>查看详情</th></tr></thead><tbody>{records.map((record, index) => <tr key={record.id}><td>{index + 1}</td><td>{record.objectName}</td><td><b>{record.concentrationRate.toFixed(2)}%</b></td><td>{concentrationMoney(record.businessBalance)}</td><td><StatusTag value={concentrationLightText(record.lightStatus)} /></td><td>{record.period}</td><td><TextAction onClick={() => navigate(`/concentration-monitoring/${concentrationTypeSlugs[type]}/${record.id}`)}>查看详情</TextAction></td></tr>)}</tbody></Table><Pagination total={records.length} page={1} setPage={() => undefined} />
  </Page>;
}

function ConcentrationTrendChart({ record }: { record: ConcentrationRecord }) {
  const width = 640; const height = 180; const chartBottom = 148; const max = Math.max(record.redThreshold + 5, ...record.historicalRecords.map(item => item.concentrationRate));
  const interval = Math.max(1, record.historicalRecords.length - 1);
  const points = record.historicalRecords.map((item, index) => `${index / interval * width},${chartBottom - item.concentrationRate / max * 128}`).join(' ');
  const maxBalance = Math.max(1, ...record.historicalRecords.map(item => item.businessBalance));
  const balancePoints = record.historicalRecords.map((item, index) => `${index / interval * width},${chartBottom - item.businessBalance / maxBalance * 112}`).join(' ');
  const thresholdY = (value: number) => chartBottom - value / max * 128;
  return <div className="concentration-trend"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">{[20, 52, 84, 116, 148].map(y => <line className="chart-grid-line" key={y} x1="0" y1={y} x2={width} y2={y} />)}<line className="chart-axis" x1="0" y1={chartBottom} x2={width} y2={chartBottom} /><line className="threshold yellow" x1="0" y1={thresholdY(record.yellowThreshold)} x2={width} y2={thresholdY(record.yellowThreshold)} /><line className="threshold red" x1="0" y1={thresholdY(record.redThreshold)} x2={width} y2={thresholdY(record.redThreshold)} /><polyline points={balancePoints} fill="none" stroke="#70a98d" strokeWidth="2" /><polyline points={points} fill="none" stroke="#2878d0" strokeWidth="2.5" />{record.historicalRecords.map((item, index) => <circle key={item.period} cx={index / interval * width} cy={thresholdY(item.concentrationRate)} r="2.8" fill="#fff" stroke="#2878d0" strokeWidth="2" />)}</svg><div className="concentration-trend-labels">{record.historicalRecords.map(item => <span key={item.period}>{item.period.replace('年', '.').replace('月', '')}</span>)}</div><div className="concentration-chart-legend"><span className="blue">集中度趋势</span><span className="balance">业务余额趋势</span><span className="yellow">黄灯阈值 {record.yellowThreshold}%</span><span className="red">红灯阈值 {record.redThreshold}%</span></div></div>;
}

function ConcentrationDonut({ items }: { items: ConcentrationCompositionItem[] }) {
  const colors = ['#2878d0', '#56a3e8', '#70bd9b', '#e8b955', '#8d9db3', '#7e6fd0']; let cursor = 0;
  const gradient = items.map((item, index) => { const start = cursor; cursor += item.proportion; return `${colors[index % colors.length]} ${start}% ${cursor}%`; }).join(', ');
  return <div className="concentration-donut-wrap"><div className="concentration-donut" style={{ background: `conic-gradient(${gradient || '#e8edf4 0 100%'})` }}><span><b>{items.reduce((sum, item) => sum + item.businessBalance, 0).toFixed(2)}</b>亿元</span></div><div className="concentration-donut-legend">{items.map((item, index) => <span key={item.id}><i style={{ background: colors[index % colors.length] }} /><b>{item.name}</b><small>{concentrationMoney(item.businessBalance)}</small><strong>{item.proportion.toFixed(2)}%</strong></span>)}</div></div>;
}

function ConcentrationAnalysisPage({ state, role, navigate }: PageProps) {
  const parts = window.location.pathname.split('/'); const type = getConcentrationTypeFromSlug(parts[2]); const id = parts[3];
  const data = useMemo(loadConcentrationData, []);
  const [dimension, setDimension] = useState<'institution' | 'businessType'>('institution');
  if (!type) return <EmptyModulePage title="集中度类型不存在" />;
  const record = getConsolidatedConcentrationRecords(data, type).find(item => item.id === id);
  if (!record) return <Page title="集中度分析" breadcrumb={['预警管理', '集中度风险监测']} actions={<Button variant="secondary" onClick={() => navigate('/concentration-monitoring')}>返回</Button>}><div className="empty-state"><h2>无权查看该集中度对象或数据不存在</h2></div></Page>;
  const composition = dimension === 'institution' ? record.compositionByInstitution : record.compositionByBusinessType;
  const dimensions = [['institution', '按往来机构'], ['businessType', '按业务类型']] as const;
  const openDetails = (item?: ConcentrationCompositionItem) => {
    const params = new URLSearchParams();
    if (item) params.set(dimension, item.name);
    navigate(`/concentration-monitoring/${concentrationTypeSlugs[type]}/${record.id}/details${params.size ? `?${params.toString()}` : ''}`);
  };
  const topInstitution = record.compositionByInstitution[0]; const topBusiness = record.compositionByBusinessType[0];
  const warning = state.warningDisposals.find(item => item.id === record.relatedWarningId);
  return <Page title={`${record.objectName}集中度分析`} breadcrumb={['预警管理', '集中度风险监测', `${record.objectName}分析`]} actions={<><Button variant="secondary" onClick={() => navigate(`/concentration-monitoring/${concentrationTypeSlugs[type]}`)}>返回汇总</Button>{canViewConcentrationWarning(role, warning) && <Button onClick={() => navigate(`/warning/disposal/${record.relatedWarningId}/overview?returnTo=${encodeURIComponent(window.location.pathname)}`)}>查看关联预警</Button>}</>}>
    <Section title="集中度基本信息"><div className="detail-grid concentration-analysis-info"><b>集中对象名称<span>{record.objectName}</span></b><b>当前集中度<span>{record.concentrationRate.toFixed(2)}%</span></b><b>业务余额<span>{concentrationMoney(record.businessBalance)}</span></b><b>计量分母<span>{record.denominatorType} {concentrationMoney(record.denominatorValue)}</span></b><b>当前亮灯<span><StatusTag value={concentrationLightText(record.lightStatus)} /></span></b><b>往来机构<span>{record.involvedInstitutionNames.join('、')}</span></b><b>业务类型<span>{record.primaryBusinessTypes.join(' / ')}</span></b><b>指标期次<span>{record.period}</span></b></div></Section>
    <div className="concentration-analysis-grid"><Section title="集中度与业务余额历史趋势"><ConcentrationTrendChart record={record} /></Section><Section title="构成分析" extra={<Tabs items={dimensions.map(([, label]) => label)} active={dimensions.find(([value]) => value === dimension)?.[1] || '按往来机构'} onChange={label => setDimension(dimensions.find(([, itemLabel]) => itemLabel === label)?.[0] || 'institution')} />}><ConcentrationDonut items={composition} /></Section></div>
    <Section title="构成明细"><Table><thead><tr><th>构成项</th><th>业务余额</th><th>占比</th><th>操作</th></tr></thead><tbody>{composition.map(item => <tr key={item.id}><td>{item.name}</td><td>{concentrationMoney(item.businessBalance)}</td><td>{item.proportion.toFixed(2)}%</td><td><TextAction onClick={() => openDetails(item)}>查看业务明细</TextAction></td></tr>)}</tbody></Table></Section>
    <Section title="主要结论"><div className="analysis-conclusion">{record.objectName}当前业务余额主要来源于{topInstitution?.name || '本机构'}，其中{topBusiness?.name || '相关业务类型'}占比较高；当前集中度为{record.concentrationRate.toFixed(2)}%，处于{concentrationLightText(record.lightStatus)}状态。</div><div className="form-actions"><Button variant="secondary" onClick={() => openDetails()}>查看全部业务明细</Button></div></Section>
  </Page>;
}

const businessTypesFromDetails = (details: ConcentrationBusinessDetail[]) => [...new Set(details.map(detail => detail.businessType))];

function ConcentrationBusinessDetailsPage({ role, navigate }: PageProps) {
  const parts = window.location.pathname.split('/'); const type = getConcentrationTypeFromSlug(parts[2]); const id = parts[3]; const data = useMemo(loadConcentrationData, []);
  const search = new URLSearchParams(window.location.search);
  const lockedInstitution = search.get('institution') || '';
  const lockedBusinessType = search.get('businessType') || '';
  const initialFilters = { institution: lockedInstitution, groupCustomer: '', businessType: lockedBusinessType, industry: '', region: '', businessDateStart: '', businessDateEnd: '', period: '2026年6月' };
  const [q, setQ] = useState(initialFilters);
  if (!type) return <EmptyModulePage title="集中度类型不存在" />;
  const base = getConsolidatedConcentrationRecords(data, type).find(record => record.id === id);
  if (!base) return <Page title="集中度业务明细" breadcrumb={['预警管理', '集中度风险监测']} actions={<Button variant="secondary" onClick={() => navigate('/concentration-monitoring')}>返回</Button>}><div className="empty-state"><h2>无权查看该业务明细或数据不存在</h2></div></Page>;
  const fixed = concentrationObjectFilter(type, base.objectName);
  const effectiveGroupCustomer = type === 'groupCustomer' ? base.objectName : q.groupCustomer;
  const effectiveIndustry = type === 'industry' ? base.objectName : q.industry;
  const effectiveRegion = type === 'region' ? base.objectName : q.region;
  const details = getConsolidatedConcentrationBusinessDetails(data, { institution: q.institution, groupCustomer: effectiveGroupCustomer, businessType: q.businessType, industry: effectiveIndustry, region: effectiveRegion, businessDateStart: q.businessDateStart, businessDateEnd: q.businessDateEnd, period: q.period, ...fixed });
  const objectNameForDetail = (detail: ConcentrationBusinessDetail) => type === 'singleCustomer' ? detail.customerName : type === 'groupCustomer' ? detail.groupCustomerName : type === 'industry' ? detail.industry : detail.region;
  const detailTitle = `${base.objectName}${lockedInstitution ? `-${lockedInstitution}` : lockedBusinessType ? `-${lockedBusinessType}` : ''}业务明细`;
  const exportRows = () => downloadCSV(`${detailTitle}.csv`, [['业务发生日期', '集中对象名称', '所属机构', '业务类型', '单笔业务余额', '行业', '区域', '数据期次', '数据来源'], ...details.map(detail => [detail.businessDate, objectNameForDetail(detail), detail.institution, detail.businessType, concentrationMoney(detail.businessBalance), detail.industry, detail.region, detail.period, detail.dataSource])]);
  return <Page title={detailTitle} breadcrumb={['预警管理', '集中度风险监测', `${base.objectName}分析`, '业务明细']} actions={<Button variant="secondary" onClick={() => navigate(`/concentration-monitoring/${concentrationTypeSlugs[type]}/${base.id}`)}>返回分析</Button>}>
    <SearchPanel onSearch={() => undefined} onReset={() => setQ(initialFilters)}><Field label="集中对象名称"><Input value={base.objectName} disabled /></Field><Field label="所属机构"><Select disabled={!!lockedInstitution} value={q.institution} onChange={institution => setQ({ ...q, institution })} options={concentrationInstitutions} /></Field><Field label="集团客户名称"><Select disabled={type === 'groupCustomer'} value={effectiveGroupCustomer} onChange={groupCustomer => setQ({ ...q, groupCustomer })} options={[...new Set(data.businessDetails.map(detail => detail.groupCustomerName))]} /></Field><Field label="业务类型"><Select disabled={!!lockedBusinessType} value={q.businessType} onChange={businessType => setQ({ ...q, businessType })} options={businessTypesFromDetails(data.businessDetails)} /></Field><Field label="行业"><Select disabled={type === 'industry'} value={effectiveIndustry} onChange={industry => setQ({ ...q, industry })} options={[...new Set(data.businessDetails.map(detail => detail.industry))]} /></Field><Field label="区域"><Select disabled={type === 'region'} value={effectiveRegion} onChange={region => setQ({ ...q, region })} options={[...new Set(data.businessDetails.map(detail => detail.region))]} /></Field><Field label="业务发生日期"><div className="date-range"><Input type="date" value={q.businessDateStart} onChange={businessDateStart => setQ({ ...q, businessDateStart })} /><span>至</span><Input type="date" value={q.businessDateEnd} onChange={businessDateEnd => setQ({ ...q, businessDateEnd })} /></div></Field><Field label="数据期次"><Select value={q.period} onChange={period => setQ({ ...q, period })} options={['2026年6月']} /></Field></SearchPanel>
    <div className="list-toolbar"><span>业务明细 · {details.length} 笔 · 合计 {concentrationMoney(details.reduce((sum, detail) => sum + detail.businessBalance, 0))}</span>{canExportConcentrationData(role) && <Button variant="secondary" onClick={exportRows}>⇩ 导出</Button>}</div>
    <Table><thead><tr><th>序号</th><th>业务发生日期</th><th>集中对象名称</th><th>所属机构</th><th>业务类型</th><th>单笔业务余额</th><th>行业</th><th>区域</th><th>数据期次</th><th>数据来源</th></tr></thead><tbody>{details.map((detail, index) => <tr key={detail.id}><td>{index + 1}</td><td>{detail.businessDate}</td><td>{objectNameForDetail(detail)}</td><td>{detail.institution}</td><td>{detail.businessType}</td><td>{concentrationMoney(detail.businessBalance)}</td><td>{detail.industry}</td><td>{detail.region}</td><td>{detail.period}</td><td>{detail.dataSource}</td></tr>)}</tbody></Table><Pagination total={details.length} page={1} setPage={() => undefined} />
  </Page>;
}

const majorEventWorkflowSteps = ['各金融机构提交事件首报', '集团核实事件并组织汇报', '各金融机构提交处置方案', '集团评估并审阅处置方案', '经理层、董事会审阅', '各金融机构执行处置并提交续报', '金控公司持续跟踪及结束评估', '终报归档或转入常态化跟踪'];

function MajorEventList({ state, role, navigate, update, toast }: PageProps) {
  const [q, setQ] = useState({ name: '', institution: '', type: '', status: '' });
  const items = state.majorEvents.filter(x => canViewInstitution(role, x.institution) && (!q.name || x.name.includes(q.name)) && (!q.institution || x.institution === q.institution) && (!q.type || x.type === q.type) && (!q.status || x.status === q.status));
  const behindEditorModal = window.location.pathname === '/major-events/new' || window.location.pathname.endsWith('/edit');
  const perform = (action: ReturnType<typeof getMajorEventActions>[number], item: MajorEvent) => {
    if (action === 'view') return navigate(`/major-events/${item.id}/overview`);
    if (action === 'edit' || action === 'submit-first') return navigate(`/major-events/${item.id}/edit`);
    if (action === 'follow-up') return navigate(`/major-events/${item.id}/follow-up`);
    if (action === 'final-report') return navigate(`/major-events/${item.id}/final-report`);
    if (action === 'delete') {
      if (!window.confirm(`确认删除草稿“${item.name}”吗？`)) return;
      update(current => { majorEventService.removeDraft(current, item.id); });
      return toast('重大风险事件草稿已删除');
    }
    if (action === 'history') return toast(item.logs.map(log => `${log.time} ${log.content}`).join('\n'));
    update(current => {
      const target = current.majorEvents.find(event => event.id === item.id);
      if (target) majorEventService.applyManagementAction(target, action, role);
    });
    toast(`${majorEventActionLabels[action]}操作已记录`);
  };
  return <Page title="重大风险事件报告" breadcrumb={['风险报告', '重大风险事件报告']} inline={behindEditorModal} actions={<Button variant="secondary" onClick={() => navigate('/major-events/definitions')}>重大风险事件定义管理</Button>}>
    <SearchPanel onSearch={() => undefined} onReset={() => setQ({ name: '', institution: '', type: '', status: '' })}>
      <Field label="事件名称"><Input value={q.name} onChange={v => setQ({ ...q, name: v })} /></Field>
      <Field label="所属机构"><Select value={q.institution} onChange={v => setQ({ ...q, institution: v })} options={role === '各金融机构' ? [currentInstitution] : institutions} /></Field>
      <Field label="风险事件类型"><Select value={q.type} onChange={v => setQ({ ...q, type: v })} options={getMajorRiskEventTypeOptions(state, true)} /></Field>
      <Field label="事件状态"><Select value={q.status} onChange={v => setQ({ ...q, status: v })} options={['草稿', '待核实', '待提交处置方案', '待集团评估', '待经理层审阅', '待董事会审阅', '处置执行中', '持续跟踪中', '待终报', '终报审核中', '常态化跟踪', '已归档', '已关闭', '已退回']} /></Field>
      <Field label="发生时间"><div className="date-range"><Input type="date" /><span>至</span><Input type="date" /></div></Field>
    </SearchPanel>
    <div className="list-toolbar">
      <span>重大风险事件台账 · {items.length} 条</span>
      <div>
        {permitted(role, 'event-create') && <Button onClick={() => navigate('/major-events/new')}>＋ 新增事件</Button>}
        <Button variant="secondary" onClick={() => downloadCSV('重大风险事件.csv', [['事件编号', '事件名称', '机构', '状态'], ...items.map(x => [x.code, x.name, x.institution, x.status])])}>⇩ 批量导出</Button>
      </div>
    </div>
    <Table><thead><tr><th>序号</th><th>事件编号</th><th>事件名称</th><th>所属机构</th><th>风险事件类型</th><th>发生时间</th><th>最新报送类型</th><th>当前环节</th><th>事件状态</th><th>操作</th><th>事件流程</th></tr></thead><tbody>{items.map((item, i) => { const actions = getMajorEventActions(role, item); return <tr key={item.id}><td>{i + 1}</td><td>{item.code}</td><td>{item.name}</td><td>{item.institution}</td><td>{item.type}</td><td>{item.occurredAt}</td><td>{item.latestReport}</td><td>{item.currentStage}</td><td><button className="status-link" onClick={() => navigate(`/major-events/${item.id}/overview`)}><StatusTag value={item.status} /></button></td><td>{actions.filter(action => action !== 'history').map(action => <TextAction key={action} onClick={() => perform(action, item)}>{majorEventActionLabels[action]}</TextAction>)}</td><td>{actions.includes('history') && <TextAction onClick={() => navigate(`/major-events/${item.id}/overview`)}>查看流程</TextAction>}</td></tr>; })}</tbody></Table>
    <Pagination total={items.length} page={1} setPage={() => undefined} />
  </Page>;
}

function MajorEventEditor({ state, role, navigate, update, toast }: PageProps) {
  const editingId = window.location.pathname.endsWith('/edit') ? window.location.pathname.split('/')[2] : undefined;
  const editing = state.majorEvents.find(event => event.id === editingId);
  const [form, setForm] = useState<Partial<MajorEvent>>(() => editing ? structuredClone(editing) : { name: '', institution: currentInstitution, type: '', occurredAt: '', discoveredAt: '', impact: '', contact: '', phone: '', basic: '', analysis: '', measures: '', trend: '', target: '', plan: '', responsibleDept: '', responsible: '', deadline: '' });
  const [files, setFiles] = useState<Attachment[]>(editing?.attachments || []);
  const set = (patch: Partial<MajorEvent>) => setForm(value => ({ ...value, ...patch }));
  const close = () => navigate('/major-events');
  const save = (mode: 'draft' | 'submit') => {
    if (!form.name?.trim()) return toast('请至少填写事件名称后保存草稿');
    if (!form.type || !isValidMajorRiskEventType(state, form.type)) return toast('请选择当前已生效的重大风险事件类型');
    if (mode === 'submit' && (!form.type || !form.institution || !form.occurredAt || !form.discoveredAt || !form.basic?.trim())) return toast('请填写事件名称、风险事件类型、所属机构、发生时间、发现时间和事件基本情况');
    let saved = false;
    update(current => {
      const value = { ...form, institution: currentInstitution, name: form.name?.trim(), basic: form.basic?.trim(), attachments: files };
      const target = editing ? current.majorEvents.find(event => event.id === editing.id) : undefined;
      saved = target ? !!majorEventService.update(target, value, role, mode, current) : !!majorEventService.create(current, value, role, mode);
    });
    if (!saved) return toast('事件类型已停用或不存在，请重新选择当前生效类型');
    toast(mode === 'draft' ? '重大风险事件首报草稿已保存' : '重大风险事件首报已提交集团核实');
    close();
  };
  const descriptionLimit = 1000;
  const permittedToEdit = editingId ? !!editing && canEditMajorEvent(role, editing) : can(role, 'event-create', { institution: currentInstitution });
  const eventTypeOptions = getMajorRiskEventTypeOptions(state);
  return <>
    <MajorEventList state={state} role={role} navigate={navigate} update={update} toast={toast} />
    <Page title={editing ? '编辑重大风险事件（事件首报）' : '新增重大风险事件（事件首报）'} breadcrumb={['风险报告', '重大风险事件报告', editing ? '编辑事件首报' : '新增事件首报']} onClose={close} hidePageTitle>
      {!permittedToEdit ? <div className="empty-state"><div className="empty-icon">!</div><h2>当前角色无权编辑重大风险事件</h2><p>仅各金融机构可新增本机构事件或编辑本机构草稿。</p></div> : <>
      <WorkflowSteps steps={majorEventWorkflowSteps} current={0} />
      <Section title="事件基本信息"><div className="form-grid">
        <Field label="事件编号"><Input value={editing?.code || majorEventService.nextCode(state)} disabled /></Field>
        <Field label="事件名称" required><Input value={form.name} onChange={value => set({ name: value })} /></Field>
        <Field label="风险事件类型" required><Select value={form.type} onChange={value => set({ type: value })} options={eventTypeOptions} /></Field>
        <Field label="所属机构"><Input value={currentInstitution} disabled /></Field>
        <Field label="发生时间" required><Input type="date" value={form.occurredAt} onChange={value => set({ occurredAt: value })} /></Field>
        <Field label="发现时间" required><Input type="date" value={form.discoveredAt} onChange={value => set({ discoveredAt: value })} /></Field>
        <Field label="最新报送类型"><Input value={editing?.latestReport || '首报'} disabled /></Field>
        <Field label="当前环节"><Input value={editing?.currentStage || '各金融机构提交事件首报'} disabled /></Field>
        <Field label="事件状态"><Input value={editing?.status || '草稿'} disabled /></Field>
        <Field label="影响范围"><Input value={form.impact} onChange={value => set({ impact: value })} placeholder="集团内、机构内、外部影响等" /></Field>
        <Field label="联系人"><div className="contact-fields"><Input value={form.contact} onChange={value => set({ contact: value })} placeholder="联系人" /><Input value={form.phone} onChange={value => set({ phone: value })} placeholder="联系电话" /></div></Field>
      </div></Section>
      <Section title="首报信息"><div className="form-grid">
        <Field label="事件基本情况" required><Textarea value={form.basic} onChange={value => set({ basic: value })} maxLength={descriptionLimit} showCount /></Field>
        <Field label="初步分析研判"><Textarea value={form.analysis} onChange={value => set({ analysis: value })} maxLength={descriptionLimit} showCount /></Field>
        <Field label="已采取措施"><Textarea value={form.measures} onChange={value => set({ measures: value })} maxLength={descriptionLimit} showCount /></Field>
        <Field label="发展趋势"><Textarea value={form.trend} onChange={value => set({ trend: value })} maxLength={descriptionLimit} showCount /></Field>
      </div></Section>
      <Section title="附件上传"><FileUploader files={files} onChange={setFiles} /></Section>
      <Section title="审阅及处理记录">{editing?.logs.length ? <OperationHistory logs={editing.logs} /> : <div className="inline-empty">保存后将生成操作记录</div>}</Section>
      <div className="form-actions major-event-form-actions">
        <Button variant="secondary" onClick={() => save('draft')}>保存草稿</Button>
        <Button onClick={() => save('submit')}>提交申请</Button>
        <Button variant="secondary" onClick={close}>返回</Button>
      </div>
      </>}
    </Page>
  </>;
}

function MajorEventOverview({ state, role, navigate, update, toast }: PageProps) {
  const id = window.location.pathname.split('/')[2];
  const item = state.majorEvents.find(event => event.id === id);
  if (!item || !canViewMajorEventOverview(role, item)) return <Page title="重大风险事件进度总览" breadcrumb={['风险报告', '重大风险事件报告']} onClose={() => navigate('/major-events')} actions={<Button variant="secondary" onClick={() => navigate('/major-events')}>返回列表</Button>}><div className="empty-state"><h2>无权查看该重大风险事件或事件不存在</h2></div></Page>;
  const workflow = item.workflow || { currentNodeId: 'event-initial-report', records: [] };
  const currentIndex = majorEventWorkflow.findIndex(node => node.id === workflow.currentNodeId);
  const downloadAttachment = (file: Attachment) => {
    downloadText(file.name + '.txt', `重大风险事件：${item.name}\n文件：${file.name}\n类型：${file.type}\n大小：${formatSize(file.size)}\n上传时间：${file.uploadedAt}`);
    update(current => { current.majorEvents.find(event => event.id === item.id)?.logs.push(createLog('下载附件', `下载事件附件：${file.name}`, role)); });
    toast('附件已下载并记录操作日志');
  };
  return <Page title="重大风险事件进度总览" breadcrumb={['风险报告', '重大风险事件报告', item.code, '进度总览']} onClose={() => navigate('/major-events')} actions={<><Button variant="secondary" onClick={() => navigate('/major-events')}>返回列表</Button><Button variant="secondary" onClick={() => downloadCSV(`${item.code}-进度总览.csv`, [['事件编号', '事件名称', '所属机构', '当前环节', '事件状态'], [item.code, item.name, item.institution, item.currentStage, item.status]])}>⇩ 导出</Button></>}>
    <div className="major-event-overview-banner"><div><span>MAJOR RISK EVENT</span><h2>{item.name}</h2><p>{item.code} · {item.institution} · {item.type}</p></div><div><StatusTag value={item.status} />{item.closureBranch && <StatusTag value={item.closureBranch === 'final-report' ? '终报归档' : '常态化跟踪'} />}</div></div>
    <Section title="事件基本信息"><div className="detail-grid major-event-info-grid"><b>事件编号<span>{item.code}</span></b><b>事件名称<span>{item.name}</span></b><b>风险事件类型<span>{item.type}</span></b><b>所属机构<span>{item.institution}</span></b><b>发生时间<span>{item.occurredAt}</span></b><b>发现时间<span>{item.discoveredAt || '—'}</span></b><b>最新报送类型<span>{item.latestReport}</span></b><b>当前环节<span>{item.currentStage}</span></b><b>事件状态<span><StatusTag value={item.status} /></span></b><b>影响范围<span>{item.impact || '—'}</span></b><b>联系人<span>{item.contact || '—'}</span></b><b>联系方式<span>{item.phone || '—'}</span></b></div></Section>
    <Section title="重大风险事件8节点处置进度"><div className="major-event-overview-flow">{majorEventWorkflow.map((node, index) => {
      const records = workflow.records.filter(record => record.nodeId === node.id);
      const latest = records[records.length - 1];
      const current = node.id === workflow.currentNodeId;
      const terminal = ['已归档', '已关闭'].includes(item.status) && current;
      const completed = index < currentIndex || terminal || (!!latest && latest.status !== '已退回' && !current);
      const returned = latest?.status === '已退回';
      const actor = getMajorEventNodeRole(item, node.id);
      const editable = current && canHandleMajorEventNode(role, node.id, item);
      const canOpen = current || completed || records.length > 0;
      const displayName = node.id === 'event-final-routine' && item.closureBranch ? (item.closureBranch === 'final-report' ? '终报归档' : '常态化跟踪') : node.name;
      return <React.Fragment key={node.id}><div className={`major-event-flow-node ${current ? 'current' : ''} ${completed ? 'completed' : ''} ${returned ? 'returned' : ''}`}><div className="major-event-flow-index">{completed ? '✓' : index + 1}</div><b>{displayName}</b><span>{current && !terminal ? '进行中' : returned ? '已退回' : completed ? '已完成' : '未开始'}</span><small>{latest ? `${latest.role} · ${latest.submittedAt}` : actor}</small><Button variant={editable ? 'primary' : 'secondary'} disabled={!canOpen} onClick={() => navigate(`/major-events/${item.id}/nodes/${node.id}?mode=${editable ? 'edit' : 'view'}`)}>{editable ? (actor === '各金融机构' ? '填写' : '办理') : canOpen ? '查看' : '未开始'}</Button></div>{index < majorEventWorkflow.length - 1 && <i className="major-event-flow-arrow">›</i>}</React.Fragment>;
    })}</div></Section>
    <Section title="事件附件"><div className="major-event-attachment-list">{item.attachments.length ? item.attachments.map(file => <div key={file.id}><span>▣ {file.name}</span><small>{formatSize(file.size)} · {file.uploadedAt}</small><TextAction onClick={() => downloadAttachment(file)}>下载</TextAction></div>) : <div className="empty-inline">暂无附件</div>}</div></Section>
    <Section title="操作记录"><OperationHistory logs={item.logs} /></Section>
  </Page>;
}

const createMajorEventMeasure = (): MajorEventMeasure => ({ id: uid('event-measure'), responsibleDepartment: '', responsiblePerson: '', measure: '', plannedStartDate: '', plannedCompletionDate: '', expectedEffect: '', submitted: false });
const initialMajorEventNodeForm = (item: MajorEvent, nodeId: string): Record<string, string> => {
  if (nodeId === 'event-initial-report') return { 事件名称: item.name, 风险事件类型: item.type, 发生时间: item.occurredAt, 发现时间: item.discoveredAt || item.occurredAt, 事件基本情况: item.basic, 初步分析研判: item.analysis, 影响范围: item.impact, 发展趋势: item.trend, 联系人: item.contact, 联系方式: item.phone };
  if (nodeId === 'event-plan') return { 处置目标: item.target || '', 资源保障: '', 风险控制目标: '', 信息报送安排: '' };
  if (nodeId === 'event-execution-report') return { 续报编号: `${item.code}-XB-${String(item.followUps.length + 1).padStart(2, '0')}`, 续报时间: today() };
  if (nodeId === 'event-final-routine' && item.closureBranch === 'final-report' && item.node8Actor === '各金融机构') return { 终报编号: item.finalReport?.code || `${item.code}-ZB-${String(1).padStart(2, '0')}` };
  if (nodeId === 'event-final-routine' && item.closureBranch === 'routine-tracking' && item.node8Actor === '各金融机构') return { 跟踪原因: item.routineTracking?.reason || '', 跟踪事项: item.routineTracking?.items || '', 责任机构: item.routineTracking?.responsibleInstitution || item.institution, 跟踪频率: item.routineTracking?.frequency || '', 下次反馈时间: item.routineTracking?.nextFeedbackDate || '', 当前风险情况: item.routineTracking?.currentRisk || '', 后续措施: item.routineTracking?.nextMeasures || '' };
  return {};
};

function MajorEventDetail({ state, role, navigate, update, toast }: PageProps) {
  const parts = window.location.pathname.split('/');
  const id = parts[2];
  const nodeId = parts[4];
  const requestedEdit = new URLSearchParams(window.location.search).get('mode') === 'edit';
  const item = state.majorEvents.find(event => event.id === id);
  const node = majorEventWorkflow.find(candidate => candidate.id === nodeId);
  const [form, setForm] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Attachment[]>([]);
  const [measures, setMeasures] = useState<MajorEventMeasure[]>([]);
  useEffect(() => {
    if (!item || !node) return;
    const draft = item.eventDrafts?.[node.id];
    setForm(draft?.formData || initialMajorEventNodeForm(item, node.id));
    setFiles(draft?.attachments || []);
    setMeasures(draft?.measures?.length ? structuredClone(draft.measures) : item.planMeasures?.length ? structuredClone(item.planMeasures) : [createMajorEventMeasure()]);
  }, [item?.id, node?.id, item?.reviewStage, item?.closureBranch, item?.node8Actor]);
  const back = () => navigate(`/major-events/${id}/overview`);
  if (!item || !node || !item.workflow || !canViewMajorEventOverview(role, item)) return <Page title="重大风险事件节点详情" breadcrumb={['风险报告', '重大风险事件报告']} onClose={() => navigate('/major-events')} actions={<Button variant="secondary" onClick={() => navigate('/major-events')}>返回</Button>}><div className="empty-state"><h2>无权查看该节点或节点不存在</h2></div></Page>;
  const workflow = item.workflow;
  const currentIndex = majorEventWorkflow.findIndex(candidate => candidate.id === workflow.currentNodeId);
  const nodeIndex = majorEventWorkflow.findIndex(candidate => candidate.id === node.id);
  const nodeRecords = workflow.records.filter(record => record.nodeId === node.id);
  const current = workflow.currentNodeId === node.id;
  const started = nodeIndex <= currentIndex || nodeRecords.length > 0;
  const editable = requestedEdit && current && canHandleMajorEventNode(role, node.id, item);
  const fields = getMajorEventNodeFields(item, node.id, role);
  const actor = getMajorEventNodeRole(item, node.id);
  const definition = state.majorRiskEventDefinitions.find(candidate => candidate.name === item.type);
  const setField = (name: string, value: string) => setForm(currentForm => ({ ...currentForm, [name]: value }));
  const updateMeasure = (index: number, key: keyof MajorEventMeasure, value: string) => setMeasures(currentMeasures => currentMeasures.map((measure, measureIndex) => measureIndex === index ? { ...measure, [key]: value } : measure));
  const validate = () => {
    const missing = fields.find(field => field.required && !String(form[field.name] || '').trim());
    if (missing) { toast(`请填写${missing.label}`); return false; }
    if (node.id === 'event-plan' && (!measures.length || measures.some(measure => !measure.responsibleDepartment || !measure.responsiblePerson || !measure.measure || !measure.plannedStartDate || !measure.plannedCompletionDate || !measure.expectedEffect))) { toast('请完整填写至少一条处置措施及其责任人、责任部门、计划时间和预期效果'); return false; }
    return true;
  };
  const saveDraft = () => {
    update(currentState => { majorEventService.saveNodeDraft(currentState, item.id, node.id, role, form, files, node.id === 'event-plan' ? measures : undefined); });
    toast('当前节点草稿已保存至本地存储');
  };
  const submit = (action: string) => {
    if (!canHandleMajorEventNode(role, node.id, item)) return toast('当前角色无权办理该节点');
    if (node.id === 'event-initial-report' && !isValidMajorRiskEventType(state, form['风险事件类型'] || '')) return toast('风险事件类型已停用或不存在，请选择当前生效类型');
    if (!validate()) return;
    if (node.id === 'event-verify' && action === '核实通过' && form['核实结论'] !== '核实通过') return toast('请选择“核实通过”后再提交');
    if (node.id === 'event-final-routine' && item.closureBranch === 'final-report' && role === '金控公司' && action === '审核终报并归档' && form['是否同意关闭'] !== '是') return toast('请选择同意关闭后再确认归档');
    let success = false;
    update(currentState => { success = majorEventService.submitNode(currentState, item.id, node.id, role, form, files, action, node.id === 'event-plan' ? measures : undefined); });
    if (!success) return toast('节点状态已变化，请返回进度总览后重试');
    toast(`${action}成功，事件流程已更新`);
    back();
  };
  const downloadAttachment = (file: Attachment) => {
    downloadText(file.name + '.txt', `重大风险事件：${item.name}\n文件：${file.name}\n大小：${formatSize(file.size)}\n上传时间：${file.uploadedAt}`);
    update(currentState => { currentState.majorEvents.find(event => event.id === item.id)?.logs.push(createLog('下载附件', `在${node.name}下载附件：${file.name}`, role)); });
    toast('附件已下载并记录操作日志');
  };
  const actionButtons = () => {
    if (node.id === 'event-initial-report') return <Button onClick={() => submit('提交首报')}>提交首报</Button>;
    if (node.id === 'event-verify') return <><Button variant="danger" onClick={() => submit('退回首报')}>退回补充</Button><Button variant="secondary" onClick={() => submit('不予认定')}>不予认定</Button><Button onClick={() => submit('核实通过')}>核实通过</Button></>;
    if (node.id === 'event-plan') return <Button onClick={() => submit('提交处置方案')}>提交处置方案</Button>;
    if (node.id === 'event-plan-assessment') return <><Button variant="danger" onClick={() => submit('退回处置方案')}>退回修改</Button><Button onClick={() => submit('评估通过')}>提交审阅</Button></>;
    if (node.id === 'event-executive-review' && item.reviewStage === 'board') return <><Button variant="danger" onClick={() => submit('退回调整')}>退回调整</Button><Button onClick={() => submit('董事会审阅')}>董事会审阅通过</Button></>;
    if (node.id === 'event-executive-review') return <><Button variant="danger" onClick={() => submit('退回调整')}>退回调整</Button><Button onClick={() => submit(form['是否提交董事会'] === '是' ? '提交董事会审阅' : '经理层审阅')}>{form['是否提交董事会'] === '是' ? '提交下一审阅环节' : '经理层审阅通过'}</Button></>;
    if (node.id === 'event-execution-report') return <Button onClick={() => submit('提交续报')}>提交续报</Button>;
    if (node.id === 'event-holding-track') return <><Button variant="secondary" onClick={() => submit('退回补充')}>退回补充</Button><Button variant="secondary" onClick={() => submit('催办')}>催办</Button><Button variant="secondary" onClick={() => submit('协调')}>记录协调情况</Button><Button variant="secondary" onClick={() => submit('继续处置')}>继续处置</Button><Button onClick={() => submit('进入终报')}>提交终报</Button><Button onClick={() => submit('转入常态化跟踪')}>转入常态化跟踪</Button></>;
    if (item.closureBranch === 'final-report' && role === '各金融机构') return <Button onClick={() => submit('提交终报')}>提交终报</Button>;
    if (item.closureBranch === 'final-report') return <><Button variant="danger" onClick={() => submit('退回补充')}>退回补充</Button><Button variant="secondary" onClick={() => submit('转入常态化跟踪')}>转入常态化跟踪</Button><Button onClick={() => submit('审核终报并归档')}>审核终报并归档</Button></>;
    if (role === '各金融机构') return <Button onClick={() => submit('更新常态化跟踪')}>提交跟踪更新</Button>;
    return <><Button variant="secondary" onClick={() => submit('催办')}>催办</Button><Button variant="secondary" onClick={() => submit('继续跟踪')}>继续跟踪</Button><Button variant="secondary" onClick={() => submit('重新进入处置流程')}>重新进入处置流程</Button><Button onClick={() => submit('结束跟踪并归档')}>结束跟踪并归档</Button></>;
  };
  if (!started) return <Page title="重大风险事件节点详情" breadcrumb={['风险报告', '重大风险事件报告', item.code]} onClose={back} actions={<Button variant="secondary" onClick={back}>返回进度总览</Button>}><div className="empty-state"><h2>该流程节点尚未开始</h2><p>请在前序节点完成后再查看或办理。</p></div></Page>;
  return <Page title={`重大风险事件节点详情 · ${node.id === 'event-final-routine' && item.closureBranch === 'routine-tracking' ? '常态化跟踪' : node.name}`} breadcrumb={['风险报告', '重大风险事件报告', item.code, node.name]} onClose={back} actions={<Button variant="secondary" onClick={back}>返回进度总览</Button>}>
    <Section title="重大风险事件8节点流程"><div className="major-event-detail-workflow"><InteractiveWorkflow definition={majorEventWorkflow} instance={workflow} selectedNodeId={node.id} onSelect={selected => navigate(`/major-events/${item.id}/nodes/${selected}?mode=${selected === workflow.currentNodeId && canHandleMajorEventNode(role, selected, item) ? 'edit' : 'view'}`)} /></div></Section>
    <Section title="事件基本信息"><div className="detail-grid major-event-info-grid"><b>事件编号<span>{item.code}</span></b><b>事件名称<span>{item.name}</span></b><b>风险事件类型<span>{item.type}</span></b><b>所属机构<span>{item.institution}</span></b><b>发生时间<span>{item.occurredAt}</span></b><b>发现时间<span>{item.discoveredAt || '—'}</span></b><b>当前环节<span>{item.currentStage}</span></b><b>事件状态<span><StatusTag value={item.status} /></span></b><b>当前办理角色<span>{actor}</span></b><b>节点8分支<span>{item.closureBranch === 'final-report' ? '终报归档' : item.closureBranch === 'routine-tracking' ? '常态化跟踪' : '—'}</span></b></div></Section>
    {node.id === 'event-verify' && <Section title="事件定义及判断依据"><div className="read-block"><b>{definition?.name || item.type}</b><p>{definition?.criteria.join('；') || '按当前重大风险事件定义及管理要求核实判断。'}</p><b>参考依据</b><p>{definition?.referenceBasis || '—'}</p></div></Section>}
    {item.planMeasures?.length ? <Section title="处置措施"><Table><thead><tr><th>序号</th><th>责任部门</th><th>责任人</th><th>处置措施</th><th>计划开始</th><th>计划完成</th><th>预期效果</th></tr></thead><tbody>{item.planMeasures.map((measure, index) => <tr key={measure.id}><td>{index + 1}</td><td>{measure.responsibleDepartment}</td><td>{measure.responsiblePerson}</td><td>{measure.measure}</td><td>{measure.plannedStartDate}</td><td>{measure.plannedCompletionDate}</td><td>{measure.expectedEffect}</td></tr>)}</tbody></Table></Section> : null}
    {item.followUps.length > 0 && <Section title="全部续报记录"><Table><thead><tr><th>续报编号</th><th>续报时间</th><th>事件最新情况</th><th>风险变化</th><th>完成比例</th><th>下一步安排</th></tr></thead><tbody>{item.followUps.map((report, index) => <tr key={report.id || index}><td>{report.code || `续报${index + 1}`}</td><td>{report.date}</td><td>{report.latestProgress}</td><td>{report.riskChange}</td><td>{report.completionRate ? `${report.completionRate}%` : '—'}</td><td>{report.nextStep}</td></tr>)}</tbody></Table></Section>}
    {item.finalReport && <Section title="终报信息"><div className="read-block"><b>{item.finalReport.code || '终报'}</b><p>事件最终情况：{item.finalReport.result}</p><p>事件影响结果：{item.finalReport.impact}</p><p>风险是否解除：{item.finalReport.release}</p><p>后续管理建议：{item.finalReport.followUp}</p></div></Section>}
    {item.routineTracking?.records.length ? <Section title="常态化跟踪记录">{item.routineTracking.records.map(record => <div className="report-block" key={record.id}><b>{record.date} · {record.role}</b><p>{record.content}</p></div>)}</Section> : null}
    <WorkflowFeedbackOverview definition={majorEventWorkflow} instance={workflow} role={role} institution={item.institution} selectedNodeId={node.id} onReturnCurrent={() => navigate(`/major-events/${item.id}/nodes/${workflow.currentNodeId}?mode=${canHandleMajorEventNode(role, workflow.currentNodeId, item) ? 'edit' : 'view'}`)} />
    {editable && <Section title={`当前节点办理 · ${node.name}${node.id === 'event-executive-review' ? `（${item.reviewStage === 'board' ? '董事会审阅' : '经理层审阅'}）` : ''}`}><div className="current-node-note">只允许当前办理角色编辑本节点；保存草稿不改变流程状态，提交后形成独立历史记录。</div><div className="form-grid">{fields.map(field => <Field label={field.label} required={field.required} span={field.type === 'textarea' ? 2 : 1} key={field.name}>{field.type === 'textarea' ? <Textarea value={form[field.name] || ''} onChange={value => setField(field.name, value)} maxLength={field.maxLength} showCount /> : field.type === 'select' ? <Select value={form[field.name] || ''} onChange={value => setField(field.name, value)} options={field.options || []} /> : <Input type={field.type || 'text'} value={form[field.name] || ''} onChange={value => setField(field.name, value)} maxLength={field.maxLength} />}</Field>)}</div>
      {node.id === 'event-plan' && <div className="major-event-measures"><div className="major-event-subsection-head"><b>处置措施清单</b><Button variant="secondary" onClick={() => setMeasures(currentMeasures => [...currentMeasures, createMajorEventMeasure()])}>＋ 新增措施</Button></div>{measures.map((measure, index) => <div className="major-event-measure-card" key={measure.id}><div className="major-event-measure-title"><b>措施 {index + 1}{measure.submitted ? '（已提交记录）' : ''}</b><TextAction disabled={measures.length === 1 || measure.submitted} onClick={() => setMeasures(currentMeasures => currentMeasures.filter((_, measureIndex) => measureIndex !== index))}>删除</TextAction></div><div className="form-grid"><Field label="责任部门" required><Input value={measure.responsibleDepartment} onChange={value => updateMeasure(index, 'responsibleDepartment', value)} placeholder="手工输入，多个部门请使用顿号或逗号分隔" /></Field><Field label="责任人" required><Input value={measure.responsiblePerson} onChange={value => updateMeasure(index, 'responsiblePerson', value)} /></Field><Field label="处置措施" required span={2}><Textarea value={measure.measure} onChange={value => updateMeasure(index, 'measure', value)} maxLength={1500} showCount /></Field><Field label="计划开始时间" required><Input type="date" value={measure.plannedStartDate} onChange={value => updateMeasure(index, 'plannedStartDate', value)} /></Field><Field label="计划完成时间" required><Input type="date" value={measure.plannedCompletionDate} onChange={value => updateMeasure(index, 'plannedCompletionDate', value)} /></Field><Field label="预期效果" required span={2}><Textarea value={measure.expectedEffect} onChange={value => updateMeasure(index, 'expectedEffect', value)} /></Field></div></div>)}</div>}
      <Field label="本节点附件"><FileUploader files={files} onChange={setFiles} /></Field><div className="form-actions"><Button variant="secondary" onClick={saveDraft}>{actor === '各金融机构' ? '保存草稿' : '保存意见'}</Button>{actionButtons()}<Button variant="secondary" onClick={back}>返回</Button></div></Section>}
    {current && !editable && <div className="readonly-current-node">当前节点由“{actor}”办理，当前角色仅可查看已提交信息和历史记录。{requestedEdit ? '系统已自动切换为只读模式。' : ''}</div>}
    <Section title="事件附件"><div className="major-event-attachment-list">{item.attachments.length ? item.attachments.map(file => <div key={file.id}><span>▣ {file.name}</span><small>{formatSize(file.size)} · {file.uploadedAt}</small><TextAction onClick={() => downloadAttachment(file)}>下载</TextAction></div>) : <div className="empty-inline">暂无附件</div>}</div></Section>
    <Section title="全部操作记录"><OperationHistory logs={item.logs} /></Section>
  </Page>;
}


function periodInputOrder(value: string) { const match = value.match(/(\d{4})\D*(\d{1,2})?/); return match ? Number(match[1]) * 100 + Number(match[2] || 0) : 0; }

type ReportCenterTab = '管理报表' | '专题分析' | '监管报表' | '报表记录';

function ReportAnalysisCenter({ state, role, navigate, update, toast }: PageProps) {
  const [tab, setTab] = useState<ReportCenterTab>('管理报表');
  const [query, setQuery] = useState({ name: '', type: '', institution: '', period: '', status: '' });
  const [selectedReport, setSelectedReport] = useState<{ name: string; type: string; institution: string; period: string; status: string; description: string } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadReportId, setUploadReportId] = useState('');
  const [uploadPeriod, setUploadPeriod] = useState('');
  const [uploadFiles, setUploadFiles] = useState<Attachment[]>([]);
  const managementReports = [
    ...state.reports.map(report => ({ id: report.id, name: report.name, type: report.type, institution: report.institution, period: report.latestReportDate, method: report.submissions.length ? '机构上传' : '系统生成', updatedAt: report.latestSubmitDate, status: report.status, description: report.description })),
    { id: 'demo-risk-preference', name: '风险偏好及限额执行情况表', type: '管理报表', institution: '集团本部', period: '2024年二季度', method: '系统生成', updatedAt: '2024-07-08', status: '已生成', description: '汇总集团风险偏好目标、限额执行及偏离情况。' },
    { id: 'demo-warning', name: '预警事项汇总表', type: '管理报表', institution: '集团本部', period: '2024年6月', method: '系统生成', updatedAt: '2024-07-05', status: '已生成', description: '汇总当期红黄灯预警、处置进展及解除情况。' },
    { id: 'demo-major-event', name: '重大风险事件汇总表', type: '管理报表', institution: '集团本部', period: '2024年二季度', method: '系统生成', updatedAt: '2024-07-06', status: '已生成', description: '汇总重大风险事件首报、续报、终报和处置进度。' },
    { id: 'demo-capital', name: '资本并表监测情况表', type: '管理报表', institution: '集团本部', period: '2024年6月', method: '系统生成', updatedAt: '2024-07-04', status: '已生成', description: '汇总资本并表监测指标及变动情况。' },
  ];
  const filteredManagement = managementReports.filter(report => (!query.name || report.name.includes(query.name)) && (!query.type || report.type === query.type) && (!query.institution || report.institution === query.institution) && (!query.period || report.period.includes(query.period)) && (!query.status || report.status === query.status));
  const topics = [
    { name: '风险指标运行分析', description: '分析风险指标运行趋势、亮灯分布及历史变化。', period: '2024年6月', updatedAt: '2024-07-08', path: '/indicators/query' },
    { name: '预警情况分析', description: '分析预警数量、等级、处置进度及解除情况。', period: '2024年6月', updatedAt: '2024-07-07', path: '/warning/disposal' },
    { name: '集中度风险分析', description: '从客户、行业、区域等维度分析集中度风险。', period: '2024年6月', updatedAt: '2024-07-06', path: '/concentration-monitoring' },
    { name: '机构风险情况分析', description: '按并表机构汇总风险指标、预警和重大事项。', period: '2024年二季度', updatedAt: '2024-07-05', path: '/dashboard' },
  ].filter(topic => role === '集团' || topic.path !== '/dashboard');
  const regulatoryReports = [
    { name: '金控集团风险并表监管报表', type: '风险监管报表', period: '2024年二季度', status: '已生成', updatedAt: '2024-07-09' },
    { name: '金控集团资本并表监管报表', type: '资本监管报表', period: '2024年二季度', status: '生成中', updatedAt: '2024-07-09' },
    { name: '重大风险事项监管报告', type: '风险事项报告', period: '2024年6月', status: '待生成', updatedAt: '2024-07-08' },
  ].filter(report => (!query.name || report.name.includes(query.name)) && (!query.type || report.type === query.type) && (!query.period || report.period.includes(query.period)) && (!query.status || report.status === query.status));
  const reportRecords = [
    ...state.reports.flatMap(report => report.submissions.map((submission, index) => ({ id: submission.id, name: report.name, type: report.type, period: submission.reportDate, time: `${submission.submitDate} ${submission.submitTime}`, user: submission.submitter, version: `V${report.submissions.length - index}.0`, status: report.status, note: `上传记录：${submission.note}` }))),
    { id: 'record-generate-1', name: '风险偏好及限额执行情况表', type: '管理报表', period: '2024年二季度', time: '2024-07-08 10:20:12', user: '金控公司', version: 'V1.0', status: '已生成', note: '系统生成记录' },
    { id: 'record-download-1', name: '重大风险事件汇总表', type: '管理报表', period: '2024年二季度', time: '2024-07-09 09:18:36', user: '集团', version: 'V1.0', status: '已完成', note: '历史版本下载记录' },
  ];
  const resetQuery = () => setQuery({ name: '', type: '', institution: '', period: '', status: '' });
  const downloadReport = (name: string, period: string) => downloadText(`${name}-${period}.txt`, `${name}\n报告期间：${period}\n集团并表管理系统 DEMO 报表文件`);
  const submitUpload = () => {
    if (!uploadReportId || !uploadPeriod || !uploadFiles.length) return toast('请选择报表、填写报告期间并上传文件');
    update(current => {
      const report = current.reports.find(item => item.id === uploadReportId);
      if (!report) return;
      reportService.addSubmission(report, { serial: `SUB-${Date.now()}`, reportDate: uploadPeriod, submitDate: today(), submitTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }), submitter: role, note: '报表与分析中心上传', files: uploadFiles }, role);
    });
    setUploadOpen(false); setUploadFiles([]); setUploadReportId(''); setUploadPeriod(''); toast('报表已上传并形成报表记录');
  };
  return <Page title="报表与分析中心" breadcrumb={['报表与分析中心']}>
    <div className="report-center-intro">集中提供并表管理相关报表、专题分析及监管报表的统一查询、生成和应用入口。</div>
    <Tabs items={['管理报表', '专题分析', '监管报表', '报表记录']} active={tab} onChange={item => { setTab(item as ReportCenterTab); resetQuery(); }} />
    {tab === '管理报表' && <>
      <SearchPanel onSearch={() => undefined} onReset={resetQuery}><Field label="报表名称"><Input value={query.name} onChange={name => setQuery({ ...query, name })} /></Field><Field label="报表类型"><Select value={query.type} onChange={type => setQuery({ ...query, type })} options={['管理报表', '风险监测报表', '监管报表']} /></Field><Field label="报送机构"><Select value={query.institution} onChange={institution => setQuery({ ...query, institution })} options={['集团本部', ...institutions]} /></Field><Field label="报告期间"><Input value={query.period} onChange={period => setQuery({ ...query, period })} placeholder="例如：2024年6月" /></Field><Field label="报表状态"><Select value={query.status} onChange={status => setQuery({ ...query, status })} options={['待生成', '生成中', '已生成', '已报送']} /></Field></SearchPanel>
      <div className="list-toolbar"><span>管理报表 · {filteredManagement.length} 条</span><div>{role === '金控公司' && <Button onClick={() => toast('报表生成任务已创建，可在“报表记录”查看进度')}>＋ 生成报表</Button>}{can(role, 'report-upload', { institution: currentInstitution }) && <Button variant="secondary" onClick={() => setUploadOpen(true)}>⇧ 上传报表</Button>}</div></div>
      <Table><thead><tr><th>序号</th><th>报表名称</th><th>报表类型</th><th>报送机构</th><th>报告期间</th><th>生成方式</th><th>更新时间</th><th>状态</th><th>操作</th></tr></thead><tbody>{filteredManagement.map((report, index) => <tr key={report.id}><td>{index + 1}</td><td>{report.name}</td><td>{report.type}</td><td>{report.institution}</td><td>{report.period}</td><td>{report.method}</td><td>{report.updatedAt}</td><td><StatusTag value={report.status} /></td><td><TextAction onClick={() => setSelectedReport(report)}>查看</TextAction><TextAction onClick={() => downloadReport(report.name, report.period)}>下载</TextAction></td></tr>)}</tbody></Table><Pagination total={filteredManagement.length} page={1} setPage={() => undefined} />
    </>}
    {tab === '专题分析' && <div className="analysis-topic-grid">{topics.map(topic => <section className="card analysis-topic-card" key={topic.name}><div><span>专题分析</span><h3>{topic.name}</h3><p>{topic.description}</p></div><dl><div><dt>数据期次</dt><dd>{topic.period}</dd></div><div><dt>最近更新时间</dt><dd>{topic.updatedAt}</dd></div></dl><Button variant="secondary" onClick={() => navigate(topic.path)}>进入分析</Button></section>)}</div>}
    {tab === '监管报表' && <><SearchPanel onSearch={() => undefined} onReset={resetQuery}><Field label="监管报表名称"><Input value={query.name} onChange={name => setQuery({ ...query, name })} /></Field><Field label="报表类型"><Select value={query.type} onChange={type => setQuery({ ...query, type })} options={['风险监管报表', '资本监管报表', '风险事项报告']} /></Field><Field label="报告期间"><Input value={query.period} onChange={period => setQuery({ ...query, period })} /></Field><Field label="状态"><Select value={query.status} onChange={status => setQuery({ ...query, status })} options={['待生成', '生成中', '已生成']} /></Field></SearchPanel><div className="list-toolbar"><span>监管报表 · {regulatoryReports.length} 条</span>{role === '金控公司' && <Button onClick={() => toast('监管报表生成任务已创建')}>＋ 生成监管报表</Button>}</div><Table><thead><tr><th>序号</th><th>监管报表名称</th><th>报表类型</th><th>报告期间</th><th>更新时间</th><th>生成状态</th><th>操作</th></tr></thead><tbody>{regulatoryReports.map((report, index) => <tr key={report.name}><td>{index + 1}</td><td>{report.name}</td><td>{report.type}</td><td>{report.period}</td><td>{report.updatedAt}</td><td><StatusTag value={report.status} /></td><td><TextAction onClick={() => setSelectedReport({ ...report, institution: '集团本部', description: '监管报表 DEMO 示例，暂不包含复杂报送流程。' })}>查看</TextAction><TextAction disabled={report.status !== '已生成'} onClick={() => downloadReport(report.name, report.period)}>下载</TextAction></td></tr>)}</tbody></Table></>}
    {tab === '报表记录' && <><div className="list-toolbar"><span>集中展示报表历次生成、上传及下载记录 · {reportRecords.length} 条</span></div><Table><thead><tr><th>报表名称</th><th>报表类型</th><th>报告期间</th><th>生成/上传时间</th><th>操作用户</th><th>版本</th><th>状态</th><th>操作</th></tr></thead><tbody>{reportRecords.map(record => <tr key={record.id}><td>{record.name}</td><td>{record.type}</td><td>{record.period}</td><td>{record.time}</td><td>{record.user}</td><td>{record.version}</td><td><StatusTag value={record.status} /></td><td><TextAction onClick={() => setSelectedReport({ name: record.name, type: record.type, institution: record.user, period: record.period, status: record.status, description: record.note })}>查看</TextAction><TextAction onClick={() => downloadReport(record.name, record.period)}>下载历史版本</TextAction></td></tr>)}</tbody></Table><Pagination total={reportRecords.length} page={1} setPage={() => undefined} /></>}
    {selectedReport && <Modal title={selectedReport.name} onClose={() => setSelectedReport(null)} footer={<><Button variant="secondary" onClick={() => downloadReport(selectedReport.name, selectedReport.period)}>下载</Button><Button onClick={() => setSelectedReport(null)}>关闭</Button></>}><div className="detail-grid"><b>报表名称<span>{selectedReport.name}</span></b><b>报表类型<span>{selectedReport.type}</span></b><b>报送机构<span>{selectedReport.institution}</span></b><b>报告期间<span>{selectedReport.period}</span></b><b>状态<span><StatusTag value={selectedReport.status} /></span></b></div><div className="read-block"><b>报表说明</b><p>{selectedReport.description}</p></div></Modal>}
    {uploadOpen && <Modal title="上传报表" onClose={() => setUploadOpen(false)} footer={<><Button variant="secondary" onClick={() => setUploadOpen(false)}>取消</Button><Button onClick={submitUpload}>提交</Button></>}><div className="form-grid"><Field label="报表名称" required><Select value={state.reports.find(report => report.id === uploadReportId)?.name || ''} onChange={name => setUploadReportId(state.reports.find(report => report.name === name)?.id || '')} options={state.reports.map(report => report.name)} /></Field><Field label="报告期间" required><Input value={uploadPeriod} onChange={setUploadPeriod} placeholder="例如：2024-06-30" /></Field></div><div className="report-upload-files"><FileUploader files={uploadFiles} onChange={setUploadFiles} /></div></Modal>}
  </Page>;
}

function IndicatorHistoryDetail({ state, navigate }: PageProps) {
  const id = window.location.pathname.split('/').pop() || '';
  const selected = state.indicatorPeriodRecords.find(record => record.id === id);
  const [historyOpen, setHistoryOpen] = useState(false);
  if (!selected) return <Page title="历史指标趋势" breadcrumb={['指标管理', '指标查询']} actions={<Button variant="secondary" onClick={() => navigate('/indicators/query')}>返回</Button>}><div className="empty-state"><h2>历史指标记录不存在</h2></div></Page>;
  const history = getIndicatorHistoryRecords(state.indicatorPeriodRecords, selected);
  return <Page title="历史指标趋势" breadcrumb={['指标管理', '指标查询', selected.indicatorName]} actions={<><Button variant="secondary" onClick={() => navigate('/indicators/query')}>返回</Button><Button variant="secondary" onClick={() => setHistoryOpen(true)}>查看累计亮灯情况</Button></>}><Section title="指标基本信息"><div className="detail-grid"><b>指标编码<span>{selected.indicatorCode}</span></b><b>指标名称<span>{selected.indicatorName}</span></b><b>当前机构<span>{selected.institution}</span></b><b>指标类型<span>{selected.indicatorType} / {selected.indicatorSubType}</span></b><b>监测频率<span>{selected.monitoringFrequency}</span></b><b>预测范围<span>{selected.forecastRange}</span></b><b>黄灯规则<span>{selected.yellowRule}</span></b><b>红灯规则<span>{selected.redRule}</span></b></div><div className="read-block"><b>指标定义</b><p>{selected.indicatorDefinition}</p></div></Section><Section title="历史趋势"><div className="indicator-trend-strip">{[...history].reverse().map((record, index) => <div key={record.id}><span>{record.period}</span><i style={{ height: `${34 + index * 18}px` }} /><b>{record.indicatorValue}</b><StatusTag value={record.currentLightStatus} /></div>)}</div><Table><thead><tr><th>指标期次</th><th>监测频率</th><th>指标值</th><th>黄灯规则</th><th>红灯规则</th><th>当期亮灯情况</th></tr></thead><tbody>{history.map(record => <tr key={record.id}><td>{record.period}</td><td>{record.monitoringFrequency}</td><td>{record.indicatorValue}</td><td>{record.yellowRule}</td><td>{record.redRule}</td><td><StatusTag value={record.currentLightStatus} /></td></tr>)}</tbody></Table></Section>{historyOpen && <IndicatorLightHistoryModal record={selected} records={state.indicatorPeriodRecords} onClose={() => setHistoryOpen(false)} />}</Page>;
}

function ReportSubmissions({ state, role, navigate, update, toast }: PageProps) { const id = window.location.pathname.split('/')[2]; const report = state.reports.find(x => x.id === id) || state.reports[0]; return <Page title="报送明细" breadcrumb={['报表中心', report.name, '报送明细']} actions={<Button variant="secondary" onClick={() => navigate('/reports')}>返回</Button>}><Section title="报表基本信息"><div className="detail-grid"><b>报表编号<span>{report.code}</span></b><b>报表名称<span>{report.name}</span></b><b>报送机构<span>{report.institution}</span></b><b>报表类型<span>{report.type}</span></b><b>报送频率<span>{report.frequency}</span></b><b>报表说明<span>{report.description}</span></b></div></Section><Section title="历次报送记录"><Table><thead><tr><th>序号</th><th>报送文件流水号</th><th>报表日期</th><th>报送日期</th><th>报送时间</th><th>报送人</th><th>报送说明</th><th>操作</th></tr></thead><tbody>{report.submissions.map((item, i) => <tr key={item.id}><td>{i + 1}</td><td>{item.serial}</td><td>{item.reportDate}</td><td>{item.submitDate}</td><td>{item.submitTime}</td><td>{item.submitter}</td><td>{item.note}</td><td><TextAction onClick={() => toast(`在线查看：${item.serial}`)}>在线查看</TextAction><TextAction onClick={() => downloadText(`${item.serial}.txt`, `${report.name}\n${item.note}`)}>下载</TextAction></td></tr>)}</tbody></Table></Section></Page>; }

function ReportUpload({ state, role, navigate, update, toast }: PageProps) { const [form, setForm] = useState({ report: '', type: '', date: '', note: '' }); const [files, setFiles] = useState<Attachment[]>([]); const report = state.reports.find(x => x.id === form.report); const submit = () => { if (!form.report || !form.type || !form.date || !files.length) return toast('请填写报表编号、报表类型、报表日期并上传附件'); update(s => { const item = s.reports.find(x => x.id === form.report); if (!item) return; reportService.addSubmission(item, { serial: `SUB-${Date.now()}`, reportDate: form.date, submitDate: today(), submitTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }), submitter: role, note: form.note, files }, role); }); toast('报表报送记录已形成'); navigate('/reports'); }; return <Page title="报表上传" breadcrumb={['报表中心', '报表报送']} actions={<><AiFeatureEntry name="AI辅助报送" /><Button variant="secondary" onClick={() => navigate('/reports')}>取消</Button><Button onClick={submit}>提交</Button></>}><Section title="报表基本信息"><div className="form-grid"><Field label="报表编号" required><Select value={form.report} onChange={v => setForm({ ...form, report: state.reports.find(x => x.code === v)?.id || v })} options={state.reports.map(x => x.code)} /></Field><Field label="报表名称" required><Select value={form.report} onChange={v => setForm({ ...form, report: state.reports.find(x => x.name === v)?.id || v })} options={state.reports.map(x => x.name)} /></Field><Field label="报表类型" required><Select value={form.type} onChange={v => setForm({ ...form, type: v })} options={['财务报表', '风险监测报表', '监管报表']} /></Field><Field label="报表日期" required><Input type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} /></Field></div></Section><Section title="附件上传"><FileUploader files={files} onChange={setFiles} /></Section><Section title="报送说明"><Field label="报送说明"><Textarea value={form.note} onChange={v => setForm({ ...form, note: v })} /></Field></Section></Page>; }

function PeriodicReports({ state, role, navigate, update, toast }: PageProps) { const [q, setQ] = useState({ name: '', institution: '', type: '', cycle: '' }); const items = state.periodicReports.filter(x => (!q.name || x.name.includes(q.name)) && (!q.institution || x.institution === q.institution) && (!q.type || x.type === q.type) && (!q.cycle || x.cycle === q.cycle)); const del = (item: PeriodicReport) => { if (!window.confirm(`确认删除“${item.name}”吗？`)) return; update(s => { s.periodicReports = s.periodicReports.filter(x => x.id !== item.id); }); toast('报告已删除'); }; return <Page title="定期风险报告管理" breadcrumb={['风险报告', '定期风险报告']} actions={<><AiFeatureEntry name="AI风险报告生成" /><Button onClick={() => navigate('/periodic-reports/upload')}>＋ 报告上传</Button></>}><SearchPanel onSearch={() => undefined} onReset={() => setQ({ name: '', institution: '', type: '', cycle: '' })}><Field label="报告名称"><Input value={q.name} onChange={v => setQ({ ...q, name: v })} /></Field><Field label="报送日期起止"><div className="date-range"><Input type="date" /><span>至</span><Input type="date" /></div></Field><Field label="报送机构"><Select value={q.institution} onChange={v => setQ({ ...q, institution: v })} options={institutions} /></Field><Field label="报告类型"><Select value={q.type} onChange={v => setQ({ ...q, type: v })} options={['全面风险管理报告', '风险监测报告']} /></Field><Field label="周期性"><Select value={q.cycle} onChange={v => setQ({ ...q, cycle: v })} options={['周', '月度', '季度', '年度']} /></Field></SearchPanel><Table><thead><tr><th>报送日期</th><th>报告日期</th><th>定期风险报告名称</th><th>报送机构</th><th>报告类型</th><th>周期性</th><th>报告概述</th><th>附件</th><th>操作</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td>{item.submitDate}</td><td>{item.reportDate}</td><td>{item.name}</td><td>{item.institution}</td><td>{item.type}</td><td>{item.cycle}</td><td className="ellipsis">{item.overview}</td><td>{item.attachments.length ? '有附件' : '无附件'}</td><td><TextAction onClick={() => downloadText(`${item.name}.txt`, `${item.name}\n${item.overview}`)}>查看下载</TextAction><TextAction onClick={() => navigate(`/periodic-reports/${item.id}/edit`)}>编辑</TextAction><TextAction onClick={() => del(item)}>删除</TextAction></td></tr>)}</tbody></Table><Pagination total={items.length} page={1} setPage={() => undefined} /></Page>; }


function PeriodicReportEditor({ state, role, navigate, update, toast }: PageProps) { const id = window.location.pathname.split('/')[2]; const existing = state.periodicReports.find(x => x.id === id); const [form, setForm] = useState<Partial<PeriodicReport>>(() => existing ? structuredClone(existing) : { name: '', institution: '上海农商银行', type: '全面风险管理报告', reportDate: '', cycle: '月度', overview: '', visibleInstitutions: ['上海农商银行'], visibleDepartments: ['金融机构管理部'], viewers: [], pushMethod: '平台通知', attachments: [] }); const [files, setFiles] = useState<Attachment[]>(form.attachments || []); const set = (patch: Partial<PeriodicReport>) => setForm(x => ({ ...x, ...patch })); const submit = (draft: boolean) => { if (!form.name || !form.type || !form.reportDate || !form.cycle) return toast('请填写报告名称、类型、日期、周期'); update(s => { let item = existing ? s.periodicReports.find(x => x.id === existing.id)! : periodicReportService.create(s, { ...form, attachments: files }, role); if (existing) Object.assign(item, form, { attachments: files, status: draft ? '草稿' : '已提交', logs: [...item.logs, createLog(draft ? '保存草稿' : '提交', draft ? '保存报告草稿' : '提交定期风险报告', role)] }); else if (!draft) item.status = '已提交'; }); toast(draft ? '报告草稿已保存' : '定期风险报告已提交'); navigate('/periodic-reports'); }; return <Page title={existing ? '定期风险报告 - 编辑' : '定期风险报告 - 报告上传'} breadcrumb={['风险报告', '定期风险报告', existing ? '编辑' : '报告上传']} actions={<><AiFeatureEntry name="AI辅助报送" /><Button variant="secondary" onClick={() => navigate('/periodic-reports')}>关闭</Button><Button variant="secondary" onClick={() => submit(true)}>保存草稿</Button><Button onClick={() => submit(false)}>提交</Button></>}><Section title="当前报告信息"><div className="detail-grid"><b>当前报告名称<span>{existing?.name || '新建报告'}</span></b><b>报送机构<span>{existing?.institution || form.institution}</span></b><b>当前报告类型<span>{existing?.type || form.type}</span></b><b>当前报告日期<span>{existing?.reportDate || form.reportDate || '—'}</span></b></div></Section><Section title="报告基本信息"><div className="form-grid"><Field label="报告名称" required><Input value={form.name} onChange={v => set({ name: v })} /></Field><Field label="报送机构"><Select value={form.institution} onChange={v => set({ institution: v })} options={institutions} /></Field><Field label="报告类型" required><Select value={form.type} onChange={v => set({ type: v })} options={['全面风险管理报告', '风险监测报告']} /></Field><Field label="报告日期" required><Input type="date" value={form.reportDate} onChange={v => set({ reportDate: v })} /></Field><Field label="周期性" required><div className="checks">{(['周', '月度', '季度', '年度'] as const).map(x => <label key={x}><input type="radio" checked={form.cycle === x} onChange={() => set({ cycle: x })} />{x}</label>)}</div></Field><Field label="报告概述" span={2}><Textarea value={form.overview} onChange={v => set({ overview: v })} /></Field></div></Section><Section title="附件上传"><FileUploader files={files} onChange={setFiles} /></Section><Section title="推送设置"><div className="form-grid"><Field label="推送方式"><Select value={form.pushMethod} onChange={v => set({ pushMethod: v })} options={["邮件", "平台通知", "OA系统内"]} /></Field></div></Section></Page>; }
function SpecialRiskDrafts({ state, role, navigate, update, toast }: PageProps) { const [q, setQ] = useState({ type: '', institution: '' }); const [expanded, setExpanded] = useState<string[]>([]); const items = state.specialRisks.filter(x => (!q.type || x.types.includes(q.type)) && (!q.institution || x.institutions.includes(q.institution))); const del = (item: SpecialRisk) => { if (!window.confirm(`确认删除“${item.name}”吗？`)) return; update(s => { s.specialRisks = s.specialRisks.filter(x => x.id !== item.id); }); toast('草稿已删除'); }; return <Page title="新建专项风险提示" breadcrumb={['风险报告', '专项风险报告', '新建专项风险提示']} actions={<Button onClick={() => navigate('/special-risks/new')}>＋ 新建专项风险提示</Button>}><SearchPanel onSearch={() => undefined} onReset={() => setQ({ type: '', institution: '' })}><Field label="创建起止时间"><div className="date-range"><Input type="date" /><span>至</span><Input type="date" /></div></Field><Field label="专项风险类型"><Select value={q.type} onChange={v => setQ({ ...q, type: v })} options={specialTypes} /></Field><Field label="下发对象"><Select value={q.institution} onChange={v => setQ({ ...q, institution: v })} options={institutions} /></Field></SearchPanel><Table><thead><tr><th>展开</th><th>创建时间</th><th>上次更新时间</th><th>下发对象</th><th>专项风险类型</th><th>专项风险提示名称</th><th>状态</th><th>操作</th></tr></thead><tbody>{items.map(item => <React.Fragment key={item.id}><tr key={item.id}><td><TextAction onClick={() => setExpanded(v => v.includes(item.id) ? v.filter(x => x !== item.id) : [...v, item.id])}>{expanded.includes(item.id) ? '收起' : '展开'}</TextAction></td><td>{item.createdAt}</td><td>{item.updatedAt}</td><td>{item.institutions.join('、')}</td><td>{item.types.join('、')}</td><td>{item.name}</td><td><StatusTag value={item.status} /></td><td><TextAction onClick={() => navigate(`/special-risks/manage/${item.id}`)}>编辑</TextAction><TextAction onClick={() => del(item)}>删除</TextAction><TextAction onClick={() => downloadText(`${item.name}.txt`, item.purpose)}>下载</TextAction></td></tr>{expanded.includes(item.id) && <tr className="sub-row" key={`${item.id}-detail`}><td colSpan={8}>提示函接收记录：{item.workOrders.length ? item.workOrders.map(x => `${item.letterNo} · ${x.institution} · ${normalizeSpecialRiskDisplayStatus(x.status)}`).join('　') : '暂无已下发专项风险提示函'}</td></tr>}</React.Fragment>)}</tbody></Table><Pagination total={items.length} page={1} setPage={() => undefined} /></Page>; }

function SpecialRiskEditor({ state, role, navigate, update, toast }: PageProps) { const [form, setForm] = useState({ name: '', types: [] as string[], institutions: [] as string[], notes: {} as Record<string, string>, purpose: '', measures: '', requirements: '' }); const [files, setFiles] = useState<Attachment[]>([]); const toggle = (list: string[], item: string) => list.includes(item) ? list.filter(x => x !== item) : [...list, item]; const save = (publish: boolean) => { if (!form.name || !form.types.length || !form.institutions.length || !form.purpose || !form.measures || !form.requirements) return toast('请填写名称、专项风险类型、下发机构和三段提示内容'); update(s => { const item = specialRiskService.create(s, { ...form, attachments: files }, role); if (publish) specialRiskService.publish(item, role); }); toast(publish ? `专项风险提示函已下发至 ${form.institutions.length} 家机构` : '专项风险提示草稿已保存'); navigate('/special-risks/drafts'); }; return <Page title="专项风险提示 - 新建提示" breadcrumb={['风险报告', '专项风险报告', '新建专项风险提示', '新建提示']} actions={<><Button variant="secondary" onClick={() => navigate('/special-risks/drafts')}>关闭</Button><Button variant="secondary" onClick={() => save(false)}>保存草稿</Button><Button onClick={() => save(true)}>提交并下发</Button></>}><Section title="基本信息"><div className="form-grid"><Field label="专项风险提示名称" required><Input value={form.name} onChange={v => setForm({ ...form, name: v })} /></Field><Field label="专项风险提示类型" required><div className="checks">{specialTypes.map(x => <label key={x}><input type="checkbox" checked={form.types.includes(x)} onChange={() => setForm({ ...form, types: toggle(form.types, x) })} />{x}</label>)}</div></Field></div></Section><Section title="下发机构"><div className="institution-check-grid">{institutions.map(x => <div className={form.institutions.includes(x) ? 'selected' : ''} key={x}><label><input type="checkbox" checked={form.institutions.includes(x)} onChange={() => setForm({ ...form, institutions: toggle(form.institutions, x) })} />{x}</label>{form.institutions.includes(x) && <Input value={form.notes[x] || ''} onChange={v => setForm({ ...form, notes: { ...form.notes, [x]: v } })} placeholder="该机构补充信息" />}</div>)}</div></Section><Section title="提示内容"><div className="form-grid"><Field label="提示背景与目的" required><Textarea value={form.purpose} onChange={v => setForm({ ...form, purpose: v })} /></Field><Field label="专项风险提示措施与建议" required><Textarea value={form.measures} onChange={v => setForm({ ...form, measures: v })} /></Field><Field label="机构自检与反馈要求" required><Textarea value={form.requirements} onChange={v => setForm({ ...form, requirements: v })} /></Field></div></Section><Section title="附件上传"><FileUploader files={files} onChange={setFiles} /></Section></Page>; }

type SpecialRiskDisplayStatus = '已下发专项风险提示函' | '已答复专项风险提示函' | '已审阅答复函';
const normalizeSpecialRiskDisplayStatus = (status: SpecialRiskWorkOrder['status']): SpecialRiskDisplayStatus => status;
const getSpecialRiskNextStep = (status: SpecialRiskWorkOrder['status'] | '草稿') => status === '草稿' ? '等待国资公司下发' : normalizeSpecialRiskDisplayStatus(status) === '已下发专项风险提示函' ? '等待金融机构答复' : normalizeSpecialRiskDisplayStatus(status) === '已答复专项风险提示函' ? '等待国资公司审阅答复函' : '等待金融机构跟踪反馈';
const getSpecialRiskSummaryStatus = (item: SpecialRisk): SpecialRiskDisplayStatus | '草稿' => {
  if (!item.workOrders.length) return '草稿';
  if (item.workOrders.some(order => order.status === '已下发专项风险提示函')) return '已下发专项风险提示函';
  if (item.workOrders.some(order => order.status === '已答复专项风险提示函')) return '已答复专项风险提示函';
  return '已审阅答复函';
};
const specialRiskAction = (role: Role, item: SpecialRisk, order: SpecialRiskWorkOrder, navigate: (path: string) => void) => {
  if (order.status === '已下发专项风险提示函' && canHandleWorkflowNode(role, 'special-feedback', order.institution)) return <TextAction onClick={() => navigate(`/special-risks/feedback/${item.id}?order=${order.id}`)}>提交答复</TextAction>;
  if (order.status === '已答复专项风险提示函' && canHandleWorkflowNode(role, 'special-review', order.institution)) return <TextAction onClick={() => navigate(`/special-risks/feedback/${item.id}/evaluate?order=${order.id}`)}>审阅答复</TextAction>;
  if (order.status === '已审阅答复函' && canHandleWorkflowNode(role, 'special-track', order.institution)) return <TextAction onClick={() => navigate(`/special-risks/feedback/${item.id}?order=${order.id}`)}>跟踪反馈</TextAction>;
  return null;
};

function SpecialRiskManage({ state, role, navigate }: PageProps) {
  const [q, setQ] = useState({ type: '', status: '', institution: '' });
  const [expanded, setExpanded] = useState<string[]>([]);
  const items = state.specialRisks.filter(item => (!q.type || item.types.includes(q.type)) && (!q.institution || item.institutions.includes(q.institution)) && (!q.status || item.workOrders.some(order => order.status === q.status) || item.status === q.status));
  const rows = items.flatMap(item => [{ item, order: undefined }, ...(expanded.includes(item.id) ? item.workOrders.map(order => ({ item, order })) : [])]);
  return <Page title="专项风险提示与管理" breadcrumb={['风险报告', '专项风险报告']} actions={can(role, 'special-create') ? <Button onClick={() => navigate('/special-risks/drafts')}>＋ 新建专项风险提示</Button> : undefined}>
    <SearchPanel onSearch={() => undefined} onReset={() => setQ({ type: '', status: '', institution: '' })}><Field label="下发起止时间"><div className="date-range"><Input type="date" /><span>至</span><Input type="date" /></div></Field><Field label="专项风险类型"><Select value={q.type} onChange={type => setQ({ ...q, type })} options={specialTypes} /></Field><Field label="当前状态"><Select value={q.status} onChange={status => setQ({ ...q, status })} options={['已下发专项风险提示函', '已答复专项风险提示函', '已审阅答复函', '草稿']} /></Field><Field label="下发对象"><Select value={q.institution} onChange={institution => setQ({ ...q, institution })} options={institutions} /></Field></SearchPanel>
    <Table><thead><tr><th>展开</th><th>专项风险提示函号</th><th>下发日期</th><th>下发对象</th><th>专项风险类型</th><th>提示名称</th><th>当前状态</th><th>下一步</th><th>操作</th></tr></thead><tbody>{rows.map(({ item, order }) => {
      const status = order?.status || getSpecialRiskSummaryStatus(item);
      return order ? <tr className="sub-row" key={order.id}><td>↳</td><td>{item.letterNo}</td><td>{order.issuedAt}</td><td>{order.institution}</td><td>{item.types.join('、')}</td><td>{item.name}</td><td><StatusTag value={status} /></td><td>{getSpecialRiskNextStep(status)}</td><td><TextAction onClick={() => navigate(`/special-risks/manage/${item.id}?order=${order.id}`)}>查看提示</TextAction>{specialRiskAction(role, item, order, navigate)}</td></tr> : <tr key={item.id}><td><TextAction onClick={() => setExpanded(value => value.includes(item.id) ? value.filter(id => id !== item.id) : [...value, item.id])}>{expanded.includes(item.id) ? '收起' : '展开'}</TextAction></td><td>{item.letterNo || '—'}</td><td>{item.createdAt}</td><td>{item.institutions.join('、')}</td><td>{item.types.join('、')}</td><td>{item.name}</td><td><StatusTag value={status} /></td><td>{status === '草稿' ? '等待国资公司下发' : getSpecialRiskNextStep(status)}</td><td><TextAction onClick={() => navigate(`/special-risks/manage/${item.id}`)}>查看提示</TextAction></td></tr>;
    })}</tbody></Table><Pagination total={rows.length} page={1} setPage={() => undefined} />
  </Page>;
}

function SpecialRiskView({ state, role, navigate }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const item = state.specialRisks.find(risk => risk.id === id);
  const orderId = new URLSearchParams(window.location.search).get('order') || undefined;
  const order = item?.workOrders.find(record => record.id === orderId) || item?.workOrders[0];
  if (!item) return <Page title="专项风险提示函详情" breadcrumb={['风险报告', '专项风险报告']} actions={<Button variant="secondary" onClick={() => navigate('/special-risks/manage')}>返回</Button>}><div className="empty-state"><h2>无权查看该专项风险提示函</h2></div></Page>;
  const workflow = order?.workflow || { currentNodeId: 'special-feedback', records: [] };
  const status = order?.status || getSpecialRiskSummaryStatus(item);
  return <Page title="专项风险提示函详情" breadcrumb={['风险报告', '专项风险报告', item.name]} actions={<><Button variant="secondary" onClick={() => navigate('/special-risks/manage')}>返回</Button><Button variant="secondary" onClick={() => downloadText(item.name + '.txt', item.purpose + '\n' + item.measures + '\n' + item.requirements)}>附件下载</Button></>}>
    <Section title="提示基本信息"><div className="detail-grid"><b>专项风险提示函号<span>{item.letterNo || '—'}</span></b><b>专项风险提示名称<span>{item.name}</span></b><b>专项风险类型<span>{item.types.join('、')}</span></b><b>下发机构<span>国资公司</span></b><b>下发对象<span>{item.institutions.join('、')}</span></b><b>创建时间<span>{item.createdAt}</span></b><b>当前状态<span><StatusTag value={status} /></span></b><b>下一步<span>{status === '草稿' ? '等待国资公司下发' : getSpecialRiskNextStep(status)}</span></b></div><div className="read-block"><b>提示背景与目的</b><p>{item.purpose}</p><b>管理措施与建议</b><p>{item.measures}</p><b>自检与反馈要求</b><p>{item.requirements}</p></div></Section>
    {order && <><InteractiveWorkflow definition={specialRiskWorkflow} instance={workflow} selectedNodeId={workflow.currentNodeId} onSelect={() => undefined} /><Section title="办理记录"><div className="workflow-feedback-list">{workflow.records.map((record, index) => <article className="workflow-feedback-card" key={record.id}><div className="workflow-feedback-head"><div><span>阶段 {index + 1}</span><b>{record.nodeName}</b></div><StatusTag value={record.result} /></div><div className="workflow-feedback-meta"><span>办理角色：{record.role}</span><span>办理时间：{record.submittedAt}</span><span>办理结果：{record.result}</span></div></article>)}</div></Section>{canHandleWorkflowNode(role, workflow.currentNodeId, order.institution) && <Section title="下一步办理"><div className="form-actions">{specialRiskAction(role, item, order, navigate)}</div></Section>}</>}
    <Section title="全部接收机构"><Table><thead><tr><th>接收机构</th><th>专项风险提示函号</th><th>答复时间</th><th>联系人</th><th>当前状态</th><th>下一步</th><th>操作</th></tr></thead><tbody>{item.workOrders.map(record => <tr key={record.id}><td>{record.institution}</td><td>{item.letterNo}</td><td>{record.feedback?.date || '—'}</td><td>{record.feedback?.contact || '—'}</td><td><StatusTag value={record.status} /></td><td>{getSpecialRiskNextStep(record.status)}</td><td><TextAction onClick={() => navigate(`/special-risks/manage/${item.id}?order=${record.id}`)}>查看详情</TextAction>{specialRiskAction(role, item, record, navigate)}</td></tr>)}</tbody></Table></Section>
  </Page>;
}

function getOrder(item: SpecialRisk, orderId?: string): SpecialRiskWorkOrder { return item.workOrders.find(record => record.id === orderId) || item.workOrders[0] || { id: `${item.letterNo || 'ZXFX-NEW'}-01`, institution: item.institutions[0] || '并表金融机构', issuedAt: today(), status: '已下发专项风险提示函' }; }

function SpecialRiskFeedbackList(props: PageProps) { return <SpecialRiskManage {...props} />; }

function SpecialRiskFeedback({ state, role, navigate, update, toast }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const item = state.specialRisks.find(risk => risk.id === id) || state.specialRisks[0];
  const order = getOrder(item, new URLSearchParams(window.location.search).get('order') || undefined);
  const tracking = order.status === '已审阅答复函';
  const [form, setForm] = useState({ contact: order.feedback?.contact || '', phone: order.feedback?.phone || '', understanding: order.feedback?.understanding || '', problems: order.feedback?.problems || '', strategy: order.feedback?.strategy || '', other: order.feedback?.other || '' });
  const [files, setFiles] = useState<Attachment[]>(order.feedback?.attachments || []);
  const workflowStage = tracking ? 'special-track' : 'special-feedback';
  if (!canHandleWorkflowNode(role, workflowStage, order.institution)) return <Page title={tracking ? '专项风险跟踪反馈' : '专项风险答复函填写'} breadcrumb={['风险报告', '专项风险报告']} actions={<Button variant="secondary" onClick={() => navigate('/special-risks/manage')}>返回</Button>}><div className="empty-state"><h2>当前角色无权办理该阶段</h2></div></Page>;
  const save = () => {
    if (!form.contact || !form.understanding || !form.problems || !form.strategy) return toast('请填写联系人、认识理解、自查问题和风险应对策略');
    update(current => {
      const target = current.specialRisks.find(risk => risk.id === item.id)!;
      const targetOrder = target.workOrders.find(record => record.id === order.id);
      if (!targetOrder) return;
      targetOrder.feedback = { ...form, attachments: files, date: today() };
      targetOrder.workflow ||= { currentNodeId: workflowStage, records: [] };
      const stage = specialRiskWorkflow.find(candidate => candidate.id === workflowStage)!;
      workflowService.append(targetOrder.workflow, stage, { role, action: tracking ? '提交跟踪反馈' : '提交答复函', result: tracking ? '已提交跟踪反馈' : '已答复专项风险提示函', formData: { 联系人: form.contact, 联系电话: form.phone, 认识与理解: form.understanding, 自查问题与风险点: form.problems, 风险应对策略: form.strategy, 其他反馈: form.other }, attachments: files });
      if (!tracking) { workflowService.moveNext(targetOrder.workflow, specialRiskWorkflow, workflowStage); targetOrder.status = '已答复专项风险提示函'; }
      else targetOrder.status = '已审阅答复函';
      target.logs.push(createLog(tracking ? '提交跟踪反馈' : '提交答复函', `${targetOrder.institution} ${tracking ? '提交后续跟踪反馈' : '答复专项风险提示函'}`, role));
    });
    toast(tracking ? '跟踪反馈已提交' : '专项风险提示函答复已提交');
    navigate('/special-risks/manage');
  };
  return <Page title={tracking ? '专项风险跟踪反馈' : '专项风险答复函填写'} breadcrumb={['风险报告', '专项风险报告', tracking ? '跟踪反馈' : '答复函填写']} actions={<><Button variant="secondary" onClick={() => navigate('/special-risks/manage')}>关闭</Button><Button onClick={save}>{tracking ? '提交跟踪反馈' : '提交答复函'}</Button></>}><Section title="专项风险提示函基本信息"><div className="detail-grid"><b>专项风险提示函号<span>{item.letterNo}</span></b><b>提示名称<span>{item.name}</span></b><b>专项风险类型<span>{item.types.join('、')}</span></b><b>反馈机构<span>{order.institution}</span></b><b>当前状态<span><StatusTag value={order.status} /></span></b><b>下一步<span>{getSpecialRiskNextStep(order.status)}</span></b></div><div className="read-block"><b>提示背景与目的</b><p>{item.purpose}</p><b>管理措施与建议</b><p>{item.measures}</p><b>自检与反馈要求</b><p>{item.requirements}</p></div></Section><Section title={tracking ? '后续跟踪反馈' : '机构答复函'}><div className="form-grid"><Field label="反馈机构"><Input value={order.institution} disabled /></Field><Field label="联系人" required><Input value={form.contact} onChange={contact => setForm({ ...form, contact })} /></Field><Field label="联系电话"><Input value={form.phone} onChange={phone => setForm({ ...form, phone })} /></Field><Field label="认识与理解" required><Textarea value={form.understanding} onChange={understanding => setForm({ ...form, understanding })} /></Field><Field label="自查发现的问题与风险点" required><Textarea value={form.problems} onChange={problems => setForm({ ...form, problems })} /></Field><Field label="风险预防与应对策略" required><Textarea value={form.strategy} onChange={strategy => setForm({ ...form, strategy })} /></Field><Field label="其他总结反馈"><Textarea value={form.other} onChange={other => setForm({ ...form, other })} /></Field></div></Section><Section title="附件"><FileUploader files={files} onChange={setFiles} /></Section></Page>;
}

function SpecialRiskEvaluate({ state, role, navigate, update, toast }: PageProps) {
  const id = window.location.pathname.split('/')[3];
  const item = state.specialRisks.find(risk => risk.id === id) || state.specialRisks[0];
  const order = getOrder(item, new URLSearchParams(window.location.search).get('order') || undefined);
  const [summary, setSummary] = useState(order.evaluation?.summary || '');
  const [files, setFiles] = useState<Attachment[]>(order.evaluation?.attachments || []);
  if (!canHandleWorkflowNode(role, 'special-review', order.institution)) return <Page title="专项风险答复函审阅" breadcrumb={['风险报告', '专项风险报告']} actions={<Button variant="secondary" onClick={() => navigate('/special-risks/manage')}>返回</Button>}><div className="empty-state"><h2>当前角色无权办理该阶段</h2></div></Page>;
  const save = (draft: boolean) => {
    if (!draft && !summary.trim()) return toast('请填写答复函审阅意见');
    update(current => {
      const target = current.specialRisks.find(risk => risk.id === item.id)!;
      const targetOrder = target.workOrders.find(record => record.id === order.id);
      if (!targetOrder) return;
      targetOrder.evaluation = { result: draft ? '审阅中' : '已审阅', department: '金融机构管理部', summary, date: today(), attachments: files };
      targetOrder.workflow ||= { currentNodeId: 'special-review', records: [] };
      if (!draft) {
        const stage = specialRiskWorkflow.find(candidate => candidate.id === 'special-review')!;
        workflowService.append(targetOrder.workflow, stage, { role, action: '完成答复函审阅', result: '已审阅答复函', formData: { 审阅意见: summary }, opinion: summary, attachments: files });
        workflowService.moveNext(targetOrder.workflow, specialRiskWorkflow, 'special-review');
        targetOrder.status = '已审阅答复函';
      }
      target.logs.push(createLog(draft ? '保存审阅草稿' : '完成答复函审阅', `${targetOrder.institution}答复函${draft ? '审阅草稿已保存' : '已完成审阅'}`, role));
    });
    toast(draft ? '审阅草稿已保存' : '答复函审阅已完成');
    if (!draft) navigate('/special-risks/manage');
  };
  return <Page title="专项风险答复函审阅" breadcrumb={['风险报告', '专项风险报告', '答复函审阅']} actions={<><Button variant="secondary" onClick={() => navigate('/special-risks/manage')}>关闭</Button><Button variant="secondary" onClick={() => save(true)}>保存草稿</Button><Button onClick={() => save(false)}>完成审阅</Button></>}><Section title="提示基本信息"><div className="detail-grid"><b>专项风险提示函号<span>{item.letterNo}</span></b><b>提示名称<span>{item.name}</span></b><b>专项风险类型<span>{item.types.join('、')}</span></b><b>反馈机构<span>{order.institution}</span></b><b>当前状态<span><StatusTag value={order.status} /></span></b><b>下一步<span>{getSpecialRiskNextStep(order.status)}</span></b></div></Section><Section title="机构答复信息"><div className="read-block"><b>联系人及电话</b><p>{order.feedback?.contact || '—'} {order.feedback?.phone || ''}</p><b>认识与理解</b><p>{order.feedback?.understanding || '—'}</p><b>自查问题与风险点</b><p>{order.feedback?.problems || '—'}</p><b>风险预防与应对策略</b><p>{order.feedback?.strategy || '—'}</p><b>其他总结反馈</b><p>{order.feedback?.other || '—'}</p></div></Section><Section title="答复函审阅"><Field label="审阅意见" required><Textarea value={summary} onChange={setSummary} /></Field></Section><Section title="审阅附件"><FileUploader files={files} onChange={setFiles} /></Section></Page>;
}
