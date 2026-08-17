import type { Attachment, WorkflowActor, WorkflowInstance, WorkflowNodeRecord } from '../types';
import { uid } from './storage';

export type WorkflowDefinitionNode = { id: string; name: string; role: WorkflowActor; department: string };

export const yellowWarningWorkflow: WorkflowDefinitionNode[] = [
  { id: 'yellow-system-issued', name: '系统推送预警提示函', role: '系统', department: '系统自动处理' },
  { id: 'yellow-reason', name: '各金融机构填写原因分析答复', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'yellow-plan', name: '各金融机构提交应对处置方案', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'yellow-execution', name: '各金融机构持续跟进执行情况', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'yellow-release', name: '各金融机构发起解除预警评估', role: '各金融机构', department: '机构风险管理部门' },
];

export const redWarningWorkflow: WorkflowDefinitionNode[] = [
  { id: 'red-system-issued', name: '系统推送重大风险提示', role: '系统', department: '系统自动处理' },
  { id: 'red-reason', name: '各金融机构填写原因分析答复', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'red-plan', name: '各金融机构提交应对处置方案', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'red-group-assessment', name: '集团评估反馈', role: '集团', department: '集团管理部门' },
  { id: 'red-group-review', name: '集团审阅处置方案', role: '集团', department: '集团管理部门' },
  { id: 'red-execution', name: '金控公司持续跟进执行情况', role: '金控公司', department: '金控风险管理部' },
  { id: 'red-release', name: '金控公司解除预警评估', role: '金控公司', department: '金控风险管理部' },
];

// 保留旧导出名称，避免其他已有调用失效；新页面按灯号选择独立流程。
export const warningDisposalWorkflow = redWarningWorkflow;

export const majorEventWorkflow: WorkflowDefinitionNode[] = [
  { id: 'event-initial-report', name: '各金融机构提交事件首报', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'event-verify', name: '集团核实事件并组织汇报', role: '集团', department: '集团管理部门' },
  { id: 'event-plan', name: '各金融机构提交处置方案', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'event-plan-assessment', name: '集团评估并审阅处置方案', role: '集团', department: '集团管理部门' },
  { id: 'event-executive-review', name: '经理层、董事会审阅', role: '集团', department: '集团内部审阅' },
  { id: 'event-execution-report', name: '各金融机构执行处置并提交续报', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'event-holding-track', name: '金控公司持续跟踪及结束评估', role: '金控公司', department: '金控风险管理部' },
  { id: 'event-final-routine', name: '终报归档或转入常态化跟踪', role: '各金融机构', department: '机构风险管理部门 / 金控风险管理部' },
];

export const specialRiskWorkflow: WorkflowDefinitionNode[] = [
  { id: 'special-issued', name: '国资公司下发专项风险提示函', role: '金控公司', department: '金控风险管理部' },
  { id: 'special-feedback', name: '金融机构答复专项风险提示函', role: '各金融机构', department: '机构风险管理部门' },
  { id: 'special-review', name: '国资公司审阅答复函', role: '集团', department: '金融机构管理部' },
  { id: 'special-track', name: '金融机构后续跟踪反馈', role: '各金融机构', department: '机构风险管理部门' },
];

export const riskPreferenceWorkflow: WorkflowDefinitionNode[] = [
  { id: 'rp-prepare', name: '方案编制与提交', role: '金控公司', department: '金控风险管理部' },
  { id: 'rp-review', name: '方案审核与重检', role: '集团', department: '金融机构管理部' },
  { id: 'rp-effective', name: '管理层审阅及发布', role: '集团', department: '集团管理层' },
];

const now = () => new Date().toLocaleString('zh-CN', { hour12: false });

export const workflowService = {
  append(instance: WorkflowInstance, node: WorkflowDefinitionNode, value: { role: WorkflowActor; handler?: string; action: string; result: string; formData: Record<string, string>; opinion?: string; returnReason?: string; attachments?: Attachment[]; status?: WorkflowNodeRecord['status'] }) {
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
