import type { WarningDisposal, WorkflowNodeRecord } from '../types';

const isSentAction = (action: string) => (/下发提示函|自动下发函件/.test(action) && !/待下发|生成/.test(action));

export const getWarningSystemNodeId = (item: Pick<WarningDisposal, 'level'>) => item.level === '黄灯' ? 'yellow-system-issued' : 'red-system-issued';
export const getWarningReasonNodeId = (item: Pick<WarningDisposal, 'level'>) => item.level === '黄灯' ? 'yellow-reason' : 'red-reason';
export const getWarningPlanNodeId = (item: Pick<WarningDisposal, 'level'>) => item.level === '黄灯' ? 'yellow-plan' : 'red-plan';
export const getPendingWarningLetterLabel = (item: Pick<WarningDisposal, 'level'>) => item.level === '黄灯' ? '待下发预警提示函' : '待下发重大风险提示';

export const hasWarningLetterSentEvidence = (item: Pick<WarningDisposal, 'letterSentAt' | 'letterSentBy' | 'logs'>) =>
  Boolean(item.letterSentAt || item.letterSentBy || item.logs?.some(log => isSentAction(log.action)));

export const isWarningLetterPending = (item: Pick<WarningDisposal, 'letterDeliveryMode' | 'letterSentAt' | 'letterSentBy' | 'logs'>) =>
  item.letterDeliveryMode === 'manual' && !hasWarningLetterSentEvidence(item);

const isCompleted = (record: WorkflowNodeRecord) => !['进行中', '已退回'].includes(record.status);

const statusForNode = (nodeId: string) => nodeId.endsWith('-reason') ? '原因分析中'
  : nodeId.endsWith('-plan') ? '处置方案编制中'
    : nodeId === 'red-group-assessment' ? '待集团评估'
      : nodeId === 'red-group-review' ? '待集团审阅'
        : nodeId.endsWith('-release') ? '待解除评估'
          : '执行跟踪中';

export const normalizeWarningItemState = (item: WarningDisposal) => {
  const mode = item.letterDeliveryMode || 'manual';
  const sent = mode === 'auto' || (mode === 'manual' && hasWarningLetterSentEvidence(item));
  if (mode === 'auto') {
    item.letterStatus = '已下发';
    item.letterSentBy ||= '系统';
    item.letterSentAt ||= item.triggerDate;
  } else if (mode === 'none') {
    item.letterStatus = '不发函';
  } else {
    item.letterStatus = sent ? '已下发' : '待下发';
  }
  if (!item.workflow) return item;

  const systemNodeId = getWarningSystemNodeId(item);
  const reasonNodeId = getWarningReasonNodeId(item);
  const planNodeId = getWarningPlanNodeId(item);
  const pending = mode === 'manual' && !sent;
  const systemRecord = item.workflow.records.filter(record => record.nodeId === systemNodeId).slice(-1)[0];
  if (systemRecord) {
    systemRecord.action = pending ? '生成待下发提示函' : mode === 'none' ? '记录不发函' : mode === 'auto' ? '自动下发提示函' : '手动下发提示函';
    systemRecord.result = pending ? getPendingWarningLetterLabel(item) : item.letterStatus;
    systemRecord.status = pending ? '进行中' : '已完成';
    systemRecord.formData = { ...systemRecord.formData, 函件状态: item.letterStatus };
    if (!pending && item.letterSentAt) systemRecord.submittedAt = item.letterSentAt;
  }

  if (pending) {
    item.workflow.currentNodeId = systemNodeId;
    item.status = getPendingWarningLetterLabel(item);
  } else {
    let corrected = false;
    if (item.workflow.currentNodeId === systemNodeId) { item.workflow.currentNodeId = reasonNodeId; corrected = true; }
    const nodeIds = item.level === '黄灯'
      ? ['yellow-system-issued', 'yellow-reason', 'yellow-plan', 'yellow-execution', 'yellow-release']
      : ['red-system-issued', 'red-reason', 'red-plan', 'red-group-assessment', 'red-group-review', 'red-execution', 'red-release'];
    const currentIndex = nodeIds.indexOf(item.workflow.currentNodeId);
    const reasonCompleted = item.workflow.records.some(record => record.nodeId === reasonNodeId && isCompleted(record));
    const planCompleted = item.workflow.records.some(record => record.nodeId === planNodeId && isCompleted(record));
    if (currentIndex >= nodeIds.indexOf(planNodeId) && !reasonCompleted) { item.workflow.currentNodeId = reasonNodeId; corrected = true; }
    else if (currentIndex > nodeIds.indexOf(planNodeId) && !planCompleted) { item.workflow.currentNodeId = planNodeId; corrected = true; }
    if (corrected || item.status === getPendingWarningLetterLabel(item)) item.status = statusForNode(item.workflow.currentNodeId);
  }
  item.currentNode = item.workflow.currentNodeId;
  item.itemStatus = item.status;
  return item;
};

export const advanceAfterLetterSent = (item: WarningDisposal, operator: string, sentAt: string) => {
  item.letterStatus = '已下发';
  item.letterSentBy = operator;
  item.letterSentAt = sentAt;
  return normalizeWarningItemState(item);
};

export const getWarningNodeDisplayName = (item: WarningDisposal, nodeId: string, fallback: string) =>
  nodeId === getWarningSystemNodeId(item) && isWarningLetterPending(item) ? getPendingWarningLetterLabel(item) : fallback;
