import type { Attachment, Role, WorkflowInstance, WorkflowNodeRecord } from '../types';
import { uid } from './storage';

export type WorkflowDefinitionNode = { id: string; name: string; role: Role; department: string };

export const warningDisposalWorkflow: WorkflowDefinitionNode[] = [
  { id: 'reason-fill', name: '原因分析填写', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'reason-review', name: '原因分析审核', role: '金控公司', department: '金控风险管理部' },
  { id: 'plan-fill', name: '处置方案填写', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'plan-review', name: '处置方案审核', role: '金控公司', department: '金控风险管理部' },
  { id: 'management-coordination', name: '管理协同或意见反馈', role: '集团', department: '金融机构管理部' },
  { id: 'execution', name: '执行进展反馈', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'tracking-release', name: '跟踪确认及解除', role: '金控公司', department: '金控风险管理部' },
];

export const majorEventWorkflow: WorkflowDefinitionNode[] = [
  { id: 'event-create', name: '金融机构新建事件', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'first-report', name: '金融机构提交首报及处置方案', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'verify-report', name: '金融机构管理部门核实并组织汇报', role: '集团', department: '金融机构管理部' },
  { id: 'management-review', name: '管理层审阅事件方案', role: '集团', department: '集团管理层' },
  { id: 'board-review', name: '董事会审阅事件方案', role: '集团', department: '集团董事会' },
  { id: 'event-execution', name: '金融机构执行处置并跟踪', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'final-archive', name: '终报归档或常态跟踪', role: '各金融机构', department: '机构风险管理部门' },
];

export const specialRiskWorkflow: WorkflowDefinitionNode[] = [
  { id: 'special-issued', name: '专项风险提示', role: '金控公司', department: '金控风险管理部' },
  { id: 'special-feedback', name: '机构首次反馈', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'special-evaluate', name: '管理评估意见', role: '集团', department: '金融机构管理部' },
  { id: 'special-track', name: '跟踪反馈', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'special-release', name: '解除意见及管理报告', role: '集团', department: '金融机构管理部' },
];

export const riskPreferenceWorkflow: WorkflowDefinitionNode[] = [
  { id: 'rp-prepare', name: '方案编制与提交', role: '金控公司', department: '金控风险管理部' },
  { id: 'rp-review', name: '方案审核与重检', role: '集团', department: '金融机构管理部' },
  { id: 'rp-effective', name: '管理层审阅及发布', role: '集团', department: '集团管理层' },
];

const now = () => new Date().toLocaleString('zh-CN', { hour12: false });

export const workflowService = {
  append(instance: WorkflowInstance, node: WorkflowDefinitionNode, value: { role: Role; handler?: string; action: string; result: string; formData: Record<string, string>; opinion?: string; returnReason?: string; attachments?: Attachment[]; status?: WorkflowNodeRecord['status'] }) {
    const iteration = instance.records.filter(record => record.nodeId === node.id).length + 1;
    const record: WorkflowNodeRecord = {
      id: uid('workflow'), nodeId: node.id, nodeName: node.name, department: node.department, role: value.role,
      handler: value.handler || value.role, action: value.action, result: value.result, submittedAt: now(),
      formData: value.formData, opinion: value.opinion, returnReason: value.returnReason,
      attachments: value.attachments || [], status: value.status || (value.returnReason ? '已退回' : '已完成'), iteration,
    };
    instance.records.push(record);
    return record;
  },
  moveNext(instance: WorkflowInstance, definition: WorkflowDefinitionNode[], nodeId: string) {
    const index = definition.findIndex(node => node.id === nodeId);
    instance.currentNodeId = definition[Math.min(index + 1, definition.length - 1)]?.id || nodeId;
  },
  returnTo(instance: WorkflowInstance, nodeId: string) { instance.currentNodeId = nodeId; },
};
