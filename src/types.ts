export type Role =
  | '集团'
  | '金控公司'
  | '各金融机构';

export type Status = string;

export type LogEntry = {
  id: string;
  action: string;
  operator: string;
  time: string;
  content: string;
};

export type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
};

export type WorkflowNodeRecord = {
  id: string;
  nodeId: string;
  nodeName: string;
  department: string;
  role: Role;
  handler: string;
  action: string;
  result: string;
  submittedAt: string;
  formData: Record<string, string>;
  opinion?: string;
  returnReason?: string;
  attachments: Attachment[];
  status: '已完成' | '已退回' | '已关闭' | '已跳过';
  iteration: number;
};

export type WorkflowInstance = {
  currentNodeId: string;
  records: WorkflowNodeRecord[];
};

export type InstitutionIndicator = {
  name: string;
  unit: string;
  current: string;
  lastYear: string;
  yearOnYear: string;
  previous: string;
  monthOnMonth: string;
  light: '红灯' | '黄灯' | '绿灯';
};

export type InstitutionRelatedParty = {
  name: string;
  relation: string;
  shareholding: string;
  onBalanceExposure: string;
  offBalanceExposure: string;
  netAssetRatio: string;
};

export type Institution = {
  id: string;
  name: string;
  shortName: string;
  type: string;
  establishedAt: string;
  registeredCapital: string;
  creditCode: string;
  ownership: string;
  businessScope: string;
  management: string;
  branches: string;
  address: string;
  website: string;
  emergencyContact: string;
  phone: string;
  includedAt: string;
  status: '已纳入' | '暂缓纳入';
  activeIndicatorCount: number;
  warningCount: number;
  overview: string;
  indicators: InstitutionIndicator[];
  rating: { regulatory: string; external: string; history: string[]; marketRank: string; concerns: string };
  concentrations: { category: string; value: string; description: string }[];
  relatedParties: InstitutionRelatedParty[];
};

export type RiskPreferenceIndicator = {
  id: string;
  category: string;
  name: string;
  definition: string;
  unit: string;
  institution: string;
  frequency: string;
  warning: string;
  tolerance: string;
  effectiveDate: string;
};

export type RiskPreference = {
  id: string;
  code: string;
  name: string;
  institution: string;
  effectiveDate: string;
  expiryDate: string;
  status: '待提交' | '待审核' | '已生效' | '已失效';
  department: string;
  summary: string;
  statement: string;
  basis: string;
  indicators: RiskPreferenceIndicator[];
  attachments: Attachment[];
  logs: LogEntry[];
  workflow?: WorkflowInstance;
};

export type WarningRule = {
  id: string;
  code: string;
  indicator: string;
  riskType: string;
  institution: string;
  frequency: string;
  ruleType: string;
  yellow: string;
  red: string;
  effectiveDate: string;
  status: '草稿' | '未生效' | '待审核' | '状态变更待审核' | '规则配置变更待审核' | '提示函方式变更待审核' | '被退回' | '生效' | '暂停预警' | '停用' | '作废';
  letterDeliveryMode?: 'auto' | 'none' | 'manual';
  nodes: { id: string; threshold: string; light: string }[];
  segments: { name: string; range: string; light: string }[];
  pushMethods: string[];
  submitter: string;
  logs: LogEntry[];
  versions?: { version: string; effectiveDate: string; yellow: string; red: string; nodes: { id: string; threshold: string; light: string }[]; segments: { name: string; range: string; light: string }[]; pushMethods: string[]; letterDeliveryMode?: 'auto' | 'none' | 'manual'; reason: string; status: string }[];
  operationRecords?: { id: string; action: string; beforeStatus: string; afterStatus: string; operator: string; role: Role; time: string; reason: string; opinion: string; attachments: Attachment[]; version: string }[];
  pendingConfig?: { version: string; indicator: string; riskType: string; institution: string; frequency: string; ruleType: string; yellow: string; red: string; effectiveDate: string; nodes: { id: string; threshold: string; light: string }[]; segments: { name: string; range: string; light: string }[]; pushMethods: string[]; letterDeliveryMode: 'auto' | 'none' | 'manual'; submitter: string; reason: string; submittedAt: string };
  pendingLetterDelivery?: { id: string; currentMode: 'auto' | 'none' | 'manual'; requestedMode: 'auto' | 'none' | 'manual'; reason: string; effectiveDate: string; applicant: string; appliedAt: string; previousStatus: WarningRule['status']; reviewStatus: '待审核' | '通过' | '驳回'; reviewOpinion?: string };
  letterDeliveryChanges?: { id: string; currentMode: 'auto' | 'none' | 'manual'; requestedMode: 'auto' | 'none' | 'manual'; reason: string; effectiveDate: string; applicant: string; appliedAt: string; reviewStatus: '待审核' | '通过' | '驳回'; reviewer?: string; reviewedAt?: string; reviewOpinion?: string }[];
};

export type WarningDisposal = {
  id: string;
  level: '黄灯' | '红灯';
  institution: string;
  riskType: string;
  indicator: string;
  value: string;
  signal: string;
  rule: string;
  letterNo: string;
  status: string;
  triggerDate: string;
  reason: string;
  plan: string;
  assessment: string;
  review: string;
  followUp: string;
  releaseAssessment: string;
  expectedReleaseDate: string;
  attachments: Attachment[];
  logs: LogEntry[];
  associatedRuleId?: string;
  ruleVersion?: string;
  letterDeliveryMode?: 'auto' | 'none' | 'manual';
  letterStatus?: '已下发' | '不发函' | '待下发';
  letterSentBy?: string;
  letterSentAt?: string;
  workflow?: WorkflowInstance;
};

export type WarningLetterSetting = {
  mode: '亮灯直接发函' | '只亮灯不发函' | '亮灯后手动发函';
  level: '黄灯' | '红灯' | '黄灯及红灯';
  institutionScope: '全部机构' | '指定机构';
  institutions: string[];
  effectiveDate: string;
  description: string;
  logs: LogEntry[];
};

export type IndicatorVersion = {
  version: string;
  operation: string;
  name: string;
  definition: string;
  effectiveDate: string;
  institution: string;
  type: string;
  subtype: string;
  frequency: string;
  sourceTable: string;
  stopDate: string;
};

export type Indicator = {
  id: string;
  code: string;
  name: string;
  status: '草稿' | '未生效' | '生效' | '停用' | '作废';
  definition: string;
  type: string;
  subtype: string;
  institution: string;
  managementType: string;
  effectiveDate: string;
  frequency: string;
  sourceTables: string[];
  versions: IndicatorVersion[];
  logs: LogEntry[];
};

export type IndicatorPeriodRecord = {
  id: string;
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  indicatorDefinition: string;
  indicatorType: string;
  indicatorSubType: string;
  institution: string;
  monitoringFrequency: '日' | '周' | '月' | '季' | '半年' | '年' | '不定期';
  indicatorValue: string;
  indicatorUnit: string;
  currentLightStatus: '红灯' | '黄灯' | '绿灯';
  cumulativeRedCount: number;
  cumulativeYellowCount: number;
  cumulativeGreenCount: number;
  forecastRange: string;
  yellowRule: string;
  redRule: string;
  period: string;
  periodOrder: number;
  indicatorStatus?: '生效' | '未生效' | '停用' | '作废';
  warningStatus?: '绿灯' | '黄灯' | '红灯' | '未评价';
  reasonableRange?: string;
};

export type MajorRiskEventDefinition = {
  id: string;
  code: string;
  name: string;
  criteria: string[];
  referenceBasis: string;
  status: '生效' | '停用' | '草稿';
  version: string;
  updatedAt: string;
  notes: string;
  logs: LogEntry[];
};

export type MajorEvent = {
  id: string;
  code: string;
  name: string;
  institution: string;
  type: string;
  occurredAt: string;
  latestReport: '首报' | '续报' | '终报';
  currentStage: string;
  status: '草稿' | '待审核' | '处理中' | '常态跟踪' | '已归档';
  impact: string;
  contact: string;
  phone: string;
  basic: string;
  analysis: string;
  measures: string;
  trend: string;
  target: string;
  plan: string;
  responsibleDept: string;
  responsible: string;
  deadline: string;
  attachments: Attachment[];
  followUps: { latestProgress: string; riskChange: string; execution: string; nextStep: string; attachments: Attachment[]; date: string }[];
  finalReport?: { result: string; impact: string; release: string; followUp: string; attachments: Attachment[]; date: string };
  logs: LogEntry[];
  workflow?: WorkflowInstance;
};

export type ReportSubmission = {
  id: string;
  serial: string;
  reportDate: string;
  submitDate: string;
  submitTime: string;
  submitter: string;
  note: string;
  files: Attachment[];
};

export type Report = {
  id: string;
  code: string;
  name: string;
  institution: string;
  type: string;
  frequency: string;
  latestReportDate: string;
  latestSubmitDate: string;
  status: string;
  description: string;
  submissions: ReportSubmission[];
  logs: LogEntry[];
};

export type PeriodicReport = {
  id: string;
  name: string;
  institution: string;
  type: string;
  reportDate: string;
  submitDate: string;
  cycle: '周' | '月度' | '季度' | '年度';
  overview: string;
  attachments: Attachment[];
  visibleInstitutions: string[];
  visibleDepartments: string[];
  viewers: string[];
  pushMethod: string;
  status: '草稿' | '已提交';
  logs: LogEntry[];
};

export type SpecialRisk = {
  id: string;
  name: string;
  types: string[];
  institutions: string[];
  institutionNotes: Record<string, string>;
  purpose: string;
  measures: string;
  requirements: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  status: '草稿' | '已下发';
  workOrders: SpecialRiskWorkOrder[];
  logs: LogEntry[];
};

export type SpecialRiskWorkOrder = {
  id: string;
  institution: string;
  issuedAt: string;
  status: '待反馈' | '已反馈' | '评估中' | '部分解除' | '已解除' | '待跟踪反馈';
  feedback?: { contact: string; phone: string; understanding: string; problems: string; strategy: string; other: string; attachments: Attachment[]; date: string };
  evaluation?: { result: string; department: string; summary: string; date: string; attachments: Attachment[] };
  workflow?: WorkflowInstance;
};

export type DemoState = {
  institutions: Institution[];
  riskPreferences: RiskPreference[];
  warningRules: WarningRule[];
  warningDisposals: WarningDisposal[];
  indicators: Indicator[];
  indicatorPeriodRecords: IndicatorPeriodRecord[];
  warningLetterSetting: WarningLetterSetting;
  dashboardIndicatorConfig: Record<Role, string[]>;
  majorEvents: MajorEvent[];
  majorRiskEventDefinitions: MajorRiskEventDefinition[];
  reports: Report[];
  periodicReports: PeriodicReport[];
  specialRisks: SpecialRisk[];
};
