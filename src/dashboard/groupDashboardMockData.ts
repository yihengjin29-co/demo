// DEMO MOCK DATA
// All values on the group/holding-company cockpit are illustrative and are not real business data.

export const businessOverview = [
  { label: '总资产', value: '12,650', unit: '亿元', yoy: '6.8%', mom: '2.1%', icon: '▱' },
  { label: '净资产', value: '4,980', unit: '亿元', yoy: '5.2%', mom: '1.3%', icon: '▥' },
  { label: '营业收入', value: '1,285', unit: '亿元', yoy: '8.6%', mom: '3.1%', icon: '¥' },
  { label: '净利润', value: '186', unit: '亿元', yoy: '12.4%', mom: '4.8%', icon: '↗' },
];

export const concentrationRisk = [
  { name: '客户A', group: 'XX集团', single: 45, consolidated: 118, institution: '浦发银行', warning: true },
  { name: '客户B', group: '项目集团B', single: 38, consolidated: 92, institution: '国泰海通', warning: false },
  { name: '客户C', group: '项目集团C', single: 30, consolidated: 74, institution: '沪农商银行', warning: false },
  { name: '客户D', group: '项目集团D', single: 25, consolidated: 61, institution: '国际申信', warning: false },
  { name: '客户E', group: '项目集团E', single: 21, consolidated: 48, institution: '浦发银行', warning: false },
];

export type RiskScope = '集团' | '国际申信' | '国泰海通' | '浦发银行' | '沪农商银行';
export type RiskKind = 'financial' | 'nonFinancial';

type RiskSlice = {
  axes: string[];
  red: number[];
  yellow: number[];
  redDelta: number;
  yellowDelta: number;
  trendRed: number[];
  trendYellow: number[];
};

const risk = (axes: string[], red: number[], yellow: number[], redDelta: number, yellowDelta: number, trendRed: number[], trendYellow: number[]): RiskSlice => ({
  axes, red, yellow, redDelta, yellowDelta, trendRed, trendYellow,
});

const financialAxes = ['资本', '流动性', '资产质量', '盈利', '杠杆'];
const nonFinancialAxes = ['市场', '信用', '操作', '合规', '声誉', '战略'];

export const riskWarningByScope: Record<RiskScope, Record<RiskKind, RiskSlice>> = {
  集团: {
    financial: risk(financialAxes, [3, 2, 2, 4, 3], [5, 4, 4, 6, 5], 1, -2, [8, 9, 10, 11, 13, 14], [17, 19, 21, 23, 25, 24]),
    nonFinancial: risk(nonFinancialAxes, [2, 3, 1, 2, 1, 1], [4, 5, 3, 4, 2, 3], 0, 1, [6, 7, 7, 8, 8, 10], [13, 14, 15, 16, 17, 21]),
  },
  国际申信: {
    financial: risk(financialAxes, [1, 1, 0, 2, 1], [2, 2, 1, 3, 2], 1, 0, [2, 3, 3, 4, 4, 5], [6, 7, 8, 9, 10, 10]),
    nonFinancial: risk(nonFinancialAxes, [1, 1, 0, 0, 1, 0], [2, 2, 1, 2, 1, 1], 0, -1, [2, 2, 3, 3, 3, 3], [7, 8, 8, 9, 9, 9]),
  },
  国泰海通: {
    financial: risk(financialAxes, [1, 2, 1, 1, 1], [3, 3, 2, 3, 2], 0, 1, [4, 4, 5, 5, 6, 6], [9, 10, 11, 12, 12, 13]),
    nonFinancial: risk(nonFinancialAxes, [1, 1, 1, 1, 0, 1], [2, 3, 2, 2, 1, 2], 1, 0, [2, 3, 3, 3, 4, 5], [7, 8, 9, 10, 10, 12]),
  },
  浦发银行: {
    financial: risk(financialAxes, [2, 1, 2, 2, 1], [4, 2, 3, 4, 3], 1, -1, [5, 5, 6, 7, 7, 8], [13, 14, 15, 17, 17, 16]),
    nonFinancial: risk(nonFinancialAxes, [1, 2, 1, 2, 0, 1], [3, 3, 2, 3, 2, 2], 0, 1, [4, 4, 5, 5, 6, 7], [9, 10, 11, 12, 12, 15]),
  },
  沪农商银行: {
    financial: risk(financialAxes, [1, 1, 1, 1, 2], [2, 2, 3, 2, 4], -1, -1, [7, 7, 7, 6, 6, 6], [15, 15, 14, 14, 14, 13]),
    nonFinancial: risk(nonFinancialAxes, [1, 1, 2, 1, 1, 0], [2, 2, 3, 2, 2, 1], 0, -1, [5, 6, 6, 6, 6, 6], [12, 13, 13, 12, 12, 12]),
  },
};

export const riskScopes = Object.keys(riskWarningByScope) as RiskScope[];
export const trendMonths = ['03', '04', '05', '06', '07', '08'];

export const capitalMetrics = [
  { label: '合格资本覆盖率', value: '138.40%', change: '▲ 6.2个百分点', tone: 'up', trend: [126, 132, 139, 128, 140, 146, 151, 158, 154, 163, 170, 178] },
  { label: '资产覆盖率', value: '28.60%', change: '▲ 1.8个百分点', tone: 'up', trend: [21, 23, 25, 22, 26, 24, 27, 30, 33, 31, 35, 38] },
  { label: '财务杠杆率', value: '16.00%', change: '▼ 0.5个百分点', tone: 'down', trend: [20, 21, 19, 20, 18, 19, 17, 18, 16, 17, 16.5, 16] },
];

export const institutionEquity = [
  { name: '浦发银行', relation: '参股', ratio: '12.3%', type: '银行', totalAssets: '90,620亿', netAssets: '7,315亿', revenue: '1,736亿', profit: '452亿', children: ['浦发金融租赁', '浦银基金', '浦发海外'], remaining: 12 },
  { name: '沪农商银行', relation: '参股', ratio: '8.45%', type: '银行', totalAssets: '14,780亿', netAssets: '1,250亿', revenue: '286亿', profit: '116亿', children: ['沪农商村镇银行', '长三角业务中心', '金融市场业务中心'], remaining: 8 },
  { name: '国泰海通', relation: '控股', ratio: '32.5%', type: '证券', totalAssets: '9,238亿', netAssets: '1,742亿', revenue: '428亿', profit: '96亿', children: ['海通资管', '海通期货', '海通国际'], remaining: 18 },
  { name: '国际申信', relation: '控股', ratio: '36.5%', type: '金融组织', totalAssets: '1,268亿', netAssets: '286亿', revenue: '76亿', profit: '18亿', children: ['申信资产管理', '特殊机会投资', '境外SPV'], remaining: 15 },
];

export type InstitutionPenetrationMetric = {
  id: string;
  name: string;
  value: string;
  unit: string;
  change: string;
  tone: 'up' | 'down' | 'warn' | 'flat';
};

export type InstitutionPenetrationItem = {
  id: 'spdb' | 'srcb' | 'ht' | 'amc';
  name: string;
  shortName: string;
  equityRatio: string;
  stockPrice: string;
  marketValue: string;
  metrics: InstitutionPenetrationMetric[];
};

// Market and indicator values are synthetic fixtures. Indicator IDs mirror the risk-board pool.
export const institutionPenetration: InstitutionPenetrationItem[] = [
  {
    id: 'spdb', name: '浦发银行', shortName: '浦发', equityRatio: '12.3%', stockPrice: '¥9.86', marketValue: '¥2,892亿',
    metrics: [
      { id: 'p-cap', name: '资本充足率', value: '14.80', unit: '%', change: '▲ 0.20pct', tone: 'up' },
      { id: 'p-npl', name: '不良贷款率', value: '1.67', unit: '%', change: '▼ 0.03pct', tone: 'down' },
    ],
  },
  {
    id: 'srcb', name: '沪农商银行', shortName: '沪农商银行', equityRatio: '8.45%', stockPrice: '¥6.88', marketValue: '¥663亿',
    metrics: [
      { id: 's-cap', name: '资本充足率', value: '14.18', unit: '%', change: '▲ 0.16pct', tone: 'up' },
      { id: 's-npl', name: '不良贷款率', value: '0.97', unit: '%', change: '▼ 0.03pct', tone: 'down' },
    ],
  },
  {
    id: 'ht', name: '国泰海通', shortName: '国泰海通', equityRatio: '32.5%', stockPrice: '¥16.42', marketValue: '¥5,328亿',
    metrics: [
      { id: 'h-netcapital', name: '净资本', value: '1,284', unit: '亿元', change: '▲ 42亿元', tone: 'up' },
      { id: 'h-cap', name: '风险覆盖率', value: '186.50', unit: '%', change: '▲ 4.20pct', tone: 'up' },
    ],
  },
  {
    id: 'amc', name: '国际申信', shortName: '国际申信', equityRatio: '36.5%', stockPrice: '非上市', marketValue: '—',
    metrics: [
      { id: 'a-credit', name: '项目逾期率', value: '8.40', unit: '%', change: '▲ 0.40pct', tone: 'warn' },
      { id: 'a-liq', name: '现金短债比', value: '1.08', unit: '倍', change: '▲ 0.05倍', tone: 'up' },
    ],
  },
];

export const eventMonitor = [
  { name: '重大风险事件', value: 6, delta: '▲ 3', tone: 'red', icon: '!' },
  { name: '重大舆情事件', value: 11, delta: '▲ 2', tone: 'blue', icon: '▤' },
  { name: '司法诉讼', value: 4, delta: '— 0', tone: 'purple', icon: '◆' },
  { name: '监管合规事件', value: 9, delta: '▲ 1', tone: 'yellow', icon: '✦' },
];

// Consolidated contributions, not the institutions' standalone balance sheets.
// These illustrative allocations reconcile to the existing group overview / financial-warning totals.
export const institutionImpactGroupTotals = {
  totalAssets: Number(businessOverview[0].value.replace(/,/g, '')),
  netAssets: Number(businessOverview[1].value.replace(/,/g, '')),
  revenue: Number(businessOverview[2].value.replace(/,/g, '')),
  profit: Number(businessOverview[3].value.replace(/,/g, '')),
  riskExposure: 1168,
  concentrationExposure: 246.4,
  redWarningIndicatorCount: riskWarningByScope.集团.financial.red.reduce((sum, value) => sum + value, 0),
  yellowWarningIndicatorCount: riskWarningByScope.集团.financial.yellow.reduce((sum, value) => sum + value, 0),
  majorRiskEventCount: eventMonitor[0].value,
};

const groupShare = (value: number, groupTotal: number) => groupTotal > 0 ? Math.round(value / groupTotal * 1000) / 10 : 0;
function institutionImpactData(name: string, operation: [number, number, number, number], riskImpact: [number, number, number, number, number]) {
  const institution = institutionEquity.find(item => item.name === name)!;
  const [totalAssets, netAssets, revenue, profit] = operation;
  const [riskExposure, concentrationExposure, redWarningIndicatorCount, yellowWarningIndicatorCount, majorRiskEventCount] = riskImpact;
  const group = institutionImpactGroupTotals;
  return {
    institutionName: name, institutionType: institution.type,
    equityRelation: institution.relation, equityRatio: parseFloat(institution.ratio),
    operationContribution: {
      totalAssets, totalAssetsGroupShare: groupShare(totalAssets, group.totalAssets),
      netAssets, netAssetsGroupShare: groupShare(netAssets, group.netAssets),
      revenue, revenueGroupShare: groupShare(revenue, group.revenue),
      profit, profitGroupShare: groupShare(profit, group.profit),
    },
    riskImpact: {
      riskExposure, riskExposureGroupShare: groupShare(riskExposure, group.riskExposure),
      concentrationExposure, concentrationExposureGroupShare: groupShare(concentrationExposure, group.concentrationExposure),
      redWarningIndicatorCount, redWarningIndicatorGroupShare: groupShare(redWarningIndicatorCount, group.redWarningIndicatorCount),
      yellowWarningIndicatorCount, yellowWarningIndicatorGroupShare: groupShare(yellowWarningIndicatorCount, group.yellowWarningIndicatorCount),
      majorRiskEventCount,
    },
  };
}

export const institutionImpacts = [
  institutionImpactData('浦发银行', [4950, 1950, 550, 78], [430, 78, 5, 8, 2]),
  institutionImpactData('沪农商银行', [2432, 944, 269, 28], [213, 28.4, 3, 4, 1]),
  institutionImpactData('国泰海通', [4000, 1800, 390, 62], [310, 72, 4, 7, 2]),
  institutionImpactData('国际申信', [1268, 286, 76, 18], [215, 68, 2, 5, 1]),
];

export const investmentSummary = {
  total: '271.0',
  unit: '亿元',
  topTenRatio: '68.4%',
  dimensions: {
    // Top ten projects account for 185.4 / 271.0 = 68.4% (rounded).
    // Include the remainder so every segment uses total investment as its denominator.
    project: [
      { label: '项目A', amount: 32.0, color: '#3ddcff' },
      { label: '项目B', amount: 28.0, color: '#559cff' },
      { label: '项目C', amount: 24.0, color: '#697cff' },
      { label: '项目D', amount: 21.0, color: '#a78bfa' },
      { label: '项目E', amount: 18.0, color: '#ed91dc' },
      { label: '项目F', amount: 16.0, color: '#ff6b78' },
      { label: '项目G', amount: 14.0, color: '#ffac66' },
      { label: '项目H', amount: 12.0, color: '#ffd166' },
      { label: '项目I', amount: 11.0, color: '#9fd86d' },
      { label: '项目J', amount: 9.4, color: '#54d3b0' },
      { label: '其他项目', amount: 85.6, color: '#42617e' },
    ],
    type: [
      { label: '现金存款', amount: 41.9, color: '#3ddcff' },
      { label: '债券', amount: 66.8, color: '#ffd166' },
      { label: '股票', amount: 18.4, color: '#f3a53f' },
      { label: '公募基金', amount: 25.9, color: '#ff6b78' },
      { label: '私募基金', amount: 39.6, color: '#ffcf45' },
      { label: '衍生品', amount: 28.7, color: '#6ca8ff' },
      { label: '股指期货', amount: 41.8, color: '#697cff' },
      { label: '其他', amount: 7.9, color: '#54d3b0' },
    ],
    industry: [
      { label: '金融服务', amount: 72.4, color: '#3ddcff' },
      { label: '基础设施', amount: 55.8, color: '#697cff' },
      { label: '先进制造', amount: 43.6, color: '#ffd166' },
      { label: '城市更新', amount: 37.2, color: '#ff6b78' },
      { label: '绿色能源', amount: 34.9, color: '#54d3b0' },
      { label: '其他行业', amount: 27.1, color: '#a78bfa' },
    ],
    region: [
      { label: '上海', amount: 102.8, color: '#3ddcff' },
      { label: '长三角', amount: 69.4, color: '#697cff' },
      { label: '京津冀', amount: 35.7, color: '#ffd166' },
      { label: '粤港澳', amount: 31.6, color: '#ff6b78' },
      { label: '其他地区', amount: 31.5, color: '#54d3b0' },
    ],
  },
};
