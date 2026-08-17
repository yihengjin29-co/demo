import type { DemoState, LogEntry, Attachment, Role, WorkflowActor, WorkflowNodeRecord, IndicatorPeriodRecord, WarningLetterSetting } from '../types';
import { seedInstitutions } from './institutionData';
import { normalizeMajorRiskEventType, seedMajorRiskEventDefinitions } from './majorEventDefinitionService';
import { calculateCumulativeLightCounts, evaluateIndicatorLightStatus, formatIndicatorValue, indicatorPeriodService, inferIndicatorUnit, normalizeIndicatorRules, normalizeMonitoringFrequency, validateIndicatorPeriodRecords } from './indicatorPeriodService';
import { normalizeWarningItemState } from './warningConsistencyService';

const KEY = 'group-consolidation-demo-state-v1';
const now = () => new Date().toLocaleString('zh-CN', { hour12: false });
export const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const createLog = (action: string, content: string, operator = '张三'): LogEntry => ({ id: uid('log'), action, content, operator, time: now() });
export const makeAttachment = (file: File): Attachment => ({ id: uid('file'), name: file.name, size: file.size, type: file.type || 'application/octet-stream', uploadedAt: now() });
export const formatSize = (size: number) => size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;

const baseIndicators = [
  { id: 'rpi-1', category: '资本充足类', name: '资本充足率', definition: '集团并表口径资本充足率', unit: '%', institution: '全集团', frequency: '月度', warning: '≥10.50%', tolerance: '≥8.00%', effectiveDate: '2024-01-01' },
  { id: 'rpi-2', category: '流动性风险类', name: '流动性覆盖率', definition: '高质量流动性资产覆盖净现金流出', unit: '%', institution: '国际AMC', frequency: '日度', warning: '≥100.00%', tolerance: '≥90.00%', effectiveDate: '2024-01-01' },
  { id: 'rpi-3', category: '信用风险类', name: '不良资产率', definition: '不良资产余额占资产总额比例', unit: '%', institution: '浦发银行', frequency: '月度', warning: '≤2.00%', tolerance: '≤5.00%', effectiveDate: '2024-01-01' },
] as const;

export const seedState = (): DemoState => ({
  institutions: seedInstitutions(),
  riskPreferences: [
    { id: 'rp-1', code: 'RP-2024-001', name: '2024年度集团并表风险偏好方案', institution: '集团及并表金融机构', effectiveDate: '2024-01-01', expiryDate: '2024-12-31', status: '已生效', department: '金融机构管理部', summary: '围绕资本、流动性和资产质量建立年度风险边界。', statement: '集团坚持审慎稳健的风险偏好，强化资本约束、流动性安全和资产质量管理，保持风险与收益相匹配。', basis: '监管要求、集团管理要求、历史执行情况', indicators: baseIndicators.map(x => ({ ...x })), attachments: [], logs: [createLog('发布生效', '方案经管理层审阅后发布生效')].slice(0, 1) },
    { id: 'rp-2', code: 'RP-2025-001', name: '2025年度风险偏好目标（草案）', institution: '集团及并表金融机构', effectiveDate: '2025-01-01', expiryDate: '2025-12-31', status: '待审核', department: '金融机构管理部', summary: '基于新年度战略目标的风险边界草案。', statement: '在风险可控前提下支持战略发展，优化风险收益结构。', basis: '年度经营计划及监管最新要求', indicators: baseIndicators.map(x => ({ ...x, id: `${x.id}-2025` })), attachments: [], logs: [createLog('提交审核', '经办岗提交方案审核')].slice(0, 1) },
    { id: 'rp-3', code: 'RP-2023-001', name: '2023年度风险偏好方案', institution: '全集团', effectiveDate: '2023-01-01', expiryDate: '2023-12-31', status: '已失效', department: '金融机构管理部', summary: '历史年度风险偏好方案。', statement: '坚持稳健经营。', basis: '年度规划', indicators: baseIndicators.map(x => ({ ...x, id: `${x.id}-2023` })), attachments: [], logs: [createLog('失效', '方案超过生效期间')].slice(0, 1) },
  ],
  warningRules: [
    { id: 'wr-1', code: 'RW-2024-001', indicator: '不良资产率', riskType: '信用风险', institution: '全集团', frequency: '月度', ruleType: '阈值预警', yellow: '≥2.00%', red: '≥5.00%', effectiveDate: '2024-01-01', status: '生效', nodes: [{ id: 'n1', threshold: '2.00', light: '黄灯' }, { id: 'n2', threshold: '5.00', light: '红灯' }], segments: [{ name: '区间1', range: '< 2.00%', light: '不亮灯' }, { name: '区间2', range: '2.00% - 5.00%', light: '黄灯' }, { name: '区间3', range: '≥ 5.00%', light: '红灯' }], pushMethods: ['平台通知'], submitter: '李四', logs: [createLog('生效', '规则已生效并向适用机构传导')] },
    { id: 'wr-2', code: 'RW-2024-002', indicator: '流动性覆盖率', riskType: '流动性风险', institution: '全集团', frequency: '日度', ruleType: '阈值预警', yellow: '≥100.00%', red: '<100.00%', effectiveDate: '2024-01-01', status: '生效', nodes: [{ id: 'n1', threshold: '100.00', light: '黄灯' }, { id: 'n2', threshold: '90.00', light: '红灯' }], segments: [{ name: '区间1', range: '≥ 100.00%', light: '绿灯（不预警）' }, { name: '区间2', range: '90.00% - 100.00%', light: '黄灯' }, { name: '区间3', range: '< 90.00%', light: '红灯' }], pushMethods: ['OA系统内', '平台通知'], submitter: '李四', logs: [createLog('配置更新', '按阈值节点完成区间与灯号配置')] },
    { id: 'wr-3', code: 'RW-2024-003', indicator: '净稳定资金率', riskType: '流动性风险', institution: '全集团', frequency: '月度', ruleType: '阈值预警', yellow: '≥100.00%', red: '<90.00%', effectiveDate: '2024-01-01', status: '暂停预警', nodes: [{ id: 'n1', threshold: '100.00', light: '黄灯' }], segments: [{ name: '区间1', range: '< 100.00%', light: '黄灯' }], pushMethods: ['邮件'], submitter: '李四', logs: [createLog('暂停预警', '完成系统维护窗口暂停')] },
  ],
  warningDisposals: [
    { id: 'wd-1', level: '红灯', institution: '国际AMC', riskType: '信用风险', indicator: '不良资产率', value: '5.60%', signal: '红灯', rule: '不良资产率≥5.00%', letterNo: 'YJTX2024-007', status: '待提交应对处置方案', triggerDate: '2024-06-25 09:30:00', reason: '', plan: '', assessment: '', review: '', followUp: '', releaseAssessment: '', expectedReleaseDate: '', attachments: [], logs: [createLog('系统推送', '自动生成重大风险提示函')] },
    { id: 'wd-2', level: '黄灯', institution: '浦发银行', riskType: '流动性风险', indicator: '流动性覆盖率', value: '96.40%', signal: '黄灯', rule: '90.00%≤指标值<100.00%', letterNo: 'YJTX2024-006', status: '持续跟踪执行情况', triggerDate: '2024-06-24 10:15:00', reason: '市场资金面阶段性波动，已启动流动性储备。', plan: '调整资产负债结构，提升高质量流动性资产占比。', assessment: '措施可行，持续跟踪。', review: '', followUp: '已完成第一轮储备补充，后续按周报送。', releaseAssessment: '', expectedReleaseDate: '2024-07-15', attachments: [], logs: [createLog('提交方案', '金融机构提交应对处置方案')] },
  ],
  indicators: [
    { id: 'ind-1', code: 'IND-2024-001', name: '资本充足率', status: '生效', definition: '集团并表口径资本充足率', type: '资本类', subtype: '资本充足', institution: '全集团', managementType: '风险限额指标', effectiveDate: '2024-01-01', frequency: '月度', sourceTables: ['资本充足率报表', '并表风险数据集市'], versions: [{ version: 'V3.0', operation: '维护', name: '资本充足率', definition: '集团并表口径资本充足率', effectiveDate: '2024-01-01', institution: '全集团', type: '资本类', subtype: '资本充足', frequency: '月度', sourceTable: '资本充足率报表', stopDate: '—' }, { version: 'V2.0', operation: '维护', name: '资本充足率', definition: '集团口径资本充足率', effectiveDate: '2023-01-01', institution: '全集团', type: '资本类', subtype: '资本充足', frequency: '季度', sourceTable: '资本报表', stopDate: '2023-12-31' }], logs: [createLog('维护', '新增并表数据来源表')] },
    { id: 'ind-2', code: 'IND-2024-002', name: '流动性覆盖率', status: '生效', definition: '高质量流动性资产覆盖净现金流出', type: '风险类', subtype: '流动性风险', institution: '全集团', managementType: '监测指标', effectiveDate: '2024-01-01', frequency: '日度', sourceTables: ['流动性风险监测表'], versions: [{ version: 'V2.0', operation: '维护', name: '流动性覆盖率', definition: '高质量流动性资产覆盖净现金流出', effectiveDate: '2024-01-01', institution: '全集团', type: '风险类', subtype: '流动性风险', frequency: '日度', sourceTable: '流动性风险监测表', stopDate: '—' }], logs: [createLog('新增', '建立指标定义与监测频率')] },
    { id: 'ind-3', code: 'IND-2024-003', name: '客户集中度', status: '停用', definition: '单一客户授信余额占资本净额比例', type: '风险类', subtype: '集中度风险', institution: '各成员公司', managementType: '监测指标', effectiveDate: '2024-06-01', frequency: '月度', sourceTables: ['集中度风险报表'], versions: [{ version: 'V1.0', operation: '停用', name: '客户集中度', definition: '单一客户授信余额占资本净额比例', effectiveDate: '2024-06-01', institution: '各成员公司', type: '风险类', subtype: '集中度风险', frequency: '月度', sourceTable: '集中度风险报表', stopDate: '2024-06-30' }], logs: [createLog('停用', '业务口径调整，旧指标停用')] },
  ],
  indicatorPeriodRecords: [],
  warningLetterSetting: {
    mode: '亮灯后手动发函', level: '黄灯及红灯', institutionScope: '全部机构', institutions: [],
    effectiveDate: '2024-01-01', description: '预警亮灯后由金控公司确认下发提示函。',
    logs: [createLog('初始化', '提示函下发模式初始化为手动发函')],
  },
  dashboardIndicatorConfig: { 集团: [], 金控公司: [], 各金融机构: [] },
  majorEvents: [
    { id: 'me-1', code: 'ME-2024-006', name: '某项目重大信用风险暴露', institution: '国际AMC', type: '关注/异常项目事件', occurredAt: '2024-06-18', latestReport: '续报', currentStage: '续报跟踪', status: '处理中', impact: '机构内及集团风险敞口影响', contact: '王五', phone: '13800138000', basic: '重点项目出现逾期迹象，涉及余额约 2.3 亿元。', analysis: '受行业需求下行及现金流回款延迟影响。', measures: '已启动专项清收和资产保全。', trend: '短期风险仍需关注，中期预计逐步缓释。', target: '控制损失、稳妥化解风险。', plan: '制定分阶段清收和增信措施。', responsibleDept: '风险管理部', responsible: '王五', deadline: '2024-08-30', attachments: [], followUps: [{ latestProgress: '已完成首轮客户沟通和增信方案评估。', riskChange: '风险敞口未进一步扩大。', execution: '清收计划按节点推进。', nextStep: '持续监测回款并更新处置方案。', attachments: [], date: '2024-06-28' }], logs: [createLog('核实并组织汇报', '金融机构管理部门完成核实') ] },
    { id: 'me-2', code: 'ME-2024-004', name: '信息科技系统故障事件', institution: '浦发银行', type: '重大信息科技风险事件', occurredAt: '2024-05-22', latestReport: '终报', currentStage: '终报完成', status: '已归档', impact: '短时影响线上交易服务', contact: '赵六', phone: '13900139000', basic: '核心系统发生短时不可用。', analysis: '基础设施异常导致服务中断。', measures: '完成故障切换与补偿。', trend: '风险已解除。', target: '保障系统稳定运行。', plan: '完成架构优化和应急演练。', responsibleDept: '科技管理部', responsible: '赵六', deadline: '2024-06-15', attachments: [], followUps: [], finalReport: { result: '系统恢复，完成整改。', impact: '无进一步损失。', release: '风险解除。', followUp: '纳入年度科技风险检查。', attachments: [], date: '2024-06-12' }, logs: [createLog('归档', '事件完成终报并归档')] },
  ],
  majorRiskEventDefinitions: seedMajorRiskEventDefinitions(),
  reports: [
    { id: 'rep-1', code: 'RPT-2024-001', name: '集团并表风险监测月报', institution: '国际AMC', type: '风险监测报表', frequency: '月度', latestReportDate: '2024-06-30', latestSubmitDate: '2024-07-03', status: '已报送', description: '汇总当月集团并表风险监测指标。', submissions: [{ id: 'sub-1', serial: 'SUB-20240703-001', reportDate: '2024-06-30', submitDate: '2024-07-03', submitTime: '14:20:11', submitter: '王五', note: '按期报送', files: [] }, { id: 'sub-2', serial: 'SUB-20240604-001', reportDate: '2024-05-31', submitDate: '2024-06-04', submitTime: '16:08:22', submitter: '王五', note: '按期报送', files: [] }], logs: [createLog('报送', '机构完成最新一期风险监测月报报送')] },
    { id: 'rep-2', code: 'RPT-2024-002', name: '重大风险事项清单', institution: '浦发银行', type: '监管报表', frequency: '季度', latestReportDate: '2024-06-30', latestSubmitDate: '2024-07-05', status: '已报送', description: '重大风险事件及风险处置情况。', submissions: [{ id: 'sub-3', serial: 'SUB-20240705-001', reportDate: '2024-06-30', submitDate: '2024-07-05', submitTime: '09:35:42', submitter: '赵六', note: '季度报送', files: [] }], logs: [createLog('报送', '完成季度监管报表报送')] },
  ],
  periodicReports: [
    { id: 'pr-1', name: '2024年二季度全面风险管理报告', institution: '国际AMC', type: '全面风险管理报告', reportDate: '2024-06-30', submitDate: '2024-07-08', cycle: '季度', overview: '报告二季度风险管理运行情况、预警处置及重大事项。', attachments: [], visibleInstitutions: ['集团本部', '国际AMC'], visibleDepartments: ['金融机构管理部', '风险管理部'], viewers: ['张三（集团管理层）'], pushMethod: '平台通知', status: '已提交', logs: [createLog('提交', '报告已按可见范围发布')] },
    { id: 'pr-2', name: '2024年6月风险监测快报', institution: '浦发银行', type: '风险监测报告', reportDate: '2024-06-30', submitDate: '2024-07-02', cycle: '月度', overview: '月度风险指标监测快报。', attachments: [], visibleInstitutions: ['集团本部'], visibleDepartments: ['金融机构管理部'], viewers: [], pushMethod: '邮件', status: '已提交', logs: [createLog('提交', '报告已提交')] },
  ],
  specialRisks: [
    { id: 'sr-1', letterNo: 'ZXFX-2024-001', name: '专项风险提示A', types: ['风险类型A'], institutions: ['国际AMC', '浦发银行', '国泰海通'], institutionNotes: { 国际AMC: '按提示函要求开展专项自查。', 浦发银行: '按提示函要求开展专项自查。', 国泰海通: '按提示函要求开展专项自查。' }, purpose: '针对风险类型A相关风险变化开展专项排查，压实机构风险防控责任。', measures: '完善风险识别、持续监测及内部管理措施。', requirements: '请于反馈期内完成自检并提交风险点、应对措施及后续安排。', attachments: [], createdAt: '2024-06-10', updatedAt: '2024-06-18', status: '已下发', workOrders: [{ id: 'ZXFX-2024-001-01', institution: '国际AMC', issuedAt: '2024-06-10', status: '已答复专项风险提示函', feedback: { contact: '机构联系人A', phone: '13800000001', understanding: '已组织学习并理解专项风险提示函要求。', problems: '已完成相关风险事项自查。', strategy: '持续加强风险监测并完善应对安排。', other: '后续按要求持续反馈。', attachments: [], date: '2024-06-15' } }, { id: 'ZXFX-2024-001-02', institution: '浦发银行', issuedAt: '2024-06-10', status: '已下发专项风险提示函' }, { id: 'ZXFX-2024-001-03', institution: '国泰海通', issuedAt: '2024-06-10', status: '已审阅答复函', feedback: { contact: '机构联系人B', phone: '13800000002', understanding: '已完成专项风险提示函传达。', problems: '已完成相关事项自查。', strategy: '建立持续跟踪机制。', other: '', attachments: [], date: '2024-06-16' }, evaluation: { result: '已审阅', department: '金融机构管理部', summary: '答复内容已审阅，请按要求持续开展跟踪反馈。', date: '2024-06-17', attachments: [] } }], logs: [createLog('提交并下发', '专项风险提示函已下发至3家机构')] },
    { id: 'sr-2', letterNo: 'ZXFX-2024-002', name: '专项风险提示B', types: ['风险类型B'], institutions: ['浦发银行', '上海农商银行'], institutionNotes: { 浦发银行: '', 上海农商银行: '' }, purpose: '针对风险类型B相关风险变化开展专项排查。', measures: '做好风险监测与必要的管理准备。', requirements: '提交自查结果及后续管理安排。', attachments: [], createdAt: '2024-05-22', updatedAt: '2024-06-03', status: '草稿', workOrders: [], logs: [createLog('保存草稿', '专项提示草稿已保存')] },
  ],
});

const allowedInstitutions = ['上海农商银行', '国际AMC', '浦发银行', '国泰海通', '中国太平洋保险'];
const institutionAliases: Record<string, string> = {
  '上农商': '上海农商银行', '上海农商': '上海农商银行', '集团本部': '上海农商银行',
  '东方证券': '国泰海通', '申能财务': '浦发银行', '中能财险': '中国太平洋保险',
  '中能租赁': '上海农商银行', '保科技': '中国太平洋保险'
};
const normalizeInstitution = (value: string, coverage = false) => {
  if (!value) return coverage ? allowedInstitutions.join('、') : allowedInstitutions[0];
  if (/全集团|集团及并表金融机构|各成员公司/.test(value)) return allowedInstitutions.join('、');
  const values = value.split(/[、,，/]/).map(x => institutionAliases[x.trim()] || x.trim()).filter(x => allowedInstitutions.includes(x));
  return [...new Set(values)].join('、') || allowedInstitutions[0];
};

const seedIndicatorPeriods = (state: DemoState): IndicatorPeriodRecord[] => {
  const periods = [
    { period: '2026年1月', order: 202601 }, { period: '2026年2月', order: 202602 },
    { period: '2026年3月', order: 202603 }, { period: '2026年4月', order: 202604 },
    { period: '2026年5月', order: 202605 }, { period: '2026年6月', order: 202606 },
  ];
  const valueFor = (name: string, institutionIndex: number, periodIndex: number) => {
    const monthOffset = periodIndex - (periods.length - 1);
    if (name.includes('资本充足率')) return [13.80, 11.40, 14.20, 12.60, 10.20][institutionIndex] + monthOffset * .12;
    if (name.includes('流动性覆盖率')) return [135, 112, 98, 128, 118][institutionIndex] + monthOffset * 1.5;
    if (name.includes('集中度')) return [8, 12, 16, 9, 13][institutionIndex] + monthOffset * .35;
    return 60 + institutionIndex * 8 + periodIndex * 1.2;
  };
  const records = state.indicators.flatMap(indicator => {
    const applicableInstitutions = normalizeInstitution(indicator.institution, true).split('、');
    const rule = state.warningRules.find(candidate => candidate.indicator === indicator.name);
    return applicableInstitutions.flatMap((institution, institutionIndex) => periods.map((period, periodIndex): IndicatorPeriodRecord => {
      const indicatorUnit = state.riskPreferences.flatMap(item => item.indicators).find(item => item.name === indicator.name)?.unit || inferIndicatorUnit(indicator.name);
      const indicatorValue = formatIndicatorValue(String(valueFor(indicator.name, institutionIndex, periodIndex)), indicatorUnit);
      const rules = normalizeIndicatorRules({ indicatorName: indicator.name, yellowRule: rule?.yellow || '', redRule: rule?.red || '' });
      const base = {
        id: `ipr-${indicator.id}-${institutionIndex}-${period.order}`, indicatorId: indicator.id, indicatorCode: indicator.code,
        indicatorName: indicator.name, indicatorDefinition: indicator.definition, indicatorType: indicator.type, indicatorSubType: indicator.subtype,
        institution, monitoringFrequency: normalizeMonitoringFrequency(indicator.frequency, period.period), indicatorValue, indicatorUnit,
        cumulativeRedCount: 0, cumulativeYellowCount: 0, cumulativeGreenCount: 0,
        forecastRange: indicator.name.includes('流动性') ? '100.00%—150.00%' : indicator.name.includes('集中度') ? '5.00%—15.00%' : '10.50%—18.00%',
        ...rules, period: period.period, periodOrder: period.order,
      };
      return { ...base, currentLightStatus: evaluateIndicatorLightStatus(base) };
    }));
  });
  return calculateCumulativeLightCounts(records);
};

const defaultWarningLetterSetting = (): WarningLetterSetting => ({
  mode: '亮灯后手动发函', level: '黄灯及红灯', institutionScope: '全部机构', institutions: [],
  effectiveDate: '2024-01-01', description: '预警亮灯后由金控公司确认下发提示函。', logs: [],
});

const workflowRecord = (
  id: string,
  nodeId: string,
  nodeName: string,
  role: WorkflowActor,
  formData: Record<string, string>,
  action = '提交',
  result = '已完成',
  attachments: Attachment[] = [],
  submittedAt = '2024-06-30 10:00:00',
): WorkflowNodeRecord => ({ id, nodeId, nodeName, department: role === '系统' ? '系统' : role === '各金融机构' ? '机构风险管理部门' : role === '集团' ? '集团管理部门' : '金控风险管理部', role, handler: role === '系统' ? '系统' : role === '各金融机构' ? '机构经办人' : role === '集团' ? '集团经办人' : '张三', action, result, submittedAt, formData, attachments, status: result.includes('退回') ? '已退回' : '已完成', iteration: 1 });

const warningNodeNames: Record<string, string> = {
  'yellow-system-issued': '系统推送预警提示函',
  'yellow-reason': '各金融机构填写原因分析答复',
  'yellow-plan': '各金融机构提交应对处置方案',
  'yellow-execution': '各金融机构持续跟进执行情况',
  'yellow-release': '各金融机构发起解除预警评估',
  'red-system-issued': '系统推送重大风险提示',
  'red-reason': '各金融机构填写原因分析答复',
  'red-plan': '各金融机构提交应对处置方案',
  'red-group-assessment': '集团评估反馈',
  'red-group-review': '集团审阅处置方案',
  'red-execution': '金控公司持续跟进执行情况',
  'red-release': '金控公司解除预警评估',
};

const migrateWarningNodeId = (nodeId: string, level: string) => {
  if (nodeId.startsWith('yellow-') || nodeId.startsWith('red-')) return nodeId;
  const yellowMap: Record<string, string> = {
    'reason-fill': 'yellow-reason', 'reason-review': 'yellow-reason',
    'plan-fill': 'yellow-plan', 'plan-review': 'yellow-plan',
    'management-coordination': 'yellow-execution', execution: 'yellow-execution',
    'tracking-release': 'yellow-release',
  };
  const redMap: Record<string, string> = {
    'reason-fill': 'red-reason', 'reason-review': 'red-group-assessment',
    'plan-fill': 'red-plan', 'plan-review': 'red-group-assessment',
    'management-coordination': 'red-group-review', execution: 'red-execution',
    'tracking-release': 'red-release',
  };
  return (level === '黄灯' ? yellowMap : redMap)[nodeId] || (level === '黄灯' ? 'yellow-reason' : 'red-reason');
};

const inferWarningCurrentNode = (level: string, status: string) => {
  if (level === '黄灯') {
    if (/解除/.test(status)) return 'yellow-release';
    if (/跟踪|执行/.test(status)) return 'yellow-execution';
    if (/方案/.test(status)) return 'yellow-plan';
    return 'yellow-reason';
  }
  if (/解除|常态/.test(status)) return 'red-release';
  if (/跟踪|执行/.test(status)) return 'red-execution';
  if (/审阅/.test(status)) return 'red-group-review';
  if (/评估|审核/.test(status)) return 'red-group-assessment';
  if (/方案/.test(status)) return 'red-plan';
  return 'red-reason';
};

const majorEventNodeNames: Record<string, string> = {
  'event-initial-report': '各金融机构提交事件首报',
  'event-verify': '集团核实事件并组织汇报',
  'event-plan': '各金融机构提交处置方案',
  'event-plan-assessment': '集团评估并审阅处置方案',
  'event-executive-review': '经理层、董事会审阅',
  'event-execution-report': '各金融机构执行处置并提交续报',
  'event-holding-track': '金控公司持续跟踪及结束评估',
  'event-final-routine': '终报归档或转入常态化跟踪',
};

const migrateMajorEventNodeId = (nodeId: string, status: string, hasFollowUps: boolean) => {
  if (majorEventNodeNames[nodeId]) return nodeId;
  const mapping: Record<string, string> = {
    'event-create': 'event-initial-report', 'first-report': status === '草稿' ? 'event-initial-report' : 'event-verify',
    'verify-report': 'event-verify', 'management-review': 'event-plan-assessment', 'board-review': 'event-executive-review',
    'event-execution': hasFollowUps ? 'event-holding-track' : 'event-execution-report', 'final-archive': 'event-final-routine',
  };
  return mapping[nodeId] || 'event-initial-report';
};

export const normalizeState = (source: DemoState): DemoState => {
  const state = structuredClone(source);
  const legacyLetterMode = state.warningLetterSetting?.mode === '亮灯直接发函' ? 'auto' : state.warningLetterSetting?.mode === '只亮灯不发函' ? 'none' : 'manual';
  state.institutions = state.institutions?.length ? state.institutions : seedInstitutions();
  state.riskPreferences.forEach(x => {
    x.institution = normalizeInstitution(x.institution, true);
    x.indicators.forEach(y => y.institution = normalizeInstitution(y.institution));
    if (!x.workflow) {
      const records = [workflowRecord(`wf-${x.id}-1`, 'rp-prepare', '方案编制与提交', '金控公司', { 方案说明: x.summary, 风险偏好陈述: x.statement, 编制依据: x.basis }, x.status === '待提交' ? '保存草稿' : '提交方案', x.status === '待提交' ? '草稿' : '已提交', x.attachments, x.logs[0]?.time)];
      if (x.status === '已生效' || x.status === '已失效') records.push(workflowRecord(`wf-${x.id}-2`, 'rp-review', '方案审核与重检', '集团', { 审核意见: '方案指标及口径审核通过' }, '审核通过', '通过', [], x.logs[0]?.time));
      if (x.status === '已生效' || x.status === '已失效') records.push(workflowRecord(`wf-${x.id}-3`, 'rp-effective', '管理层审阅及发布', '集团', { 审阅意见: '同意发布实施' }, '审阅发布', x.status, [], x.logs[0]?.time));
      x.workflow = { currentNodeId: x.status === '待审核' ? 'rp-review' : x.status === '待提交' ? 'rp-prepare' : 'rp-effective', records };
    }
  });
  state.warningRules.forEach(x => {
    x.institution = normalizeInstitution(x.institution);
    const normalizedRules = normalizeIndicatorRules({ indicatorName: x.indicator, yellowRule: x.yellow, redRule: x.red });
    x.yellow = normalizedRules.yellowRule;
    x.red = normalizedRules.redRule;
    x.letterDeliveryMode ||= legacyLetterMode;
    x.letterDeliveryChanges ||= [];
    x.nodes.forEach(y => { if (y.light === '不亮灯') y.light = '绿灯（不预警）'; });
    x.segments.forEach(y => { if (y.light === '不亮灯') y.light = '绿灯（不预警）'; });
    x.versions ||= [{ version: 'V1.0', effectiveDate: x.effectiveDate, yellow: x.yellow, red: x.red, nodes: structuredClone(x.nodes), segments: structuredClone(x.segments), pushMethods: [...x.pushMethods], letterDeliveryMode: x.letterDeliveryMode, reason: '历史规则迁移', status: x.status }];
    x.versions.forEach(version => {
      version.letterDeliveryMode ||= x.letterDeliveryMode;
      const versionRules = normalizeIndicatorRules({ indicatorName: x.indicator, yellowRule: version.yellow, redRule: version.red });
      version.yellow = versionRules.yellowRule;
      version.red = versionRules.redRule;
    });
    if (x.pendingConfig) x.pendingConfig.letterDeliveryMode ||= x.letterDeliveryMode;
    x.operationRecords ||= x.logs.map((log, index) => ({ id: `op-${x.id}-${index}`, action: log.action, beforeStatus: '—', afterStatus: x.status, operator: log.operator, role: '金控公司' as Role, time: log.time, reason: log.content, opinion: '—', attachments: [], version: x.versions?.[0]?.version || 'V1.0' }));
  });
  state.warningDisposals.forEach(x => {
    x.institution = normalizeInstitution(x.institution);
    const associatedRule = state.warningRules.find(rule => rule.indicator === x.indicator && rule.institution.split('、').includes(x.institution)) || state.warningRules.find(rule => rule.indicator === x.indicator);
    const indicator = state.indicators.find(candidate => candidate.name === x.indicator);
    x.associatedRuleId ||= associatedRule?.id;
    x.ruleVersion ||= associatedRule?.versions?.[0]?.version || 'V1.0';
    x.letterDeliveryMode ||= associatedRule?.letterDeliveryMode || legacyLetterMode;
    if (!x.letterStatus || x.letterStatus === ('未下发' as string)) x.letterStatus = x.letterDeliveryMode === 'auto' ? '已下发' : x.letterDeliveryMode === 'none' ? '不发函' : '待下发';
    if (x.letterDeliveryMode === 'auto') {
      x.letterSentBy ||= '系统';
      x.letterSentAt ||= x.triggerDate;
    }
    x.noticeType = x.level === '黄灯' ? '预警提示函' : '重大风险提示';
    x.workflowType = x.level === '黄灯' ? 'yellow' : 'red';
    x.indicatorId ||= indicator?.id;
    x.indicatorCode ||= indicator?.code;
    x.monitoringFrequency ||= indicator?.frequency || associatedRule?.frequency;
    x.period ||= x.triggerDate.slice(0, 7);
    x.currentLightStatus = x.level;
    x.yellowRule ||= associatedRule?.yellow;
    x.redRule ||= associatedRule?.red;
    x.ruleCode ||= associatedRule?.code;
    x.disposalMeasures ||= x.plan ? [{ id: `measure-${x.id}-1`, responsibleDepartment: '机构风险管理部门', responsiblePerson: '机构经办人', measure: x.plan, plannedStartDate: x.triggerDate.slice(0, 10), plannedCompletionDate: x.expectedReleaseDate || '', expectedEffect: '预警指标逐步恢复至合理区间', submitted: true }] : [];
    x.executionProgressList ||= x.followUp ? [{ id: `progress-${x.id}-1`, updatedAt: x.triggerDate.slice(0, 10), measure: x.plan || '落实处置方案', currentProgress: x.followUp, completedItems: x.followUp, incompleteItems: '', problems: '', nextSteps: '持续跟踪并按期反馈', completionRate: '50', attachments: x.attachments, submitted: true }] : [];
    x.drafts ||= {};
    if (!x.workflow) {
      const records: WorkflowNodeRecord[] = [];
      if (x.reason) records.push(workflowRecord(`wf-${x.id}-1`, x.level === '黄灯' ? 'yellow-reason' : 'red-reason', warningNodeNames[x.level === '黄灯' ? 'yellow-reason' : 'red-reason'], '各金融机构', { 原因分析: x.reason, 影响情况: '已纳入风险影响评估', 初步应对措施: x.plan || '已启动初步处置' }, '提交原因分析', '已提交', x.attachments, x.logs[0]?.time));
      if (x.plan) records.push(workflowRecord(`wf-${x.id}-2`, x.level === '黄灯' ? 'yellow-plan' : 'red-plan', warningNodeNames[x.level === '黄灯' ? 'yellow-plan' : 'red-plan'], '各金融机构', { 处置目标: '控制预警指标并逐步恢复至合理区间', 处置措施: x.plan, 责任部门: '机构风险管理部门', 责任人: '机构经办人', 计划完成时间: x.expectedReleaseDate || '持续推进' }, '提交处置方案', '已提交', x.attachments, x.logs[0]?.time));
      if (x.level === '红灯' && x.assessment) records.push(workflowRecord(`wf-${x.id}-3`, 'red-group-assessment', '集团评估', '集团', { 评估意见: x.assessment }, '提交集团评估', '通过', [], x.logs[0]?.time));
      if (x.level === '红灯' && x.review) records.push(workflowRecord(`wf-${x.id}-4`, 'red-group-review', '集团审阅', '集团', { 审阅意见: x.review }, '集团审阅通过', '通过', [], x.logs[0]?.time));
      if (x.followUp) records.push(workflowRecord(`wf-${x.id}-5`, x.level === '黄灯' ? 'yellow-execution' : 'red-execution', warningNodeNames[x.level === '黄灯' ? 'yellow-execution' : 'red-execution'], '各金融机构', { 本期执行情况: x.followUp, 下一步计划: '持续跟踪并按期反馈' }, '提交执行反馈', '持续跟踪', x.attachments, x.logs[0]?.time));
      x.workflow = { currentNodeId: inferWarningCurrentNode(x.level, x.status), records };
    } else {
      x.workflow.currentNodeId = migrateWarningNodeId(x.workflow.currentNodeId, x.level);
      x.workflow.records = x.workflow.records.map(record => {
        const nodeId = migrateWarningNodeId(record.nodeId, x.level);
        return { ...record, nodeId, nodeName: warningNodeNames[nodeId] || record.nodeName };
      });
    }
    const systemNodeId = x.level === '黄灯' ? 'yellow-system-issued' : 'red-system-issued';
    if (!x.workflow.records.some(record => record.nodeId === systemNodeId)) {
      const action = x.letterDeliveryMode === 'auto' ? '自动下发提示函' : x.letterDeliveryMode === 'manual' ? '生成待下发提示函' : '记录不发函';
      const deliveryLabel = x.letterDeliveryMode === 'auto' ? '亮灯直接发函' : x.letterDeliveryMode === 'none' ? '只亮灯不发函' : '亮灯后手动发函';
      x.workflow.records.unshift(workflowRecord(`wf-${x.id}-system`, systemNodeId, warningNodeNames[systemNodeId], '系统', { 提示编号: x.letterNo, 指标名称: x.indicator, 本期指标值: x.value, 黄灯规则: x.yellowRule || '—', 红灯规则: x.redRule || '—', 当期亮灯情况: x.level, 触发日期: x.triggerDate, 提示函下发方式: deliveryLabel, 函件状态: x.letterStatus || '—' }, action, x.letterStatus || '已生成', [], x.triggerDate));
    }
    const beforeWarningState = `${x.letterStatus || ''}|${x.workflow.currentNodeId}|${x.status}`;
    normalizeWarningItemState(x);
    const afterWarningState = `${x.letterStatus || ''}|${x.workflow.currentNodeId}|${x.status}`;
    if (beforeWarningState !== afterWarningState && !x.logs.some(log => log.action === '函件流程一致性修复')) x.logs.push(createLog('函件流程一致性修复', `函件状态、当前节点及事项状态已按下发记录完成标准化：${afterWarningState}`, '系统'));
    if (!x.logs.some(log => log.action === '系统生成预警事项')) x.logs.unshift(createLog('系统生成预警事项', `${x.level}${x.indicator}亮灯，已生成${x.noticeType}事项`, '系统'));
    if (x.letterDeliveryMode === 'auto' && !x.logs.some(log => log.action === '自动下发函件')) x.logs.push(createLog('自动下发函件', `系统自动下发${x.noticeType} ${x.letterNo}`, '系统'));
  });
  state.indicators.forEach(x => { x.institution = normalizeInstitution(x.institution); x.versions.forEach(y => y.institution = normalizeInstitution(y.institution)); });
  const seededRecords = seedIndicatorPeriods(state);
  const seedById = new Map(seededRecords.map(record => [record.id, record]));
  const indicatorPeriodRecords = state.indicatorPeriodRecords?.length ? state.indicatorPeriodRecords.map(record => {
    const indicator = state.indicators.find(item => item.id === record.indicatorId || item.code === record.indicatorCode);
    const rule = state.warningRules.find(item => item.indicator === record.indicatorName);
    const seeded = seedById.get(record.id);
    const indicatorUnit = record.indicatorUnit || state.riskPreferences.flatMap(item => item.indicators).find(item => item.name === record.indicatorName)?.unit || inferIndicatorUnit(record.indicatorName, record.indicatorValue);
    const indicatorValue = !record.indicatorValue || seeded ? (seeded?.indicatorValue || formatIndicatorValue('0', indicatorUnit)) : formatIndicatorValue(record.indicatorValue, indicatorUnit);
    const rules = normalizeIndicatorRules({ indicatorName: record.indicatorName, yellowRule: seeded?.yellowRule || record.yellowRule || rule?.yellow || '', redRule: seeded?.redRule || record.redRule || rule?.red || '' });
    const normalized = {
      ...record,
      institution: normalizeInstitution(record.institution),
      monitoringFrequency: normalizeMonitoringFrequency(record.monitoringFrequency || indicator?.frequency, record.period),
      indicatorValue,
      indicatorUnit,
      cumulativeRedCount: record.cumulativeRedCount || 0,
      cumulativeYellowCount: record.cumulativeYellowCount || 0,
      cumulativeGreenCount: record.cumulativeGreenCount || 0,
      forecastRange: seeded?.forecastRange || record.forecastRange || record.reasonableRange || (indicatorUnit === '%' ? '合理区间按规则动态判断' : '结合历史趋势判断'),
      ...rules,
    } as Omit<IndicatorPeriodRecord, 'currentLightStatus'> & { currentLightStatus?: IndicatorPeriodRecord['currentLightStatus'] };
    return { ...normalized, currentLightStatus: evaluateIndicatorLightStatus(normalized) } as IndicatorPeriodRecord;
  }) : seededRecords;
  const completePeriodRecords = state.indicatorPeriodRecords?.length ? [...seededRecords, ...indicatorPeriodRecords] : indicatorPeriodRecords;
  const uniquePeriodRecords = [...new Map(completePeriodRecords.map(record => [`${record.indicatorId}::${record.institution}::${record.periodOrder}`, record])).values()];
  state.indicatorPeriodRecords = calculateCumulativeLightCounts(uniquePeriodRecords);
  void validateIndicatorPeriodRecords(state.indicatorPeriodRecords);
  state.warningLetterSetting = state.warningLetterSetting ? { ...defaultWarningLetterSetting(), ...state.warningLetterSetting, logs: state.warningLetterSetting.logs || [] } : defaultWarningLetterSetting();
  const latestRecords = indicatorPeriodService.latest(state.indicatorPeriodRecords);
  const dashboardDefaults = latestRecords.slice(0, 6).map(record => record.id);
  state.dashboardIndicatorConfig = {
    集团: state.dashboardIndicatorConfig?.集团?.length ? state.dashboardIndicatorConfig.集团 : dashboardDefaults,
    金控公司: state.dashboardIndicatorConfig?.金控公司?.length ? state.dashboardIndicatorConfig.金控公司 : dashboardDefaults,
    各金融机构: state.dashboardIndicatorConfig?.各金融机构?.length ? state.dashboardIndicatorConfig.各金融机构 : latestRecords.filter(record => record.institution === '国际AMC').slice(0, 6).map(record => record.id),
  };
  state.majorRiskEventDefinitions = state.majorRiskEventDefinitions?.length ? state.majorRiskEventDefinitions : seedMajorRiskEventDefinitions();
  state.majorEvents.forEach(x => {
    x.institution = normalizeInstitution(x.institution);
    const originalEventType = x.type;
    x.type = normalizeMajorRiskEventType(x.type, x.name, state.majorRiskEventDefinitions);
    if (originalEventType !== x.type && !x.logs.some(log => log.action === '事件类型标准化')) x.logs.push(createLog('事件类型标准化', `风险事件类型由“${originalEventType}”映射为“${x.type}”`, '系统'));
    x.responsibleDept = Array.isArray(x.responsibleDept) ? x.responsibleDept.join('、') : (x.responsibleDept || '');
    x.discoveredAt ||= x.occurredAt;
    x.planMeasures ||= x.plan ? [{ id: `event-measure-${x.id}-1`, responsibleDepartment: x.responsibleDept || '机构风险管理部门', responsiblePerson: x.responsible || '机构经办人', measure: x.plan, plannedStartDate: x.occurredAt, plannedCompletionDate: x.deadline || '', expectedEffect: x.target || '控制事件风险并降低影响', submitted: true }] : [];
    x.eventDrafts ||= {};
    x.executiveReviewData ||= {};
    x.reviewStage ||= 'management';
    x.followUps ||= [];
    x.followUps.forEach((report, index) => { report.id ||= `event-followup-${x.id}-${index + 1}`; report.code ||= `${x.code}-XB-${String(index + 1).padStart(2, '0')}`; });
    if (!x.workflow) {
      const records: WorkflowNodeRecord[] = [];
      if (x.status !== '草稿') records.push(workflowRecord(`wf-${x.id}-1`, 'event-initial-report', majorEventNodeNames['event-initial-report'], '各金融机构', { 事件名称: x.name, 风险事件类型: x.type, 发生时间: x.occurredAt, 发现时间: x.discoveredAt, 事件基本情况: x.basic, 初步分析研判: x.analysis, 影响范围: x.impact, 发展趋势: x.trend, 联系人: x.contact, 联系方式: x.phone }, '提交首报', '已提交', x.attachments, x.logs[0]?.time));
      if (/核实|处理|归档|终报|续报|跟踪/.test(`${x.currentStage}${x.status}`)) records.push(workflowRecord(`wf-${x.id}-2`, 'event-verify', majorEventNodeNames['event-verify'], '集团', { 核实结论: '核实通过', 事件认定意见: x.logs[0]?.content || '事件信息已核实' }, '核实通过', '通过', [], x.logs[0]?.time));
      if (x.plan) records.push(workflowRecord(`wf-${x.id}-3`, 'event-plan', majorEventNodeNames['event-plan'], '各金融机构', { 处置目标: x.target, 处置措施: x.plan, 责任部门: x.responsibleDept, 责任人: x.responsible, 计划完成时间: x.deadline }, '提交处置方案', '已提交', x.attachments, x.logs[0]?.time));
      x.followUps.forEach((report, index) => {
        records.push(workflowRecord(`wf-${x.id}-6-${index}`, 'event-execution-report', majorEventNodeNames['event-execution-report'], '各金融机构', { 续报编号: report.code || '', 事件最新情况: report.latestProgress, 风险变化情况: report.riskChange, 处置措施执行情况: report.execution, 下一步工作安排: report.nextStep }, `提交第${index + 1}次续报`, '已提交', report.attachments, report.date));
        records.push(workflowRecord(`wf-${x.id}-7-${index}`, 'event-holding-track', majorEventNodeNames['event-holding-track'], '金控公司', { 跟踪意见: '已接收并持续跟踪机构续报', 处置进度评价: report.latestProgress }, '提交跟踪意见', '持续跟踪', [], report.date));
      });
      if (x.finalReport) records.push(workflowRecord(`wf-${x.id}-8`, 'event-final-routine', majorEventNodeNames['event-final-routine'], '各金融机构', { 终报编号: x.finalReport.code || `${x.code}-ZB`, 事件最终情况: x.finalReport.result, 事件影响结果: x.finalReport.impact, 风险是否解除: x.finalReport.release, 后续管理建议: x.finalReport.followUp }, '提交终报', x.status === '已归档' ? '已归档' : '常态化跟踪', x.finalReport.attachments, x.finalReport.date));
      x.workflow = { currentNodeId: x.status === '已归档' || x.status === '常态跟踪' ? 'event-final-routine' : x.followUps.length ? 'event-holding-track' : x.status === '待审核' ? 'event-verify' : x.status === '草稿' ? 'event-initial-report' : 'event-execution-report', records };
    } else {
      const migratedRecords: WorkflowNodeRecord[] = [];
      x.workflow.records.forEach(record => {
        if (record.nodeId === 'first-report') {
          migratedRecords.push({ ...record, id: `${record.id}-initial`, nodeId: 'event-initial-report', nodeName: majorEventNodeNames['event-initial-report'], formData: { 事件名称: x.name, 风险事件类型: x.type, 发生时间: x.occurredAt, 发现时间: x.discoveredAt || x.occurredAt, 事件基本情况: x.basic, 初步分析研判: x.analysis, 影响范围: x.impact, 发展趋势: x.trend, 联系人: x.contact, 联系方式: x.phone }, action: '提交首报' });
          migratedRecords.push({ ...record, id: `${record.id}-plan`, nodeId: 'event-plan', nodeName: majorEventNodeNames['event-plan'], formData: { 处置目标: x.target, 处置措施: x.plan, 责任部门: x.responsibleDept, 责任人: x.responsible, 计划完成时间: x.deadline }, action: '提交处置方案' });
          return;
        }
        if (record.nodeId === 'event-execution') {
          migratedRecords.push({ ...record, id: `${record.id}-report`, nodeId: 'event-execution-report', nodeName: majorEventNodeNames['event-execution-report'] });
          migratedRecords.push({ ...record, id: `${record.id}-track`, nodeId: 'event-holding-track', nodeName: majorEventNodeNames['event-holding-track'], role: '金控公司', department: '金控风险管理部', handler: '金控公司', action: '持续跟踪', formData: { 跟踪意见: '由原执行处置记录迁移', ...record.formData } });
          return;
        }
        const nodeId = migrateMajorEventNodeId(record.nodeId, x.status, x.followUps.length > 0);
        migratedRecords.push({ ...record, nodeId, nodeName: majorEventNodeNames[nodeId] || record.nodeName });
      });
      x.workflow.records = migratedRecords;
      x.workflow.currentNodeId = migrateMajorEventNodeId(x.workflow.currentNodeId, x.status, x.followUps.length > 0);
    }
    x.workflow.records.forEach(record => {
      if (record.formData['风险事件类型']) record.formData['风险事件类型'] = x.type;
    });
    if (x.status === '待审核') x.status = '待核实';
    else if (x.status === '处理中') x.status = x.followUps.length ? '持续跟踪中' : '处置执行中';
    else if (x.status === '常态跟踪') x.status = '常态化跟踪';
    if (x.status === '已归档') { x.workflow.currentNodeId = 'event-final-routine'; x.closureBranch ||= 'final-report'; }
    else if (x.status === '常态化跟踪') { x.workflow.currentNodeId = 'event-final-routine'; x.closureBranch = 'routine-tracking'; x.node8Actor ||= '各金融机构'; }
    else if (x.status === '待核实') x.workflow.currentNodeId = 'event-verify';
    else if (x.status === '草稿') x.workflow.currentNodeId = 'event-initial-report';
    else if (x.status === '持续跟踪中') x.workflow.currentNodeId = 'event-holding-track';
    else if (x.status === '处置执行中') x.workflow.currentNodeId = 'event-execution-report';
    x.currentStage = x.status === '已归档' ? '终报归档' : x.status === '常态化跟踪' ? '常态化跟踪' : majorEventNodeNames[x.workflow.currentNodeId] || x.currentStage;
  });
  state.reports.forEach(x => x.institution = normalizeInstitution(x.institution));
  state.periodicReports.forEach(x => { x.institution = normalizeInstitution(x.institution); x.visibleInstitutions = x.visibleInstitutions.map(y => normalizeInstitution(y)); });
  state.specialRisks.forEach(x => {
    const specialIndex = state.specialRisks.indexOf(x);
    const suffix = String(specialIndex + 1).padStart(3, '0');
    x.letterNo = /^ZXFX-\d{4}-\d{3}$/.test(x.letterNo || '') ? x.letterNo : `ZXFX-2024-${suffix}`;
    const simulated = x.types.length > 0 && x.types.every(type => /^风险类型[A-D]$/.test(type));
    if (!simulated) {
      const typeCode = String.fromCharCode(65 + Math.min(specialIndex, 3));
      x.name = `专项风险提示${typeCode}`;
      x.types = [`风险类型${typeCode}`];
      x.purpose = `针对风险类型${typeCode}相关风险变化开展专项排查，压实机构风险防控责任。`;
      x.measures = '完善风险识别、持续监测及内部管理措施。';
      x.requirements = '请按专项风险提示函要求完成自查、提交答复并持续开展后续跟踪反馈。';
    }
    x.logs.forEach(log => { log.content = log.content.replace(/独立机构工单|机构工单|工单/g, '专项风险提示函接收记录'); });
    x.institutions = x.institutions.flatMap(y => normalizeInstitution(y).split('、'));
    x.institutionNotes = Object.fromEntries(Object.entries(x.institutionNotes).map(([k, v]) => [normalizeInstitution(k), v]));
    x.workOrders.forEach((y, orderIndex) => {
      y.id = `${x.letterNo}-${String(orderIndex + 1).padStart(2, '0')}`;
      y.institution = normalizeInstitution(y.institution);
      const legacyStatus = y.status as string;
      y.status = !y.feedback ? '已下发专项风险提示函' : y.evaluation || ['部分' + '解除', '已' + '解除', '待跟踪反馈', '已审阅答复函'].includes(legacyStatus) ? '已审阅答复函' : '已答复专项风险提示函';
      const legacyWorkflow = !y.workflow || !['special-feedback', 'special-review', 'special-track'].includes(y.workflow.currentNodeId) || y.workflow.records.some(record => ['special-evaluate', 'special-release'].includes(record.nodeId));
      if (legacyWorkflow) {
        const records = [workflowRecord(`wf-${y.id}-1`, 'special-issued', '国资公司下发专项风险提示函', '金控公司', { 提示背景与目的: x.purpose, 管理措施与建议: x.measures, 反馈要求: x.requirements }, '下发专项风险提示函', '已下发专项风险提示函', x.attachments, x.createdAt)];
        if (y.feedback) records.push(workflowRecord(`wf-${y.id}-2`, 'special-feedback', '金融机构答复专项风险提示函', '各金融机构', { 认识与理解: y.feedback.understanding, 自查问题与风险点: y.feedback.problems, 风险应对策略: y.feedback.strategy, 其他反馈: y.feedback.other }, '提交答复函', '已答复专项风险提示函', y.feedback.attachments, y.feedback.date));
        if (y.evaluation) records.push(workflowRecord(`wf-${y.id}-3`, 'special-review', '国资公司审阅答复函', '集团', { 审阅意见: y.evaluation.summary }, '完成答复函审阅', '已审阅答复函', y.evaluation.attachments, y.evaluation.date));
        y.workflow = { currentNodeId: y.status === '已下发专项风险提示函' ? 'special-feedback' : y.status === '已答复专项风险提示函' ? 'special-review' : 'special-track', records };
      }
    });
  });
  return state;
};

export const loadState = (): DemoState => {
  try {
    const value = localStorage.getItem(KEY);
    const normalized = value ? normalizeState(JSON.parse(value) as DemoState) : normalizeState(seedState());
    saveState(normalized);
    return normalized;
  } catch { return seedState(); }
};
export const saveState = (state: DemoState) => localStorage.setItem(KEY, JSON.stringify(normalizeState(state)));
export const resetState = () => { const value = normalizeState(seedState()); saveState(value); return value; };
