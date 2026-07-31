export type Role =
  | '集团管理层'
  | '集团金融机构管理部门经办岗'
  | '集团金融机构管理部门审核岗'
  | '金控公司经办岗'
  | '金控公司审核岗'
  | '并表金融机构经办岗'
  | '并表金融机构审核岗';

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
  status: '未生效' | '待审核' | '生效' | '暂停预警' | '停用';
  nodes: { id: string; threshold: string; light: string }[];
  segments: { name: string; range: string; light: string }[];
  pushMethods: string[];
  submitter: string;
  logs: LogEntry[];
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
  status: '生效' | '停用';
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
};

export type DemoState = {
  riskPreferences: RiskPreference[];
  warningRules: WarningRule[];
  warningDisposals: WarningDisposal[];
  indicators: Indicator[];
  majorEvents: MajorEvent[];
  reports: Report[];
  periodicReports: PeriodicReport[];
  specialRisks: SpecialRisk[];
};
