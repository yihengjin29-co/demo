import type { DemoState, Indicator, MajorEvent, Role, WarningRule, WorkflowNodeRecord } from '../types';

export const roleLabels: Role[] = ['集团', '金控公司', '各金融机构'];
export const currentInstitution = '国际AMC';

const legacyRoleMap: Record<string, Role> = {
  集团: '集团',
  集团管理层: '集团',
  金融机构管理部门: '集团',
  集团金融机构管理部门经办岗: '集团',
  集团金融机构管理部门审核岗: '集团',
  金控公司经办岗: '金控公司',
  金控公司审核岗: '金控公司',
  并表金融机构经办岗: '各金融机构',
  并表金融机构审核岗: '各金融机构',
  金控公司: '金控公司',
  各金融机构: '各金融机构',
};

export const resolveStoredRole = (value: string | null | undefined): Role | null => legacyRoleMap[value || ''] || null;

export const normalizeRole = (value: string | null | undefined): Role => resolveStoredRole(value) || '金控公司';

export const getDefaultRouteForRole = (role: Role) => role === '集团' ? '/dashboard' : '/workbench';

export type PermissionContext = {
  institution?: string;
  status?: string;
  currentStage?: string;
};

const institutionMatches = (dataInstitution: string, institution: string) => dataInstitution
  .split(/[、,，/]/)
  .map(value => value.trim())
  .includes(institution);

export const canViewInstitution = (role: Role, dataInstitution: string, institution = currentInstitution) => role !== '各金融机构' || institutionMatches(dataInstitution, institution);

export const scopeStateForRole = (state: DemoState, role: Role): DemoState => {
  if (role !== '各金融机构') return state;
  const visible = (institution: string) => canViewInstitution(role, institution);
  return {
    ...state,
    institutions: state.institutions.filter(item => visible(item.name)),
    riskPreferences: state.riskPreferences.filter(item => visible(item.institution)),
    warningRules: state.warningRules.filter(item => visible(item.institution)),
    warningDisposals: state.warningDisposals.filter(item => visible(item.institution)),
    indicators: state.indicators.filter(item => visible(item.institution)),
    indicatorPeriodRecords: state.indicatorPeriodRecords.filter(item => visible(item.institution)),
    majorEvents: state.majorEvents.filter(item => visible(item.institution)),
    reports: state.reports.filter(item => visible(item.institution)),
    periodicReports: state.periodicReports.filter(item => visible(item.institution)),
    specialRisks: state.specialRisks.filter(item => item.institutions.some(institution => visible(institution))).map(item => ({
      ...item,
      institutions: item.institutions.filter(institution => visible(institution)),
      institutionNotes: Object.fromEntries(Object.entries(item.institutionNotes).filter(([institution]) => visible(institution))),
      workOrders: item.workOrders.filter(order => visible(order.institution)),
    })),
  };
};

export const can = (role: Role, action: string, context: PermissionContext = {}) => {
  const inScope = !context.institution || canViewInstitution(role, context.institution);
  if (['view', 'query', 'export', 'download', 'history'].includes(action)) return inScope;
  if (['preference-edit', 'preference-create', 'rule-config', 'indicator-maintain', 'special-create', 'state-edit'].includes(action)) return role === '金控公司';
  if (action === 'rule-approve') return role === '金控公司';
  if (['approve', 'return', 'remind', 'assign', 'coordinate', 'track', 'close'].includes(action)) return role === '集团' || role === '金控公司';
  if (action === 'review') return role === '集团';
  if (['institution-submit', 'feedback', 'report-upload', 'event-create', 'event-progress'].includes(action)) return role === '各金融机构' && inScope;
  if (action === 'delete') return context.status === '草稿' && ((role === '各金融机构' && inScope) || role === '金控公司');
  return false;
};

export const canEditWarningRuleStatus = (role: Role) => role === '金控公司';
export const canApproveWarningRule = (role: Role, rule: WarningRule) => role === '金控公司' && ['待审核', '状态变更待审核', '规则配置变更待审核', '提示函方式变更待审核'].includes(rule.status);
export const canViewWarningRuleConfig = (role: Role, rule: WarningRule) => canViewInstitution(role, rule.institution);
export const canEditWarningRuleConfig = (role: Role) => role === '金控公司';
export const canConfigureWarningLetters = (role: Role) => role === '金控公司';

export const canViewLatestIndicatorStatus = (role: Role) => ['集团', '金控公司', '各金融机构'].includes(role);
export const canViewHistoricalIndicatorData = (role: Role) => ['集团', '金控公司', '各金融机构'].includes(role);
export const canMaintainWarningRule = (role: Role) => role === '金控公司';
export const canMaintainWarningRuleStatus = canMaintainWarningRule;
export const canMaintainLetterDeliveryMode = canMaintainWarningRule;
export const canApproveWarningRuleChange = canApproveWarningRule;
export const canManuallySendWarningLetter = (role: Role) => role === '金控公司';
export const canViewMajorRiskDefinition = (_role: Role) => true;
export const canEditMajorRiskDefinition = (role: Role) => role === '金控公司';
export const canConfigureDashboard = (_role: Role) => true;
export const canViewInstitutionData = canViewInstitution;
export const canAccessDashboardLink = (role: Role, path: string) => {
  if (path === '/warning/risk-preference') return canAccessRiskPreference(role);
  if (path === '/indicators/latest-status') return canViewLatestIndicatorStatus(role);
  if (path === '/reports' || path.startsWith('/reports/indicator/')) return canViewHistoricalIndicatorData(role);
  return true;
};

export const canAccessRiskPreference = (role: Role) => role === '集团' || role === '金控公司';
export const canViewIndicator = (role: Role, indicator: Pick<Indicator, 'institution'>) => canViewInstitution(role, indicator.institution);
export const canCreateIndicator = (role: Role) => role === '金控公司';
export const canEditIndicator = (role: Role, indicator?: Pick<Indicator, 'institution'>) => role === '金控公司' && (!indicator || canViewIndicator(role, indicator));
export const canManageIndicatorStatus = (role: Role) => role === '金控公司';
export const canViewIndicatorVersion = (role: Role, indicator: Pick<Indicator, 'institution'>) => canViewIndicator(role, indicator);
export const canManageMajorEventDefinitions = (role: Role) => role === '金控公司';

export const canViewWorkflowNode = (role: Role, institution: string) => canViewInstitution(role, institution);
export const canViewWorkflowRecord = (role: Role, institution: string, _record?: WorkflowNodeRecord) => canViewInstitution(role, institution);

export const canHandleWorkflowNode = (role: Role, nodeId: string, institution: string) => {
  if (!canViewInstitution(role, institution)) return false;
  const institutionNodes = ['reason-fill', 'plan-fill', 'execution', 'event-create', 'first-report', 'event-execution', 'final-archive', 'special-feedback', 'special-track'];
  const sharedReviewNodes = ['reason-review', 'plan-review', 'tracking-release'];
  const companyNodes = ['rule-status', 'rule-config'];
  const managementNodes = ['management-coordination', 'verify-report', 'special-evaluate', 'special-release'];
  const executiveNodes = ['management-review', 'board-review', 'rp-review'];
  if (institutionNodes.includes(nodeId)) return role === '各金融机构';
  if (sharedReviewNodes.includes(nodeId)) return role === '集团' || role === '金控公司';
  if (companyNodes.includes(nodeId)) return role === '金控公司';
  if (managementNodes.includes(nodeId)) return role === '集团';
  if (executiveNodes.includes(nodeId)) return role === '集团';
  return false;
};

export const canReturnWorkflowNode = (role: Role, nodeId: string, institution: string) => canHandleWorkflowNode(role, nodeId, institution) && ['reason-review', 'plan-review', 'verify-report', 'special-evaluate', 'management-review'].includes(nodeId);

export const getAvailableWorkflowActions = (role: Role, nodeId: string, institution: string) => {
  if (!canHandleWorkflowNode(role, nodeId, institution)) return [];
  return canReturnWorkflowNode(role, nodeId, institution) ? ['通过', '退回'] : ['保存', '提交'];
};

export type MajorEventAction =
  | 'view'
  | 'edit'
  | 'delete'
  | 'submit-first'
  | 'follow-up'
  | 'final-report'
  | 'verify'
  | 'approve'
  | 'return'
  | 'remind'
  | 'track'
  | 'review'
  | 'close'
  | 'history';

export const majorEventActionLabels: Record<MajorEventAction, string> = {
  view: '查看详情',
  edit: '编辑',
  delete: '删除',
  'submit-first': '提交首报',
  'follow-up': '更新进展 / 续报',
  'final-report': '提交终报',
  verify: '核实',
  approve: '审核',
  return: '退回',
  remind: '催办',
  track: '跟踪',
  review: '审阅',
  close: '关闭归档',
  history: '查看流程',
};

export const canEditMajorEvent = (role: Role, event: MajorEvent) => role === '各金融机构' && event.status === '草稿' && canViewInstitution(role, event.institution);

export const getMajorEventActions = (role: Role, event: MajorEvent): MajorEventAction[] => {
  if (!canViewInstitution(role, event.institution)) return [];
  const actions: MajorEventAction[] = ['view', 'history'];
  if (event.status === '已归档') return actions;

  if (role === '各金融机构') {
    if (event.status === '草稿') actions.splice(1, 0, 'edit', 'delete', 'submit-first');
    if (event.status === '处理中') actions.splice(1, 0, 'follow-up', 'final-report');
    if (event.status === '常态跟踪') actions.splice(1, 0, 'follow-up');
    return actions;
  }

  if (role === '集团') {
    if (/管理层审阅|董事会审阅/.test(event.currentStage)) actions.splice(1, 0, 'review');
    if (event.status === '待审核') actions.splice(1, 0, 'verify', 'approve', 'return', 'remind');
    if (event.status === '处理中') actions.splice(1, 0, 'remind', 'track');
    if (event.status === '常态跟踪') actions.splice(1, 0, 'track', 'close');
    return actions;
  }

  if (event.status === '待审核') actions.splice(1, 0, 'verify', 'approve', 'return', 'remind');
  if (event.status === '处理中') actions.splice(1, 0, 'remind', 'track');
  if (event.status === '常态跟踪') actions.splice(1, 0, 'track', 'close');
  return actions;
};
