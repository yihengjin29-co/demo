import type { Attachment, DemoState, Role, WarningDisposal, WarningDisposalMeasure } from '../types';
import { createLog, uid } from './storage';
import { redWarningWorkflow, workflowService, yellowWarningWorkflow } from './workflowService';
import type { WorkflowDefinitionNode } from './workflowService';
import { getWarningNodeDisplayName, isWarningLetterPending } from './warningConsistencyService';

export type WarningFormField = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'date' | 'select' | 'number';
  required?: boolean;
  maxLength?: number;
  options?: string[];
};

export const getWarningWorkflowByLightStatus = (level: WarningDisposal['level']): WorkflowDefinitionNode[] => level === '黄灯' ? yellowWarningWorkflow : redWarningWorkflow;
export const getWarningWorkflowSteps = (item: WarningDisposal) => getWarningWorkflowByLightStatus(item.level).map(node => ({ ...node, name: getWarningNodeDisplayName(item, node.id, node.name) }));
export const getWarningNoticeType = (level: WarningDisposal['level']) => level === '黄灯' ? '预警提示函' as const : '重大风险提示' as const;
export const getWarningLetterStatus = (mode: NonNullable<WarningDisposal['letterDeliveryMode']>) => mode === 'auto' ? '已下发' as const : mode === 'none' ? '不发函' as const : '待下发' as const;
export const canProceedAfterWarningLetter = (item: WarningDisposal) => !isWarningLetterPending(item);

export const getWarningNodeFormFields = (nodeId: string, role: Role): WarningFormField[] => {
  const commonReason: WarningFormField[] = [
    { name: '原因分析', label: '原因分析', type: 'textarea', required: true, maxLength: 1500 },
    { name: '影响情况', label: '影响情况', type: 'textarea', required: true, maxLength: 1500 },
  ];
  if (nodeId === 'yellow-reason') return [
    { name: '指标异常原因', label: '指标异常原因', type: 'textarea', required: true, maxLength: 1500 },
    { name: '形成原因', label: '形成原因', type: 'textarea', required: true, maxLength: 1500 },
    ...commonReason.slice(1),
    { name: '是否属于阶段性波动', label: '是否属于阶段性波动', type: 'select', required: true, options: ['是', '否'] },
    { name: '是否存在持续恶化趋势', label: '是否存在持续恶化趋势', type: 'select', required: true, options: ['否', '是'] },
    { name: '趋势判断', label: '趋势判断', type: 'select', required: true, options: ['阶段性波动', '可能持续', '尚待观察'] },
    { name: '相关情况说明', label: '相关情况说明', type: 'textarea', maxLength: 1500 },
  ];
  if (nodeId === 'red-reason') return [
    { name: '红灯触发原因', label: '红灯触发原因', type: 'textarea', required: true, maxLength: 1500 },
    { name: '风险形成过程', label: '风险形成过程', type: 'textarea', required: true, maxLength: 1500 },
    { name: '影响范围', label: '影响范围', type: 'textarea', required: true, maxLength: 1500 },
    { name: '影响程度', label: '影响程度', type: 'select', required: true, options: ['较大', '重大', '特别重大'] },
    { name: '发展趋势', label: '发展趋势', type: 'select', required: true, options: ['趋于稳定', '可能持续', '可能进一步恶化'] },
    { name: '是否涉及其他风险事项', label: '是否涉及其他风险事项', type: 'select', options: ['否', '是'] },
    { name: '是否可能进一步恶化', label: '是否可能进一步恶化', type: 'select', required: true, options: ['否', '是'] },
    { name: '补充说明', label: '补充说明', type: 'textarea', maxLength: 1500 },
  ];
  if (nodeId.endsWith('-plan')) return [
    { name: '风险控制目标', label: '风险控制目标', type: 'textarea', required: nodeId.startsWith('red-'), maxLength: 1000 },
    { name: '资源保障', label: '资源保障', type: 'textarea', required: nodeId.startsWith('red-'), maxLength: 1000 },
  ];
  if (nodeId === 'red-group-assessment') return [
    { name: '评估结论', label: '评估结论', type: 'select', required: true, options: ['评估通过', '补充材料', '退回修改'] },
    { name: '反馈意见', label: '反馈意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '管理要求', label: '管理要求', type: 'textarea', maxLength: 1500 },
    { name: '是否需要补充材料', label: '是否需要补充材料', type: 'select', options: ['否', '是'] },
    { name: '是否退回修改', label: '是否退回修改', type: 'select', options: ['否', '是'] },
    { name: '是否提交集团审阅', label: '是否提交集团审阅', type: 'select', options: ['是', '否'] },
    { name: '退回节点', label: '退回节点', type: 'select', options: ['原因分析答复', '应对处置方案'] },
  ];
  if (nodeId === 'red-group-review') return [
    { name: '审阅意见', label: '审阅意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '是否通过', label: '是否通过', type: 'select', required: true, options: ['是', '否'] },
    { name: '是否要求持续报告', label: '是否要求持续报告', type: 'select', options: ['是', '否'] },
    { name: '是否提出补充管理要求', label: '是否提出补充管理要求', type: 'select', options: ['否', '是'] },
    { name: '补充管理要求', label: '补充管理要求', type: 'textarea', maxLength: 1500 },
    { name: '后续报告频率', label: '后续报告频率', type: 'select', options: ['每周', '每月', '每季度', '按需'] },
    { name: '退回节点', label: '退回节点', type: 'select', options: ['应对处置方案', '集团评估反馈'] },
    { name: '备注', label: '备注', type: 'textarea', maxLength: 1000 },
  ];
  if (nodeId === 'red-execution' && role === '金控公司') return [
    { name: '跟踪意见', label: '跟踪意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '催办要求', label: '催办要求', type: 'textarea', maxLength: 1000 },
    { name: '协调情况', label: '协调情况', type: 'textarea', maxLength: 1000 },
    { name: '是否要求补充进展', label: '是否要求补充进展', type: 'select', options: ['否', '是'] },
    { name: '是否符合解除评估条件', label: '是否符合解除评估条件', type: 'select', options: ['否', '是'] },
  ];
  if (nodeId.endsWith('-execution')) return [
    { name: '更新日期', label: '更新日期', type: 'date', required: true },
    { name: '处置措施', label: '处置措施', type: 'textarea', required: true, maxLength: 1500 },
    { name: '当前执行进度', label: '当前执行进度', type: 'textarea', required: true, maxLength: 1500 },
    { name: '已完成事项', label: '已完成事项', type: 'textarea', maxLength: 1500 },
    { name: '尚未完成事项', label: '尚未完成事项', type: 'textarea', maxLength: 1500 },
    { name: '存在问题', label: '存在问题', type: 'textarea', maxLength: 1500 },
    { name: '下一步工作安排', label: '下一步工作安排', type: 'textarea', required: true, maxLength: 1500 },
    { name: '完成比例', label: '完成比例（%）', type: 'number', required: true },
    { name: '风险变化情况', label: '风险变化情况', type: 'textarea', maxLength: 1000 },
  ];
  if (nodeId.endsWith('-release')) return [
    { name: '当前指标值', label: '当前指标值', required: true },
    { name: '当前指标期次', label: '当前指标期次', required: true },
    { name: '当前亮灯情况', label: '当前亮灯情况', type: 'select', required: true, options: ['绿灯', '黄灯', '红灯'] },
    { name: '是否恢复绿灯', label: '是否恢复绿灯', type: 'select', required: true, options: ['是', '否'] },
    { name: '处置方案完成情况', label: '处置方案完成情况', type: 'textarea', required: true, maxLength: 1500 },
    { name: '风险是否得到有效控制', label: '风险是否得到有效控制', type: 'select', required: true, options: ['是', '否'] },
    { name: '遗留问题', label: '遗留问题', type: 'textarea', maxLength: 1000 },
    { name: nodeId === 'yellow-release' ? '解除预警说明' : '解除评估意见', label: nodeId === 'yellow-release' ? '解除预警说明' : '解除评估意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '预计解除日期', label: '预计解除日期', type: 'date' },
    ...(nodeId === 'red-release' ? [
      { name: '是否建议解除', label: '是否建议解除', type: 'select' as const, required: true, options: ['是', '否'] },
      { name: '是否转入常态化跟踪', label: '是否转入常态化跟踪', type: 'select' as const, options: ['否', '是'] },
    ] : []),
  ];
  return commonReason;
};

const uniqueAttachments = (current: Attachment[], next: Attachment[]) => [...current, ...next.filter(file => !current.some(existing => existing.id === file.id))];

const nextNodeId = (item: WarningDisposal, nodeId: string) => {
  const definition = getWarningWorkflowSteps(item);
  const index = definition.findIndex(node => node.id === nodeId);
  return definition[Math.min(index + 1, definition.length - 1)]?.id || nodeId;
};

const statusAfterSubmission = (nodeId: string, action: string) => {
  if (nodeId.endsWith('-reason')) return '处置方案编制中';
  if (nodeId === 'yellow-plan') return '执行跟踪中';
  if (nodeId === 'yellow-execution') return action === '发起解除评估' ? '待解除评估' : '执行跟踪中';
  if (nodeId === 'yellow-release') return '已解除';
  if (nodeId === 'red-plan') return '待集团评估';
  if (nodeId === 'red-group-assessment') return '待集团审阅';
  if (nodeId === 'red-group-review') return '执行跟踪中';
  if (nodeId === 'red-execution') return action === '发起解除评估' ? '待解除评估' : '执行跟踪中';
  if (nodeId === 'red-release') return action === '确认解除' ? '已解除' : action === '转入常态化跟踪' ? '常态化跟踪' : '执行跟踪中';
  return '待反馈';
};

export const warningDisposalService = {
  saveDraft(state: DemoState, id: string, nodeId: string, role: Role, formData: Record<string, string>, attachments: Attachment[], measures?: WarningDisposalMeasure[]) {
    const item = state.warningDisposals.find(candidate => candidate.id === id);
    if (!item || !canProceedAfterWarningLetter(item)) return false;
    item.drafts ||= {};
    item.drafts[nodeId] = { formData: { ...formData }, attachments: [...attachments], measures: measures ? structuredClone(measures) : undefined };
    item.logs.push(createLog('保存草稿', `${nodeId}：保存当前节点草稿；事项状态保持为${item.status}`, role));
    return true;
  },

  submitNode(state: DemoState, id: string, nodeId: string, role: Role, formData: Record<string, string>, attachments: Attachment[], action: string, measures?: WarningDisposalMeasure[]) {
    const item = state.warningDisposals.find(candidate => candidate.id === id);
    if (!item || !item.workflow || !canProceedAfterWarningLetter(item) || item.workflow.currentNodeId !== nodeId) return false;
    const definition = getWarningWorkflowSteps(item);
    const node = definition.find(candidate => candidate.id === nodeId);
    if (!node) return false;
    const previousStatus = item.status;
    const isReturn = action.includes('退回');
    const businessAction = nodeId.endsWith('-reason') && action === '提交' ? '提交原因分析'
      : nodeId.endsWith('-plan') && action === '提交' ? '提交处置方案'
        : nodeId.endsWith('-execution') && action === '提交进展' ? '更新执行进展'
          : nodeId === 'red-group-assessment' && isReturn ? '集团退回'
            : nodeId === 'red-group-assessment' ? '集团评估通过'
              : nodeId === 'red-group-review' && isReturn ? '集团审阅退回'
                : nodeId === 'red-group-review' ? '集团审阅通过'
                  : action;
    const result = isReturn ? '退回修改' : businessAction;
    workflowService.append(item.workflow, node, {
      role,
      action: businessAction,
      result,
      formData: { ...formData },
      opinion: formData['反馈意见'] || formData['审阅意见'] || formData['跟踪意见'] || formData['解除评估意见'] || formData['解除预警说明'],
      returnReason: isReturn ? formData['反馈意见'] || formData['审阅意见'] || formData['跟踪意见'] || '请补充完善后重新提交' : undefined,
      attachments,
      status: isReturn ? '已退回' : undefined,
    });

    if (nodeId.endsWith('-plan') && measures) item.disposalMeasures = measures.map(measure => ({ ...measure, submitted: true }));
    if (nodeId.endsWith('-execution') && role === '各金融机构' && (action.includes('进展') || action === '提交')) {
      item.executionProgressList ||= [];
      item.executionProgressList.push({
        id: uid('warning-progress'), updatedAt: formData['更新日期'] || new Date().toISOString().slice(0, 10),
        measure: formData['处置措施'] || '', currentProgress: formData['当前执行进度'] || '', completedItems: formData['已完成事项'] || '',
        incompleteItems: formData['尚未完成事项'] || '', problems: formData['存在问题'] || '', nextSteps: formData['下一步工作安排'] || '',
        completionRate: formData['完成比例'] || '', riskChange: formData['风险变化情况'], attachments: [...attachments], submitted: true,
      });
    }
    if (nodeId === 'red-group-assessment') item.groupAssessmentData = { ...formData };
    if (nodeId === 'red-group-review') item.groupReviewData = { ...formData };
    if (nodeId.endsWith('-release')) item.releaseEvaluationData = { ...formData };

    let targetNodeId = nextNodeId(item, nodeId);
    if (isReturn) {
      if (nodeId === 'red-group-assessment') targetNodeId = formData['退回节点'] === '原因分析答复' ? 'red-reason' : 'red-plan';
      else if (nodeId === 'red-group-review') targetNodeId = formData['退回节点'] === '集团评估反馈' ? 'red-group-assessment' : 'red-plan';
      else targetNodeId = nodeId;
    } else if (nodeId.endsWith('-execution') && !['发起解除评估'].includes(action)) {
      targetNodeId = nodeId;
    } else if (nodeId === 'red-release' && action === '继续跟踪') {
      targetNodeId = 'red-execution';
    }
    item.workflow.currentNodeId = targetNodeId;
    item.currentNode = targetNodeId;
    item.status = isReturn
      ? targetNodeId.endsWith('-reason') ? '原因分析中' : targetNodeId.endsWith('-plan') ? '处置方案编制中' : targetNodeId === 'red-group-assessment' ? '待集团评估' : '执行跟踪中'
      : statusAfterSubmission(nodeId, action);
    item.itemStatus = item.status;
    item.attachments = uniqueAttachments(item.attachments, attachments);
    if (item.drafts) delete item.drafts[nodeId];
    item.logs.push(createLog(businessAction, `${node.name}：${result}；事项状态由“${previousStatus}”变更为“${item.status}”`, role));
    if (attachments.length) item.logs.push(createLog('上传附件', `${node.name}上传附件：${attachments.map(file => file.name).join('、')}`, role));
    return true;
  },
};
