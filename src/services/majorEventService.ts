import type { Attachment, DemoState, MajorEvent, MajorEventMeasure, Role } from '../types';
import { createLog, uid } from './storage';
import { majorEventWorkflow, workflowService } from './workflowService';
import { isValidMajorRiskEventType } from './majorEventDefinitionService';

type CreateMode = 'draft' | 'submit';
export type MajorEventFormField = { name: string; label: string; type?: 'text' | 'textarea' | 'date' | 'select' | 'number'; required?: boolean; maxLength?: number; options?: string[] };

const nextCode = (state: DemoState) => {
  const year = new Date().getFullYear();
  const prefix = `ME-${year}-`;
  const maxSequence = state.majorEvents.reduce((max, item) => {
    if (!item.code.startsWith(prefix)) return max;
    const sequence = Number(item.code.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);
  return `${prefix}${String(maxSequence + 1).padStart(3, '0')}`;
};

const nodeById = (nodeId: string) => majorEventWorkflow.find(node => node.id === nodeId)!;
const uniqueAttachments = (current: Attachment[], next: Attachment[]) => [...current, ...next.filter(file => !current.some(existing => existing.id === file.id))];
const stageName = (nodeId: string, item?: MajorEvent) => nodeId === 'event-final-routine' && item?.closureBranch === 'routine-tracking' ? '常态化跟踪' : nodeById(nodeId)?.name || '';

export const getMajorEventNodeFields = (item: MajorEvent, nodeId: string, role: Role): MajorEventFormField[] => {
  if (nodeId === 'event-initial-report') return [
    { name: '事件名称', label: '事件名称', required: true }, { name: '风险事件类型', label: '风险事件类型', required: true },
    { name: '发生时间', label: '发生时间', type: 'date', required: true }, { name: '发现时间', label: '发现时间', type: 'date', required: true },
    { name: '事件基本情况', label: '事件基本情况', type: 'textarea', required: true, maxLength: 1500 }, { name: '初步分析研判', label: '初步分析研判', type: 'textarea', required: true, maxLength: 1500 },
    { name: '影响范围', label: '影响范围', type: 'textarea', required: true, maxLength: 1000 }, { name: '发展趋势', label: '发展趋势', type: 'textarea', maxLength: 1000 },
    { name: '联系人', label: '联系人', required: true }, { name: '联系方式', label: '联系方式', required: true },
  ];
  if (nodeId === 'event-verify') return [
    { name: '核实结论', label: '核实结论', type: 'select', required: true, options: ['核实通过', '补充材料', '退回修改', '不认定为重大风险事件'] },
    { name: '事件认定意见', label: '事件认定意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '是否属于重大风险事件', label: '是否属于重大风险事件', type: 'select', required: true, options: ['是', '否'] },
    { name: '是否需要补充材料', label: '是否需要补充材料', type: 'select', options: ['否', '是'] },
    { name: '初步管理意见', label: '初步管理意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '组织汇报情况', label: '组织汇报情况', type: 'textarea', required: true, maxLength: 1500 },
    { name: '补充说明', label: '补充说明', type: 'textarea', maxLength: 1000 },
  ];
  if (nodeId === 'event-plan') return [
    { name: '处置目标', label: '处置目标', type: 'textarea', required: true, maxLength: 1200 },
    { name: '资源保障', label: '资源保障', type: 'textarea', required: true, maxLength: 1000 },
    { name: '风险控制目标', label: '风险控制目标', type: 'textarea', required: true, maxLength: 1000 },
    { name: '信息报送安排', label: '信息报送安排', type: 'textarea', required: true, maxLength: 1000 },
  ];
  if (nodeId === 'event-plan-assessment') return [
    { name: '评估结论', label: '评估结论', type: 'select', required: true, options: ['评估通过', '补充材料', '退回修改'] },
    { name: '评估意见', label: '评估意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '管理要求', label: '管理要求', type: 'textarea', maxLength: 1200 },
    { name: '方案可行性评价', label: '方案可行性评价', type: 'textarea', required: true, maxLength: 1200 },
    { name: '是否需要补充处置措施', label: '是否需要补充处置措施', type: 'select', options: ['否', '是'] },
    { name: '是否需要持续报告', label: '是否需要持续报告', type: 'select', options: ['是', '否'] },
    { name: '建议报告频率', label: '建议报告频率', type: 'select', options: ['每周', '每月', '每季度', '按需'] },
    { name: '是否提交经理层、董事会审阅', label: '是否提交经理层、董事会审阅', type: 'select', required: true, options: ['是', '否'] },
    { name: '备注', label: '备注', type: 'textarea', maxLength: 1000 },
  ];
  if (nodeId === 'event-executive-review' && item.reviewStage === 'board') return [
    { name: '董事会审阅结论', label: '董事会审阅结论', type: 'select', required: true, options: ['审阅通过', '退回调整'] },
    { name: '董事会审阅意见', label: '董事会审阅意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '后续管理要求', label: '后续管理要求', type: 'textarea', maxLength: 1200 },
    { name: '是否要求定期汇报', label: '是否要求定期汇报', type: 'select', options: ['是', '否'] },
    { name: '汇报频率', label: '汇报频率', type: 'select', options: ['每周', '每月', '每季度', '按需'] },
    { name: '退回节点', label: '退回节点', type: 'select', options: ['各金融机构提交处置方案', '集团评估并审阅处置方案'] },
    { name: '备注', label: '备注', type: 'textarea', maxLength: 1000 },
  ];
  if (nodeId === 'event-executive-review') return [
    { name: '经理层审阅结论', label: '经理层审阅结论', type: 'select', required: true, options: ['审阅通过', '退回调整'] },
    { name: '经理层审阅意见', label: '经理层审阅意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '管理要求', label: '管理要求', type: 'textarea', maxLength: 1200 },
    { name: '是否提交董事会', label: '是否提交董事会', type: 'select', required: true, options: ['是', '否'] },
    { name: '退回节点', label: '退回节点', type: 'select', options: ['各金融机构提交处置方案', '集团评估并审阅处置方案'] },
    { name: '备注', label: '备注', type: 'textarea', maxLength: 1000 },
  ];
  if (nodeId === 'event-execution-report') return [
    { name: '续报编号', label: '续报编号', required: true }, { name: '续报时间', label: '续报时间', type: 'date', required: true },
    { name: '事件最新情况', label: '事件最新情况', type: 'textarea', required: true, maxLength: 1500 },
    { name: '风险变化情况', label: '风险变化情况', type: 'textarea', required: true, maxLength: 1200 },
    { name: '处置措施执行情况', label: '处置措施执行情况', type: 'textarea', required: true, maxLength: 1500 },
    { name: '已完成事项', label: '已完成事项', type: 'textarea', maxLength: 1000 }, { name: '尚未完成事项', label: '尚未完成事项', type: 'textarea', maxLength: 1000 },
    { name: '当前完成比例', label: '当前完成比例（%）', type: 'number', required: true }, { name: '存在问题', label: '存在问题', type: 'textarea', maxLength: 1000 },
    { name: '下一步工作安排', label: '下一步工作安排', type: 'textarea', required: true, maxLength: 1200 },
    { name: '是否存在新增影响', label: '是否存在新增影响', type: 'select', options: ['否', '是'] },
  ];
  if (nodeId === 'event-holding-track') return [
    { name: '跟踪意见', label: '跟踪意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '处置进度评价', label: '处置进度评价', type: 'textarea', required: true, maxLength: 1200 },
    { name: '催办要求', label: '催办要求', type: 'textarea', maxLength: 1000 }, { name: '协调情况', label: '协调情况', type: 'textarea', maxLength: 1000 },
    { name: '风险变化判断', label: '风险变化判断', type: 'textarea', required: true, maxLength: 1200 },
    { name: '是否需要补充续报', label: '是否需要补充续报', type: 'select', options: ['否', '是'] },
    { name: '是否达到结束条件', label: '是否达到结束条件', type: 'select', required: true, options: ['否', '是'] },
    { name: '结束评估意见', label: '结束评估意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '后续管理建议', label: '后续管理建议', type: 'textarea', maxLength: 1200 },
  ];
  if (nodeId === 'event-final-routine' && item.closureBranch === 'final-report' && role === '各金融机构') return [
    { name: '终报编号', label: '终报编号', required: true }, { name: '事件最终情况', label: '事件最终情况', type: 'textarea', required: true, maxLength: 1500 },
    { name: '事件影响结果', label: '事件影响结果', type: 'textarea', required: true, maxLength: 1200 },
    { name: '处置措施完成情况', label: '处置措施完成情况', type: 'textarea', required: true, maxLength: 1200 },
    { name: '处置成效', label: '处置成效', type: 'textarea', required: true, maxLength: 1200 },
    { name: '风险是否解除', label: '风险是否解除', type: 'select', required: true, options: ['是', '否'] },
    { name: '遗留问题', label: '遗留问题', type: 'textarea', maxLength: 1000 }, { name: '后续管理建议', label: '后续管理建议', type: 'textarea', maxLength: 1000 },
    { name: '经验总结', label: '经验总结', type: 'textarea', maxLength: 1200 },
  ];
  if (nodeId === 'event-final-routine' && item.closureBranch === 'final-report') return [
    { name: '终报审核意见', label: '终报审核意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '是否同意关闭', label: '是否同意关闭', type: 'select', required: true, options: ['是', '否'] },
    { name: '是否需要补充材料', label: '是否需要补充材料', type: 'select', options: ['否', '是'] },
    { name: '是否转入常态化跟踪', label: '是否转入常态化跟踪', type: 'select', options: ['否', '是'] },
    { name: '备注', label: '备注', type: 'textarea', maxLength: 1000 },
  ];
  if (nodeId === 'event-final-routine' && role === '各金融机构') return [
    { name: '跟踪原因', label: '跟踪原因', type: 'textarea', required: true, maxLength: 1000 }, { name: '跟踪事项', label: '跟踪事项', type: 'textarea', required: true, maxLength: 1200 },
    { name: '责任机构', label: '责任机构', required: true }, { name: '跟踪频率', label: '跟踪频率', type: 'select', required: true, options: ['每周', '每月', '每季度', '按需'] },
    { name: '下次反馈时间', label: '下次反馈时间', type: 'date', required: true }, { name: '当前风险情况', label: '当前风险情况', type: 'textarea', required: true, maxLength: 1200 },
    { name: '后续措施', label: '后续措施', type: 'textarea', required: true, maxLength: 1200 }, { name: '本期跟踪记录', label: '本期跟踪记录', type: 'textarea', required: true, maxLength: 1500 },
  ];
  return [
    { name: '跟踪意见', label: '跟踪意见', type: 'textarea', required: true, maxLength: 1500 },
    { name: '催办要求', label: '催办要求', type: 'textarea', maxLength: 1000 },
    { name: '是否继续跟踪', label: '是否继续跟踪', type: 'select', required: true, options: ['是', '否'] },
    { name: '是否重新进入处置流程', label: '是否重新进入处置流程', type: 'select', options: ['否', '是'] },
    { name: '是否结束跟踪并归档', label: '是否结束跟踪并归档', type: 'select', options: ['否', '是'] },
  ];
};

export const majorEventService = {
  nextCode,
  create(state: DemoState, value: Partial<MajorEvent>, operator: Role, mode: CreateMode = 'draft') {
    if (!value.type || !isValidMajorRiskEventType(state, value.type)) return undefined;
    const submitted = mode === 'submit';
    const item: MajorEvent = {
      id: uid('event'), code: nextCode(state), name: value.name || '未命名重大风险事件', institution: value.institution || '', type: value.type,
      occurredAt: value.occurredAt || '', discoveredAt: value.discoveredAt || value.occurredAt || '', latestReport: '首报',
      currentStage: submitted ? '集团核实事件并组织汇报' : '各金融机构提交事件首报', status: submitted ? '待核实' : '草稿',
      impact: value.impact || '', contact: value.contact || '', phone: value.phone || '', basic: value.basic || '', analysis: value.analysis || '', measures: value.measures || '', trend: value.trend || '',
      target: value.target || '', plan: value.plan || '', responsibleDept: value.responsibleDept || '', responsible: value.responsible || '', deadline: value.deadline || '',
      attachments: value.attachments || [], followUps: [], logs: [createLog(submitted ? '提交首报' : '保存草稿', submitted ? '重大风险事件首报已提交集团核实' : '创建重大风险事件首报草稿', operator)],
      planMeasures: [], eventDrafts: {}, workflow: { currentNodeId: submitted ? 'event-verify' : 'event-initial-report', records: [] },
    };
    if (submitted) workflowService.append(item.workflow!, majorEventWorkflow[0], { role: operator, action: '提交首报', result: '已提交', formData: { 事件名称: item.name, 风险事件类型: item.type, 发生时间: item.occurredAt, 发现时间: item.discoveredAt || '', 事件基本情况: item.basic, 初步分析研判: item.analysis, 影响范围: item.impact, 发展趋势: item.trend, 联系人: item.contact, 联系方式: item.phone }, attachments: item.attachments });
    state.majorEvents.unshift(item);
    return item;
  },
  update(item: MajorEvent, value: Partial<MajorEvent>, operator: Role, mode: CreateMode = 'draft', state?: Pick<DemoState, 'majorRiskEventDefinitions'>) {
    if (!value.type || !state || !isValidMajorRiskEventType(state, value.type)) return undefined;
    const submitted = mode === 'submit';
    Object.assign(item, { name: value.name ?? item.name, institution: value.institution ?? item.institution, type: value.type ?? item.type, occurredAt: value.occurredAt ?? item.occurredAt, discoveredAt: value.discoveredAt ?? item.discoveredAt, impact: value.impact ?? item.impact, contact: value.contact ?? item.contact, phone: value.phone ?? item.phone, basic: value.basic ?? item.basic, analysis: value.analysis ?? item.analysis, measures: value.measures ?? item.measures, trend: value.trend ?? item.trend, attachments: value.attachments ?? item.attachments, latestReport: '首报', currentStage: submitted ? '集团核实事件并组织汇报' : '各金融机构提交事件首报', status: submitted ? '待核实' : '草稿' });
    item.workflow ||= { currentNodeId: 'event-initial-report', records: [] };
    if (submitted) workflowService.append(item.workflow, majorEventWorkflow[0], { role: operator, action: '提交首报', result: '已提交', formData: { 事件名称: item.name, 风险事件类型: item.type, 发生时间: item.occurredAt, 发现时间: item.discoveredAt || '', 事件基本情况: item.basic, 初步分析研判: item.analysis, 影响范围: item.impact, 发展趋势: item.trend, 联系人: item.contact, 联系方式: item.phone }, attachments: item.attachments });
    item.workflow.currentNodeId = submitted ? 'event-verify' : 'event-initial-report';
    item.logs.push(createLog(submitted ? '提交首报' : '保存草稿', submitted ? '重大风险事件首报已提交集团核实' : '更新重大风险事件首报草稿', operator));
    return item;
  },
  removeDraft(state: DemoState, id: string) {
    const item = state.majorEvents.find(event => event.id === id);
    if (!item || item.status !== '草稿') return false;
    state.majorEvents = state.majorEvents.filter(event => event.id !== id);
    return true;
  },
  saveNodeDraft(state: DemoState, id: string, nodeId: string, role: Role, formData: Record<string, string>, attachments: Attachment[], measures?: MajorEventMeasure[]) {
    const item = state.majorEvents.find(event => event.id === id);
    if (!item) return false;
    item.eventDrafts ||= {};
    item.eventDrafts[nodeId] = { formData: { ...formData }, attachments: [...attachments], measures: measures ? structuredClone(measures) : undefined };
    item.logs.push(createLog('保存草稿', `${stageName(nodeId, item)}：保存当前办理内容，事项状态保持为“${item.status}”`, role));
    return true;
  },
  submitNode(state: DemoState, id: string, nodeId: string, role: Role, formData: Record<string, string>, attachments: Attachment[], action: string, measures?: MajorEventMeasure[]) {
    const item = state.majorEvents.find(event => event.id === id);
    if (!item?.workflow || item.workflow.currentNodeId !== nodeId || ['已归档', '已关闭'].includes(item.status)) return false;
    if (nodeId === 'event-initial-report' && !isValidMajorRiskEventType(state, formData['风险事件类型'] || '')) return false;
    const node = nodeById(nodeId);
    const previousStatus = item.status;
    const returned = action.includes('退回');
    workflowService.append(item.workflow, node, { role, action, result: returned ? '退回修改' : action, formData: { ...formData }, opinion: formData['评估意见'] || formData['经理层审阅意见'] || formData['董事会审阅意见'] || formData['跟踪意见'] || formData['终报审核意见'], returnReason: returned ? formData['事件认定意见'] || formData['评估意见'] || formData['经理层审阅意见'] || formData['董事会审阅意见'] || formData['跟踪意见'] || '请补充完善后重新提交' : undefined, attachments, status: returned ? '已退回' : undefined });
    item.attachments = uniqueAttachments(item.attachments, attachments);
    if (item.eventDrafts) delete item.eventDrafts[nodeId];

    if (nodeId === 'event-initial-report') {
      Object.assign(item, { name: formData['事件名称'] || item.name, type: formData['风险事件类型'] || item.type, occurredAt: formData['发生时间'] || item.occurredAt, discoveredAt: formData['发现时间'] || item.discoveredAt, basic: formData['事件基本情况'] || item.basic, analysis: formData['初步分析研判'] || item.analysis, impact: formData['影响范围'] || item.impact, trend: formData['发展趋势'] || item.trend, contact: formData['联系人'] || item.contact, phone: formData['联系方式'] || item.phone });
      item.workflow.currentNodeId = 'event-verify'; item.status = '待核实'; item.latestReport = '首报';
    } else if (nodeId === 'event-verify') {
      item.verificationData = { ...formData };
      if (action === '不予认定') { item.status = '已关闭'; }
      else if (returned) { item.workflow.currentNodeId = 'event-initial-report'; item.status = '已退回'; }
      else { item.workflow.currentNodeId = 'event-plan'; item.status = '待提交处置方案'; }
    } else if (nodeId === 'event-plan') {
      item.planMeasures = (measures || []).map(measure => ({ ...measure, submitted: true }));
      item.target = formData['处置目标'] || item.target; item.plan = item.planMeasures.map(measure => measure.measure).join('；');
      item.responsibleDept = item.planMeasures.map(measure => measure.responsibleDepartment).filter(Boolean).join('、'); item.responsible = item.planMeasures.map(measure => measure.responsiblePerson).filter(Boolean).join('、');
      item.deadline = item.planMeasures.map(measure => measure.plannedCompletionDate).filter(Boolean).sort().slice(-1)[0] || item.deadline;
      item.workflow.currentNodeId = 'event-plan-assessment'; item.status = '待集团评估';
    } else if (nodeId === 'event-plan-assessment') {
      item.planAssessmentData = { ...formData };
      if (returned) { item.workflow.currentNodeId = 'event-plan'; item.status = '已退回'; }
      else { item.workflow.currentNodeId = 'event-executive-review'; item.reviewStage = 'management'; item.status = '待经理层审阅'; }
    } else if (nodeId === 'event-executive-review') {
      item.executiveReviewData ||= {};
      if (item.reviewStage === 'board') item.executiveReviewData.board = { ...formData }; else item.executiveReviewData.management = { ...formData };
      if (returned) {
        const target = formData['退回节点'] === '集团评估并审阅处置方案' ? 'event-plan-assessment' : 'event-plan';
        item.workflow.currentNodeId = target; item.status = '已退回'; item.reviewStage = 'management';
      } else if (item.reviewStage !== 'board' && formData['是否提交董事会'] === '是') {
        item.reviewStage = 'board'; item.status = '待董事会审阅';
      } else {
        item.workflow.currentNodeId = 'event-execution-report'; item.status = '处置执行中'; item.reviewStage = item.reviewStage || 'management';
      }
    } else if (nodeId === 'event-execution-report') {
      item.followUps.push({ id: uid('event-followup'), code: formData['续报编号'], date: formData['续报时间'], latestProgress: formData['事件最新情况'], riskChange: formData['风险变化情况'], execution: formData['处置措施执行情况'], completedItems: formData['已完成事项'], incompleteItems: formData['尚未完成事项'], completionRate: formData['当前完成比例'], problems: formData['存在问题'], nextStep: formData['下一步工作安排'], newImpact: formData['是否存在新增影响'], attachments: [...attachments] });
      item.latestReport = '续报'; item.workflow.currentNodeId = 'event-holding-track'; item.status = '持续跟踪中';
    } else if (nodeId === 'event-holding-track') {
      item.holdingTrackData = { ...formData };
      if (['退回补充', '继续处置'].includes(action)) { item.workflow.currentNodeId = 'event-execution-report'; item.status = '处置执行中'; }
      else if (action === '进入终报') { item.workflow.currentNodeId = 'event-final-routine'; item.closureBranch = 'final-report'; item.node8Actor = '各金融机构'; item.status = '待终报'; }
      else if (action === '转入常态化跟踪') { item.workflow.currentNodeId = 'event-final-routine'; item.closureBranch = 'routine-tracking'; item.node8Actor = '各金融机构'; item.status = '常态化跟踪'; }
      else { item.workflow.currentNodeId = 'event-holding-track'; item.status = '持续跟踪中'; }
    } else if (item.closureBranch === 'final-report' && role === '各金融机构') {
      item.finalReport = { code: formData['终报编号'], result: formData['事件最终情况'], impact: formData['事件影响结果'], completion: formData['处置措施完成情况'], effect: formData['处置成效'], release: formData['风险是否解除'], remainingIssues: formData['遗留问题'], followUp: formData['后续管理建议'], lessons: formData['经验总结'], attachments: [...attachments], date: new Date().toISOString().slice(0, 10) };
      item.latestReport = '终报'; item.node8Actor = '金控公司'; item.status = '终报审核中';
    } else if (item.closureBranch === 'final-report') {
      item.finalReportReview = { ...formData };
      if (returned || formData['是否需要补充材料'] === '是') { item.node8Actor = '各金融机构'; item.status = '待终报'; }
      else if (action === '转入常态化跟踪' || formData['是否转入常态化跟踪'] === '是') { item.closureBranch = 'routine-tracking'; item.node8Actor = '各金融机构'; item.status = '常态化跟踪'; }
      else { item.status = '已归档'; item.archivedAt = new Date().toLocaleString('zh-CN', { hour12: false }); item.archivedBy = role; }
    } else if (role === '各金融机构') {
      item.routineTracking ||= { reason: '', items: '', responsibleInstitution: item.institution, frequency: '', nextFeedbackDate: '', currentRisk: '', nextMeasures: '', records: [] };
      Object.assign(item.routineTracking, { reason: formData['跟踪原因'], items: formData['跟踪事项'], responsibleInstitution: formData['责任机构'], frequency: formData['跟踪频率'], nextFeedbackDate: formData['下次反馈时间'], currentRisk: formData['当前风险情况'], nextMeasures: formData['后续措施'] });
      item.routineTracking.records.push({ id: uid('routine'), date: new Date().toISOString().slice(0, 10), content: formData['本期跟踪记录'], attachments: [...attachments], role });
      item.node8Actor = '金控公司'; item.status = '常态化跟踪';
    } else {
      item.holdingTrackData = { ...formData };
      if (action === '重新进入处置流程') { item.workflow.currentNodeId = 'event-execution-report'; item.closureBranch = undefined; item.node8Actor = undefined; item.status = '处置执行中'; }
      else if (action === '结束跟踪并归档') { item.status = '已归档'; item.archivedAt = new Date().toLocaleString('zh-CN', { hour12: false }); item.archivedBy = role; }
      else { item.node8Actor = '各金融机构'; item.status = '常态化跟踪'; }
    }
    item.currentStage = item.status === '已归档' ? '终报归档' : item.status === '已关闭' ? '事件关闭' : stageName(item.workflow.currentNodeId, item);
    item.logs.push(createLog(action, `${node.name}：事项状态由“${previousStatus}”变更为“${item.status}”`, role));
    if (attachments.length) item.logs.push(createLog('上传附件', `${node.name}上传附件：${attachments.map(file => file.name).join('、')}`, role));
    return true;
  },
  applyManagementAction(item: MajorEvent, action: 'verify' | 'approve' | 'return' | 'remind' | 'track' | 'review' | 'close', operator: Role) {
    item.logs.push(createLog(action === 'remind' ? '催办' : action === 'track' ? '跟踪' : action === 'close' ? '确认归档' : '流程操作', '请从重大风险事件进度总览进入当前节点办理', operator));
    return item;
  },
};
