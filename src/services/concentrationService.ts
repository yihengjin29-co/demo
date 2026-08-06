import type { ConcentrationBusinessDetail, ConcentrationCompositionItem, ConcentrationData, ConcentrationHistoryRecord, ConcentrationLightStatus, ConcentrationRecord, ConcentrationType, Role } from '../types';
import { currentInstitution } from './permissionService';

const DATA_KEY = 'concentration-monitoring-data-v4';
const CONFIG_KEY = 'concentration-display-config-v3';
export const concentrationInstitutions = ['国际AMC', '浦发银行', '国泰海通证券'];
export const concentrationTypes: ConcentrationType[] = ['singleCustomer', 'groupCustomer', 'industry', 'region'];
const defaultConcentrationTypes: ConcentrationType[] = ['groupCustomer', 'industry', 'region'];
export const concentrationTypeLabels: Record<ConcentrationType, string> = { singleCustomer: '单一客户集中度', groupCustomer: '单一集团客户集中度', industry: '行业集中度', region: '区域集中度' };
export const concentrationTypeSlugs: Record<ConcentrationType, string> = { singleCustomer: 'single-customer', groupCustomer: 'group-customer', industry: 'industry', region: 'region' };

const industrySpecs = [
  { name: '行业A', code: 'HY-A', region: '区域A', regionCode: 'QY-A', level: '管理区域' as const },
  { name: '行业B', code: 'HY-B', region: '区域B', regionCode: 'QY-B', level: '管理区域' as const },
  { name: '行业C', code: 'HY-C', region: '区域C', regionCode: 'QY-C', level: '管理区域' as const },
  { name: '行业D', code: 'HY-D', region: '区域D', regionCode: 'QY-D', level: '管理区域' as const },
];
const groupSpecs = [
  { id: 'gc-1', code: 'GC-001', name: '集团客户A', amounts: [40, 35, 25] },
  { id: 'gc-2', code: 'GC-002', name: '集团客户B', amounts: [32, 28, 20] },
  { id: 'gc-3', code: 'GC-003', name: '集团客户C', amounts: [24, 21, 15] },
  { id: 'gc-4', code: 'GC-004', name: '集团客户D', amounts: [16, 14, 10] },
];
const businessTypes = ['业务类型A', '业务类型B', '业务类型C', '业务类型D'];
const transactionWeights = Array.from({ length: 100 }, (_, index) => 100 - index);
const historyFactors = [0.72, 0.75, 0.78, 0.81, 0.84, 0.86, 0.89, 0.91, 0.93, 0.96, 0.98, 1];
const historyPeriods = ['2025年7月', '2025年8月', '2025年9月', '2025年10月', '2025年11月', '2025年12月', '2026年1月', '2026年2月', '2026年3月', '2026年4月', '2026年5月', '2026年6月'];

const round = (value: number) => Number(value.toFixed(2));
const getLightStatus = (rate: number, yellow: number, red: number): ConcentrationLightStatus => rate >= red ? 'red' : rate >= yellow ? 'yellow' : 'green';
const unique = (values: string[]) => [...new Set(values)];

const seedBusinessDetails = (): ConcentrationBusinessDetail[] => groupSpecs.flatMap((group, groupIndex) => concentrationInstitutions.flatMap((institution, institutionIndex) => {
  const institutionTotal = group.amounts[institutionIndex];
  const weightTotal = transactionWeights.reduce((sum, value) => sum + value, 0);
  const totalCents = Math.round(institutionTotal * 100); const distributableCents = totalCents - transactionWeights.length;
  const allocatedCents = transactionWeights.map(weight => 1 + Math.floor(distributableCents * weight / weightTotal));
  let remainder = totalCents - allocatedCents.reduce((sum, value) => sum + value, 0);
  for (let index = 0; remainder > 0; index = (index + 1) % allocatedCents.length, remainder--) allocatedCents[index] += 1;
  return transactionWeights.map((_, transactionIndex) => {
    const industry = industrySpecs[(institutionIndex + groupIndex + transactionIndex) % industrySpecs.length];
    const businessType = businessTypes[transactionIndex % businessTypes.length];
    const serial = (groupIndex * concentrationInstitutions.length + institutionIndex) * transactionWeights.length + transactionIndex + 1;
    const month = transactionIndex % 6 + 1; const day = (transactionIndex * 3 + institutionIndex + groupIndex) % 27 + 1;
    return {
      id: `cbd-${serial}`, businessNo: `JZD-2026-${String(serial).padStart(4, '0')}`, businessDate: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      customerName: `客户${String.fromCharCode(65 + groupIndex)}${transactionIndex % 5 + 1}`, groupCustomerName: group.name, institution, businessType,
      financingType: businessType, businessBalance: allocatedCents[transactionIndex] / 100, industry: industry.name, industryCode: industry.code, region: industry.region, regionLevel: industry.level,
      collateralRegion: `${industry.region}（演示采用业务所属地区）`, startDate: `2025-${String(transactionIndex % 6 + 7).padStart(2, '0')}-01`, maturityDate: `202${7 + groupIndex}-${String(transactionIndex % 6 + 1).padStart(2, '0')}-28`, included: true,
      period: '2026年6月', dataSource: `${institution}${['业务系统', '资产台账', '风险数据集'][transactionIndex % 3]}`,
    };
  });
}));

const aggregateComposition = (details: ConcentrationBusinessDetail[], key: (detail: ConcentrationBusinessDetail) => string, total: number, yellow: number, red: number): ConcentrationCompositionItem[] => {
  const balances = new Map<string, number>();
  details.forEach(detail => balances.set(key(detail), (balances.get(key(detail)) || 0) + detail.businessBalance));
  const entries = [...balances.entries()].sort((a, b) => b[1] - a[1]);
  let allocatedProportion = 0;
  return entries.map(([name, businessBalance], index) => {
    const rawProportion = total ? businessBalance / total * 100 : 0;
    const proportion = index === entries.length - 1 ? round(100 - allocatedProportion) : round(rawProportion);
    allocatedProportion = round(allocatedProportion + proportion);
    return { id: `composition-${index}-${name}`, name, businessBalance: round(businessBalance), proportion, lightStatus: getLightStatus(rawProportion, yellow, red) };
  });
};

const buildHistory = (balance: number, denominator: number, yellow: number, red: number): ConcentrationHistoryRecord[] => historyPeriods.map((period, index) => {
  const businessBalance = round(balance * historyFactors[index]);
  const concentrationRate = round(businessBalance / denominator * 100);
  return { period, businessBalance, denominatorValue: denominator, concentrationRate, lightStatus: getLightStatus(concentrationRate, yellow, red) };
});

const relatedWarning = (type: ConcentrationType, objectName: string) => {
  if ((type === 'singleCustomer' && objectName === '客户A1') || (type === 'groupCustomer' && objectName === groupSpecs[0].name) || (type === 'industry' && objectName === '行业A') || (type === 'region' && objectName === '区域A')) return 'wd-1';
  if ((type === 'singleCustomer' && objectName === '客户A2') || (type === 'groupCustomer' && objectName === groupSpecs[1].name) || (type === 'industry' && objectName === '行业B') || (type === 'region' && objectName === '区域B')) return 'wd-2';
  return undefined;
};

const buildRecord = (type: ConcentrationType, objectName: string, objectCode: string, details: ConcentrationBusinessDetail[], denominator: number, regionLevel?: ConcentrationRecord['regionLevel']): ConcentrationRecord => {
  const businessBalance = round(details.reduce((sum, detail) => sum + detail.businessBalance, 0));
  const yellowThreshold = type === 'singleCustomer' ? 8 : type === 'groupCustomer' ? 15 : 13;
  const redThreshold = type === 'singleCustomer' ? 12 : type === 'groupCustomer' ? 20 : 16;
  const concentrationRate = round(businessBalance / denominator * 100);
  const metricName = type === 'singleCustomer' ? '单一客户集中度' : type === 'groupCustomer' ? '单一集团客户投融资集中度' : type === 'industry' ? '行业集中度' : '区域集中度';
  const numeratorDescription = type === 'singleCustomer' ? '单一客户投融资余额跨机构汇总' : type === 'groupCustomer' ? '集团客户相关股权、债权等投融资余额跨机构汇总' : type === 'industry' ? '债务人对应国标一级行业业务余额汇总' : '抵质押物对应地区业务余额（演示采用业务所属地区）';
  return {
    id: `${type}-${objectCode}`, concentrationType: type, objectCode, objectName, metricName,
    metricFormula: `${type === 'singleCustomer' ? '单一客户投融资余额' : type === 'groupCustomer' ? '单一集团客户投融资余额' : type === 'industry' ? '国标一级行业业务余额' : '地区业务余额'} ÷ 净资产 × 100%`,
    numeratorDescription, denominatorType: '净资产', denominatorValue: denominator, concentrationRate, businessBalance,
    yellowRule: `集中度≥${yellowThreshold}%且<${redThreshold}%`, redRule: `集中度≥${redThreshold}%`, yellowThreshold, redThreshold,
    lightStatus: getLightStatus(concentrationRate, yellowThreshold, redThreshold), involvedInstitutionNames: unique(details.map(detail => detail.institution)),
    primaryBusinessTypes: unique(details.map(detail => detail.businessType)), primaryCustomerCount: unique(details.map(detail => detail.customerName)).length,
    period: '2026年6月', frequency: '月度', regionLevel,
    historicalRecords: buildHistory(businessBalance, denominator, yellowThreshold, redThreshold),
    compositionByInstitution: aggregateComposition(details, detail => detail.institution, businessBalance, yellowThreshold, redThreshold),
    compositionByBusinessType: aggregateComposition(details, detail => detail.businessType, businessBalance, yellowThreshold, redThreshold),
    compositionByCustomer: aggregateComposition(details, detail => detail.customerName, businessBalance, yellowThreshold, redThreshold),
    businessDetailIds: details.map(detail => detail.id), relatedWarningId: relatedWarning(type, objectName),
  };
};

const buildRecords = (details: ConcentrationBusinessDetail[], denominator: number): ConcentrationRecord[] => [
  ...unique(details.map(detail => detail.customerName)).map((customerName, index) => buildRecord('singleCustomer', customerName, `KH-${String(index + 1).padStart(3, '0')}`, details.filter(detail => detail.customerName === customerName), denominator)),
  ...groupSpecs.map(group => buildRecord('groupCustomer', group.name, group.code, details.filter(detail => detail.groupCustomerName === group.name), denominator)),
  ...industrySpecs.map(industry => buildRecord('industry', industry.name, industry.code, details.filter(detail => detail.industry === industry.name), denominator)),
  ...industrySpecs.map(region => buildRecord('region', region.region, region.regionCode, details.filter(detail => detail.region === region.region), denominator, region.level)),
].filter(record => record.businessDetailIds.length > 0);

export const seedConcentrationData = (): ConcentrationData => {
  const businessDetails = seedBusinessDetails();
  return { businessDetails, records: buildRecords(businessDetails, 500) };
};

export const loadConcentrationData = (): ConcentrationData => {
  try {
    const stored = localStorage.getItem(DATA_KEY);
    if (stored) {
      const data = JSON.parse(stored) as ConcentrationData;
      if (Array.isArray(data.records) && Array.isArray(data.businessDetails)) return data;
    }
  } catch { /* 使用安全演示数据 */ }
  const data = seedConcentrationData();
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  return data;
};

export const loadConcentrationDisplayConfig = (role: Role): ConcentrationType[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') as Partial<Record<Role, ConcentrationType[]>>;
    const values = stored[role]?.filter(type => concentrationTypes.includes(type));
    if (values?.length) return values;
  } catch { /* 使用默认顺序 */ }
  return [...defaultConcentrationTypes];
};

export const saveConcentrationDisplayConfig = (role: Role, types: ConcentrationType[]) => {
  if (!types.length) return false;
  let stored: Partial<Record<Role, ConcentrationType[]>> = {};
  try { stored = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch { stored = {}; }
  stored[role] = [...types];
  localStorage.setItem(CONFIG_KEY, JSON.stringify(stored));
  return true;
};

export const getConcentrationRecords = (data: ConcentrationData, type: ConcentrationType, role: Role, institution = '') => {
  const scopedInstitution = role === '各金融机构' ? currentInstitution : institution;
  if (!scopedInstitution) return data.records.filter(record => record.concentrationType === type).sort((a, b) => b.concentrationRate - a.concentrationRate);
  const scopedDetails = data.businessDetails.filter(detail => detail.institution === scopedInstitution);
  return buildRecords(scopedDetails, 200).filter(record => record.concentrationType === type).sort((a, b) => b.concentrationRate - a.concentrationRate);
};

export const getConsolidatedConcentrationRecords = (data: ConcentrationData, type: ConcentrationType) => data.records
  .filter(record => record.concentrationType === type)
  .sort((a, b) => b.concentrationRate - a.concentrationRate);

export type ConcentrationDetailFilters = { institution?: string; customer?: string; groupCustomer?: string; businessType?: string; industry?: string; region?: string; period?: string; included?: string; businessDateStart?: string; businessDateEnd?: string };
export const getConcentrationBusinessDetails = (data: ConcentrationData, role: Role, filters: ConcentrationDetailFilters = {}) => {
  const institution = role === '各金融机构' ? currentInstitution : filters.institution;
  return data.businessDetails.filter(detail => (!institution || detail.institution === institution)
    && (!filters.customer || detail.customerName.includes(filters.customer))
    && (!filters.groupCustomer || detail.groupCustomerName === filters.groupCustomer)
    && (!filters.businessType || detail.businessType === filters.businessType)
    && (!filters.industry || detail.industry === filters.industry)
    && (!filters.region || detail.region === filters.region)
    && (!filters.period || detail.period === filters.period)
    && (!filters.businessDateStart || detail.businessDate >= filters.businessDateStart)
    && (!filters.businessDateEnd || detail.businessDate <= filters.businessDateEnd)
    && (!filters.included || (filters.included === '是') === detail.included));
};

export const getConsolidatedConcentrationBusinessDetails = (data: ConcentrationData, filters: ConcentrationDetailFilters = {}) => data.businessDetails.filter(detail => (!filters.institution || detail.institution === filters.institution)
  && (!filters.customer || detail.customerName.includes(filters.customer))
  && (!filters.groupCustomer || detail.groupCustomerName === filters.groupCustomer)
  && (!filters.businessType || detail.businessType === filters.businessType)
  && (!filters.industry || detail.industry === filters.industry)
  && (!filters.region || detail.region === filters.region)
  && (!filters.period || detail.period === filters.period)
  && (!filters.businessDateStart || detail.businessDate >= filters.businessDateStart)
  && (!filters.businessDateEnd || detail.businessDate <= filters.businessDateEnd)
  && (!filters.included || (filters.included === '是') === detail.included));

export const recalculateConcentrationRecord = (record: ConcentrationRecord, details: ConcentrationBusinessDetail[]) => buildRecord(record.concentrationType, record.objectName, record.objectCode, details, record.denominatorValue, record.regionLevel);
export const getConcentrationTypeFromSlug = (slug: string): ConcentrationType | undefined => concentrationTypes.find(type => concentrationTypeSlugs[type] === slug);
export const concentrationLightLabels: Record<ConcentrationLightStatus, string> = { red: '红灯', yellow: '黄灯', green: '绿灯' };
