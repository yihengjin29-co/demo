import type { DemoState, MajorEvent, Role } from '../types';

export const roleLabels: Role[] = ['集团管理层', '金融机构管理部门', '金控公司', '各金融机构'];
export const currentInstitution = '国际AMC';

const legacyRoleMap: Record<string, Role> = {
  集团管理层: '集团管理层',
  集团金融机构管理部门经办岗: '金融机构管理部门',
  集团金融机构管理部门审核岗: '金融机构管理部门',
  金控公司经办岗: '金控公司',
  金控公司审核岗: '金控公司',
  并表金融机构经办岗: '各金融机构',
  并表金融机构审核岗: '各金融机构',
  金融机构管理部门: '金融机构管理部门',
  金控公司: '金控公司',
  各金融机构: '各金融机构',
};

export const normalizeRole = (value: string | null | undefined): Role => legacyRoleMap[value || ''] || '金控公司';

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
    riskPreferences: state.riskPreferences.filter(item => visible(item.institution)),
    warningRules: state.warningRules.filter(item => visible(item.institution)),
    warningDisposals: state.warningDisposals.filter(item => visible(item.institution)),
    indicators: state.indicators.filter(item => visible(item.institution)),
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
  if (['rule-approve', 'approve', 'return', 'remind', 'assign', 'coordinate', 'track', 'close'].includes(action)) return role === '金融机构管理部门' || role === '金控公司';
  if (action === 'review') return role === '集团管理层';
  if (['institution-submit', 'feedback', 'report-upload', 'event-create', 'event-progress'].includes(action)) return role === '各金融机构' && inScope;
  if (action === 'delete') return context.status === '草稿' && ((role === '各金融机构' && inScope) || role === '金控公司');
  return false;
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

  if (role === '集团管理层') {
    if (/管理层审阅|董事会审阅/.test(event.currentStage)) actions.splice(1, 0, 'review');
    return actions;
  }

  if (event.status === '待审核') actions.splice(1, 0, 'verify', 'approve', 'return', 'remind');
  if (event.status === '处理中') actions.splice(1, 0, 'remind', 'track');
  if (event.status === '常态跟踪') actions.splice(1, 0, 'track', 'close');
  return actions;
};
