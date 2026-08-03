import type { IndicatorPeriodRecord } from '../types';

export type MonitoringFrequency = IndicatorPeriodRecord['monitoringFrequency'];
export type LightStatus = IndicatorPeriodRecord['currentLightStatus'];

const latestKey = (record: IndicatorPeriodRecord) => `${record.indicatorId}::${record.institution}`;
const numericValue = (value?: string) => {
  const parsed = Number(String(value || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

export const inferIndicatorUnit = (name: string, value?: string) => {
  if (value?.includes('亿元')) return '亿元';
  if (value?.includes('万元')) return '万元';
  if (value?.includes('次')) return '次';
  if (value?.includes('%') || /率|比例|集中度|充足率/.test(name)) return '%';
  if (/数量|次数|事件/.test(name)) return '次';
  if (/余额|金额|资产|利润/.test(name)) return '亿元';
  return '数值';
};

export const formatIndicatorValue = (value: string | undefined, unit: string) => {
  const number = numericValue(value);
  const safeNumber = number ?? 0;
  if (unit === '%') return `${safeNumber.toFixed(2)}%`;
  if (unit === '亿元') return `${safeNumber.toFixed(2)}亿元`;
  if (unit === '万元') return `${safeNumber.toFixed(2)}万元`;
  if (unit === '次') return `${Math.round(safeNumber)}次`;
  return String(safeNumber);
};

const defaultRulesForIndicator = (name: string) => {
  if (/不良|逾期/.test(name)) return { yellowRule: '≥2.00%', redRule: '≥5.00%' };
  if (/流动性覆盖率/.test(name)) return { yellowRule: '<120.00%', redRule: '<100.00%' };
  if (/净稳定资金率/.test(name)) return { yellowRule: '<100.00%', redRule: '<90.00%' };
  if (/资本充足率|偿付能力充足率|备付率/.test(name)) return { yellowRule: '<12.00%', redRule: '<10.50%' };
  if (/集中度/.test(name)) return { yellowRule: '10.00%≤指标值<15.00%', redRule: '≥15.00%' };
  if (/事件.*数量|数量/.test(name)) return { yellowRule: '≥3次', redRule: '≥5次' };
  return { yellowRule: '≥80.00', redRule: '≥100.00' };
};

const evaluateRule = (rule: string, value: number) => {
  const compact = rule.replace(/\s/g, '');
  const range = compact.match(/(-?\d+(?:\.\d+)?)%?≤指标值<(-?\d+(?:\.\d+)?)%?/);
  if (range) return value >= Number(range[1]) && value < Number(range[2]);
  const threshold = numericValue(compact);
  if (threshold === null) return false;
  if (compact.startsWith('≥')) return value >= threshold;
  if (compact.startsWith('>')) return value > threshold;
  if (compact.startsWith('≤')) return value <= threshold;
  if (compact.startsWith('<')) return value < threshold;
  return false;
};

const rulesHaveValidSeverity = (yellowRule: string, redRule: string) => {
  const yellow = numericValue(yellowRule);
  const red = numericValue(redRule);
  if (yellow === null || red === null) return false;
  if (/≤指标值</.test(yellowRule) && /^[≥>]/.test(redRule)) return red >= yellow;
  if (/^[≥>]/.test(yellowRule) && /^[≥>]/.test(redRule)) return red >= yellow;
  if (/^[≤<]/.test(yellowRule) && /^[≤<]/.test(redRule)) return red <= yellow;
  return false;
};

export const normalizeIndicatorRules = (record: Pick<IndicatorPeriodRecord, 'indicatorName' | 'yellowRule' | 'redRule'>) => {
  const defaults = defaultRulesForIndicator(record.indicatorName);
  const yellowRule = record.yellowRule?.trim();
  const redRule = record.redRule?.trim();
  if (!yellowRule || !redRule || /待配置|暂无/.test(`${yellowRule}${redRule}`) || !rulesHaveValidSeverity(yellowRule, redRule)) return defaults;
  return { yellowRule, redRule };
};

export const evaluateIndicatorLightStatus = (record: Pick<IndicatorPeriodRecord, 'indicatorValue' | 'indicatorName' | 'yellowRule' | 'redRule'>): LightStatus => {
  const value = numericValue(record.indicatorValue);
  if (value === null) return '绿灯';
  const rules = normalizeIndicatorRules(record);
  if (evaluateRule(rules.redRule, value)) return '红灯';
  if (evaluateRule(rules.yellowRule, value)) return '黄灯';
  return '绿灯';
};

export const validateIndicatorLightConsistency = (record: IndicatorPeriodRecord) => evaluateIndicatorLightStatus(record) === record.currentLightStatus;

export const validateIndicatorPeriodRecords = (records: IndicatorPeriodRecord[]) => {
  const seen = new Set<string>();
  return records.flatMap(record => {
    const issues: string[] = [];
    const key = `${record.indicatorId}::${record.institution}::${record.periodOrder}`;
    if (seen.has(key)) issues.push(`${key}:重复期次`);
    seen.add(key);
    if (!record.indicatorValue) issues.push(`${key}:缺少指标值`);
    if (!record.indicatorUnit) issues.push(`${key}:缺少指标单位`);
    if (!record.yellowRule || !record.redRule) issues.push(`${key}:缺少亮灯规则`);
    if (!validateIndicatorLightConsistency(record)) issues.push(`${key}:亮灯结果不一致`);
    if (record.institution.includes('、')) issues.push(`${key}:机构范围不唯一`);
    return issues;
  });
};

export const normalizeLightStatus = (value?: string): LightStatus => {
  if (value?.includes('红')) return '红灯';
  if (value?.includes('黄')) return '黄灯';
  return '绿灯';
};

export const normalizeMonitoringFrequency = (value?: string, period?: string): MonitoringFrequency => {
  const normalized = (value || '').replace('度', '').replace('发生即报', '不定期');
  if (['日', '周', '月', '季', '半年', '年', '不定期'].includes(normalized)) return normalized as MonitoringFrequency;
  if (/半年/.test(period || '')) return '半年';
  if (/季度|Q\d/i.test(period || '')) return '季';
  if (/周|W\d/i.test(period || '')) return '周';
  if (/\d{4}年$/.test(period || '')) return '年';
  if (/\d{4}年\d{1,2}月/.test(period || '')) return '月';
  if (/\d{4}-\d{2}-\d{2}/.test(period || '')) return '日';
  return '月';
};

export const getIndicatorHistoryRecords = (records: IndicatorPeriodRecord[], current: IndicatorPeriodRecord) => records
  .filter(record => record.indicatorId === current.indicatorId && record.institution === current.institution && record.periodOrder <= current.periodOrder)
  .sort((a, b) => b.periodOrder - a.periodOrder);

export const calculateLightSummaryForRecords = (records: IndicatorPeriodRecord[]) => ({
  red: records.filter(record => record.currentLightStatus === '红灯').length,
  yellow: records.filter(record => record.currentLightStatus === '黄灯').length,
  green: records.filter(record => record.currentLightStatus === '绿灯').length,
});

export const calculateCumulativeLightCounts = (records: IndicatorPeriodRecord[]) => records.map(record => {
  const summary = calculateLightSummaryForRecords(getIndicatorHistoryRecords(records, record));
  return { ...record, cumulativeRedCount: summary.red, cumulativeYellowCount: summary.yellow, cumulativeGreenCount: summary.green };
});

export const indicatorPeriodService = {
  latest(records: IndicatorPeriodRecord[]) {
    const latest = new Map<string, IndicatorPeriodRecord>();
    records.forEach(record => {
      const key = latestKey(record);
      const current = latest.get(key);
      if (!current || record.periodOrder > current.periodOrder) latest.set(key, record);
    });
    return [...latest.values()].sort((a, b) => b.periodOrder - a.periodOrder || a.indicatorCode.localeCompare(b.indicatorCode) || a.institution.localeCompare(b.institution));
  },
  history(records: IndicatorPeriodRecord[]) {
    return [...records].sort((a, b) => b.periodOrder - a.periodOrder || a.indicatorCode.localeCompare(b.indicatorCode) || a.institution.localeCompare(b.institution));
  },
};
