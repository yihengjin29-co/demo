import type { DemoState, RiskPreference } from '../types';
import { createLog, uid } from './storage';
export const riskPreferenceService = {
  create(state: DemoState, value: Partial<RiskPreference>, operator: string) { const item: RiskPreference = { id: uid('rp'), code: `RP-${new Date().getFullYear()}-${String(state.riskPreferences.length + 1).padStart(3, '0')}`, name: value.name || '未命名风险偏好方案', institution: value.institution || '上海农商银行、国际AMC、浦发银行、国泰海通、中国太平洋保险', effectiveDate: value.effectiveDate || '', expiryDate: value.expiryDate || '', status: '待提交', department: value.department || '', summary: value.summary || '', statement: value.statement || '', basis: value.basis || '', indicators: value.indicators || [], attachments: value.attachments || [], logs: [createLog('保存草稿', '创建风险偏好方案', operator)] }; state.riskPreferences.unshift(item); return item; },
  update(item: RiskPreference, patch: Partial<RiskPreference>, action: string, content: string, operator: string) { Object.assign(item, patch, { logs: [...item.logs, createLog(action, content, operator)] }); }
};
