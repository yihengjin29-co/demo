import type { DemoState, RiskPreference, Role } from '../types';
import { createLog, uid } from './storage';
import { riskPreferenceWorkflow, workflowService } from './workflowService';

export const riskPreferenceService = {
  create(state: DemoState, value: Partial<RiskPreference>, operator: Role) {
    const item: RiskPreference = { id: uid('rp'), code: `RP-${new Date().getFullYear()}-${String(state.riskPreferences.length + 1).padStart(3, '0')}`, name: value.name || '未命名风险偏好方案', institution: value.institution || '上海农商银行、国际申信、浦发银行、国泰海通、中国太平洋保险', effectiveDate: value.effectiveDate || '', expiryDate: value.expiryDate || '', status: '待提交', department: value.department || '', summary: value.summary || '', statement: value.statement || '', basis: value.basis || '', indicators: value.indicators || [], attachments: value.attachments || [], logs: [createLog('保存草稿', '创建风险偏好方案', operator)], workflow: { currentNodeId: 'rp-prepare', records: [] } };
    workflowService.append(item.workflow!, riskPreferenceWorkflow[0], { role: operator, action: '保存方案草稿', result: '草稿已保存', formData: { 方案说明: item.summary, 风险偏好陈述: item.statement, 编制依据: item.basis }, attachments: item.attachments });
    state.riskPreferences.unshift(item);
    return item;
  },
  update(item: RiskPreference, patch: Partial<RiskPreference>, action: string, content: string, operator: Role) {
    Object.assign(item, patch, { logs: [...item.logs, createLog(action, content, operator)] });
    item.workflow ||= { currentNodeId: 'rp-prepare', records: [] };
    workflowService.append(item.workflow, riskPreferenceWorkflow[0], { role: operator, action, result: action.includes('提交') ? '已提交' : '已保存', formData: { 方案说明: patch.summary || item.summary, 风险偏好陈述: patch.statement || item.statement, 编制依据: patch.basis || item.basis }, attachments: patch.attachments || item.attachments });
    if (action.includes('提交')) item.workflow.currentNodeId = 'rp-review';
  },
};
