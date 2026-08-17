import type { DemoState, Role, SpecialRisk } from '../types';
import { createLog, uid } from './storage';
import { specialRiskWorkflow, workflowService } from './workflowService';

export const specialRiskService = {
  publish(item: SpecialRisk, operator: Role) {
    item.status = '已下发';
    item.updatedAt = new Date().toISOString().slice(0, 10);
    item.letterNo ||= `ZXFX-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    item.workOrders = item.institutions.map((institution, index) => {
      const workflow = { currentNodeId: 'special-feedback', records: [] };
      workflowService.append(workflow, specialRiskWorkflow[0], { role: '金控公司', handler: operator, action: '下发专项风险提示函', result: '已下发专项风险提示函', formData: { 提示背景与目的: item.purpose, 管理措施与建议: item.measures, 反馈要求: item.requirements }, attachments: item.attachments });
      return { id: `${item.letterNo}-${String(index + 1).padStart(2, '0')}`, institution, issuedAt: item.updatedAt, status: '已下发专项风险提示函' as const, workflow };
    });
    item.logs.push(createLog('提交并下发', `专项风险提示函已下发至 ${item.workOrders.length} 家机构`, operator));
  },
  create(state: DemoState, value: Partial<SpecialRisk>, operator: string) {
    const item: SpecialRisk = { id: uid('sr'), letterNo: value.letterNo, name: value.name || '未命名专项风险提示', types: value.types || [], institutions: value.institutions || [], institutionNotes: value.institutionNotes || {}, purpose: value.purpose || '', measures: value.measures || '', requirements: value.requirements || '', attachments: value.attachments || [], createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10), status: '草稿', workOrders: [], logs: [createLog('保存草稿', '创建专项风险提示草稿', operator)] };
    state.specialRisks.unshift(item);
    return item;
  },
};
