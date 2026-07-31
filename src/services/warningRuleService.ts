import type { DemoState, WarningRule } from '../types';
import { createLog, uid } from './storage';
export const warningRuleService = {
  update(item: WarningRule, patch: Partial<WarningRule>, action: string, content: string, operator: string) { Object.assign(item, patch, { logs: [...item.logs, createLog(action, content, operator)] }); },
  create(state: DemoState, operator: string) { const item: WarningRule = { id: uid('wr'), code: `RW-${new Date().getFullYear()}-${String(state.warningRules.length + 1).padStart(3, '0')}`, indicator: '请选择指标', riskType: '信用风险', institution: '上海农商银行', frequency: '月度', ruleType: '阈值预警', yellow: '待配置', red: '待配置', effectiveDate: '', status: '未生效', nodes: [], segments: [], pushMethods: [], submitter: operator, logs: [createLog('新建', '创建预警规则', operator)] }; state.warningRules.unshift(item); return item; }
};
