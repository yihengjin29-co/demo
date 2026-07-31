import type { DemoState, LogEntry, Attachment } from '../types';

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
  majorEvents: [
    { id: 'me-1', code: 'ME-2024-006', name: '某项目重大信用风险暴露', institution: '国际AMC', type: '重大信用风险事件', occurredAt: '2024-06-18', latestReport: '续报', currentStage: '续报跟踪', status: '处理中', impact: '机构内及集团风险敞口影响', contact: '王五', phone: '13800138000', basic: '重点项目出现逾期迹象，涉及余额约 2.3 亿元。', analysis: '受行业需求下行及现金流回款延迟影响。', measures: '已启动专项清收和资产保全。', trend: '短期风险仍需关注，中期预计逐步缓释。', target: '控制损失、稳妥化解风险。', plan: '制定分阶段清收和增信措施。', responsibleDept: '风险管理部', responsible: '王五', deadline: '2024-08-30', attachments: [], followUps: [{ latestProgress: '已完成首轮客户沟通和增信方案评估。', riskChange: '风险敞口未进一步扩大。', execution: '清收计划按节点推进。', nextStep: '持续监测回款并更新处置方案。', attachments: [], date: '2024-06-28' }], logs: [createLog('核实并组织汇报', '金融机构管理部门完成核实') ] },
    { id: 'me-2', code: 'ME-2024-004', name: '信息科技系统故障事件', institution: '浦发银行', type: '重大信息科技风险事件', occurredAt: '2024-05-22', latestReport: '终报', currentStage: '终报完成', status: '已归档', impact: '短时影响线上交易服务', contact: '赵六', phone: '13900139000', basic: '核心系统发生短时不可用。', analysis: '基础设施异常导致服务中断。', measures: '完成故障切换与补偿。', trend: '风险已解除。', target: '保障系统稳定运行。', plan: '完成架构优化和应急演练。', responsibleDept: '科技管理部', responsible: '赵六', deadline: '2024-06-15', attachments: [], followUps: [], finalReport: { result: '系统恢复，完成整改。', impact: '无进一步损失。', release: '风险解除。', followUp: '纳入年度科技风险检查。', attachments: [], date: '2024-06-12' }, logs: [createLog('归档', '事件完成终报并归档')] },
  ],
  reports: [
    { id: 'rep-1', code: 'RPT-2024-001', name: '集团并表风险监测月报', institution: '国际AMC', type: '风险监测报表', frequency: '月度', latestReportDate: '2024-06-30', latestSubmitDate: '2024-07-03', status: '已报送', description: '汇总当月集团并表风险监测指标。', submissions: [{ id: 'sub-1', serial: 'SUB-20240703-001', reportDate: '2024-06-30', submitDate: '2024-07-03', submitTime: '14:20:11', submitter: '王五', note: '按期报送', files: [] }, { id: 'sub-2', serial: 'SUB-20240604-001', reportDate: '2024-05-31', submitDate: '2024-06-04', submitTime: '16:08:22', submitter: '王五', note: '按期报送', files: [] }], logs: [createLog('报送', '机构完成最新一期风险监测月报报送')] },
    { id: 'rep-2', code: 'RPT-2024-002', name: '重大风险事项清单', institution: '浦发银行', type: '监管报表', frequency: '季度', latestReportDate: '2024-06-30', latestSubmitDate: '2024-07-05', status: '已报送', description: '重大风险事件及风险处置情况。', submissions: [{ id: 'sub-3', serial: 'SUB-20240705-001', reportDate: '2024-06-30', submitDate: '2024-07-05', submitTime: '09:35:42', submitter: '赵六', note: '季度报送', files: [] }], logs: [createLog('报送', '完成季度监管报表报送')] },
  ],
  periodicReports: [
    { id: 'pr-1', name: '2024年二季度全面风险管理报告', institution: '国际AMC', type: '全面风险管理报告', reportDate: '2024-06-30', submitDate: '2024-07-08', cycle: '季度', overview: '报告二季度风险管理运行情况、预警处置及重大事项。', attachments: [], visibleInstitutions: ['集团本部', '国际AMC'], visibleDepartments: ['金融机构管理部', '风险管理部'], viewers: ['张三（集团管理层）'], pushMethod: '平台通知', status: '已提交', logs: [createLog('提交', '报告已按可见范围发布')] },
    { id: 'pr-2', name: '2024年6月风险监测快报', institution: '浦发银行', type: '风险监测报告', reportDate: '2024-06-30', submitDate: '2024-07-02', cycle: '月度', overview: '月度风险指标监测快报。', attachments: [], visibleInstitutions: ['集团本部'], visibleDepartments: ['金融机构管理部'], viewers: [], pushMethod: '邮件', status: '已提交', logs: [createLog('提交', '报告已提交')] },
  ],
  specialRisks: [
    { id: 'sr-1', name: '重点行业信用风险专项提示', types: ['信用风险', '集中度风险'], institutions: ['国际AMC', '申能财务', '东方证券'], institutionNotes: { 国际AMC: '关注大额客户风险暴露。', 申能财务: '强化融资端风险监测。', 东方证券: '关注行业集中度变化。' }, purpose: '针对重点行业风险变化开展专项排查，压实机构风险防控责任。', measures: '完善授信准入、存续期管理及风险预警阈值。', requirements: '请于反馈期内完成自检并提交风险点、整改措施及后续安排。', attachments: [], createdAt: '2024-06-10', updatedAt: '2024-06-18', status: '已下发', workOrders: [{ id: 'WO-2024-001', institution: '国际AMC', issuedAt: '2024-06-10', status: '已反馈', feedback: { contact: '王五', phone: '13800138000', understanding: '已组织学习并理解提示要求。', problems: '发现一项重点客户集中度偏高问题。', strategy: '增加授信限额监测频次。', other: '将纳入月度风险报告。', attachments: [], date: '2024-06-15' } }, { id: 'WO-2024-002', institution: '申能财务', issuedAt: '2024-06-10', status: '待反馈' }, { id: 'WO-2024-003', institution: '东方证券', issuedAt: '2024-06-10', status: '部分解除', feedback: { contact: '钱七', phone: '13700137000', understanding: '已完成专项自查。', problems: '个别行业敞口仍需跟踪。', strategy: '建立跟踪台账。', other: '', attachments: [], date: '2024-06-16' }, evaluation: { result: '部分解除', department: '金融机构管理部', summary: '主要风险已缓释，个别风险点继续跟踪。', date: '2024-06-17', attachments: [] } }], logs: [createLog('提交并下发', '已针对3家机构生成独立工单')] },
    { id: 'sr-2', name: '流动性风险季节性专项排查', types: ['流动性风险'], institutions: ['浦发银行', '上农商'], institutionNotes: { 浦发银行: '', 上农商: '' }, purpose: '关注季节性资金波动风险。', measures: '做好流动性储备与压力测试。', requirements: '提交排查结果及后续管理安排。', attachments: [], createdAt: '2024-05-22', updatedAt: '2024-06-03', status: '草稿', workOrders: [], logs: [createLog('保存草稿', '专项提示草稿已保存')] },
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
export const normalizeState = (source: DemoState): DemoState => {
  const state = structuredClone(source);
  state.riskPreferences.forEach(x => { x.institution = normalizeInstitution(x.institution, true); x.indicators.forEach(y => y.institution = normalizeInstitution(y.institution)); });
  state.warningRules.forEach(x => { x.institution = normalizeInstitution(x.institution); x.nodes.forEach(y => { if (y.light === '不亮灯') y.light = '绿灯（不预警）'; }); x.segments.forEach(y => { if (y.light === '不亮灯') y.light = '绿灯（不预警）'; }); });
  state.warningDisposals.forEach(x => x.institution = normalizeInstitution(x.institution));
  state.indicators.forEach(x => { x.institution = normalizeInstitution(x.institution); x.versions.forEach(y => y.institution = normalizeInstitution(y.institution)); });
  state.majorEvents.forEach(x => x.institution = normalizeInstitution(x.institution));
  state.reports.forEach(x => x.institution = normalizeInstitution(x.institution));
  state.periodicReports.forEach(x => { x.institution = normalizeInstitution(x.institution); x.visibleInstitutions = x.visibleInstitutions.map(y => normalizeInstitution(y)); });
  state.specialRisks.forEach(x => { x.institutions = x.institutions.flatMap(y => normalizeInstitution(y).split('、')); x.institutionNotes = Object.fromEntries(Object.entries(x.institutionNotes).map(([k, v]) => [normalizeInstitution(k), v])); x.workOrders.forEach(y => y.institution = normalizeInstitution(y.institution)); });
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
