import type { DemoState, MajorEvent, Role } from '../types';
import { createLog, uid } from './storage';
import { majorEventWorkflow, workflowService } from './workflowService';

type CreateMode = 'draft' | 'submit';
type ManagementAction = 'verify' | 'approve' | 'return' | 'remind' | 'track' | 'review' | 'close';

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

export const majorEventService = {
  nextCode,
  create(state: DemoState, value: Partial<MajorEvent>, operator: Role, mode: CreateMode = 'draft') {
    const submitted = mode === 'submit';
    const item: MajorEvent = {
      id: uid('event'),
      code: nextCode(state),
      name: value.name || '未命名重大风险事件',
      institution: value.institution || '',
      type: value.type || '重大操作风险事件',
      occurredAt: value.occurredAt || '',
      latestReport: '首报',
      currentStage: submitted ? '管理部门核实' : '新增事件',
      status: submitted ? '待审核' : '草稿',
      impact: value.impact || '',
      contact: value.contact || '',
      phone: value.phone || '',
      basic: value.basic || '',
      analysis: value.analysis || '',
      measures: value.measures || '',
      trend: value.trend || '',
      target: value.target || '',
      plan: value.plan || '',
      responsibleDept: value.responsibleDept || '',
      responsible: value.responsible || '',
      deadline: value.deadline || '',
      attachments: value.attachments || [],
      followUps: [],
      logs: [createLog(
        submitted ? '提交首报' : '保存草稿',
        submitted ? '首报及处置方案已提交金融机构管理部门核实' : '创建重大风险事件首报草稿',
        operator,
      )],
      workflow: { currentNodeId: submitted ? 'verify-report' : 'event-create', records: [] },
    };
    workflowService.append(item.workflow!, majorEventWorkflow[0], { role: operator, action: submitted ? '完成事件填报' : '保存事件草稿', result: submitted ? '已完成' : '草稿已保存', formData: { 事件名称: item.name, 事件基本情况: item.basic, 初步分析研判: item.analysis, 已采取措施: item.measures }, attachments: item.attachments });
    if (submitted) workflowService.append(item.workflow!, majorEventWorkflow[1], { role: operator, action: '提交首报', result: '已提交', formData: { 处置目标: item.target, 处置措施: item.plan, 责任部门: item.responsibleDept, 责任人: item.responsible, 计划完成时间: item.deadline }, attachments: item.attachments });
    state.majorEvents.unshift(item);
    return item;
  },
  update(item: MajorEvent, value: Partial<MajorEvent>, operator: Role, mode: CreateMode = 'draft') {
    const submitted = mode === 'submit';
    Object.assign(item, {
      name: value.name ?? item.name,
      institution: value.institution ?? item.institution,
      type: value.type ?? item.type,
      occurredAt: value.occurredAt ?? item.occurredAt,
      impact: value.impact ?? item.impact,
      contact: value.contact ?? item.contact,
      phone: value.phone ?? item.phone,
      basic: value.basic ?? item.basic,
      analysis: value.analysis ?? item.analysis,
      measures: value.measures ?? item.measures,
      trend: value.trend ?? item.trend,
      target: value.target ?? item.target,
      plan: value.plan ?? item.plan,
      responsibleDept: value.responsibleDept ?? item.responsibleDept,
      responsible: value.responsible ?? item.responsible,
      deadline: value.deadline ?? item.deadline,
      attachments: value.attachments ?? item.attachments,
      latestReport: '首报',
      currentStage: submitted ? '管理部门核实' : '新增事件',
      status: submitted ? '待审核' : '草稿',
      logs: [...item.logs, createLog(
        submitted ? '提交首报' : '保存草稿',
        submitted ? '重大风险事件首报及处置方案已提交' : '更新重大风险事件首报草稿',
        operator,
      )],
    });
    item.workflow ||= { currentNodeId: submitted ? 'verify-report' : 'event-create', records: [] };
    workflowService.append(item.workflow, majorEventWorkflow[submitted ? 1 : 0], { role: operator, action: submitted ? '重新提交首报' : '保存事件草稿', result: submitted ? '已提交' : '草稿已保存', formData: submitted ? { 处置目标: item.target, 处置措施: item.plan, 责任部门: item.responsibleDept, 责任人: item.responsible, 计划完成时间: item.deadline } : { 事件名称: item.name, 事件基本情况: item.basic, 初步分析研判: item.analysis, 已采取措施: item.measures }, attachments: item.attachments });
    item.workflow.currentNodeId = submitted ? 'verify-report' : 'event-create';
    return item;
  },
  removeDraft(state: DemoState, id: string) {
    const item = state.majorEvents.find(event => event.id === id);
    if (!item || item.status !== '草稿') return false;
    state.majorEvents = state.majorEvents.filter(event => event.id !== id);
    return true;
  },
  applyManagementAction(item: MajorEvent, action: ManagementAction, operator: Role) {
    const transitions: Record<ManagementAction, { status?: MajorEvent['status']; stage?: string; label: string; content: string }> = {
      verify: { stage: '金融机构管理部门核实并组织汇报', label: '核实', content: '重大风险事件首报已完成核实' },
      approve: { status: '处理中', stage: '金融机构执行处置并跟踪', label: '审核通过', content: '重大风险事件首报审核通过，进入执行处置阶段' },
      return: { status: '草稿', stage: '新增事件', label: '退回', content: '重大风险事件首报已退回机构修改' },
      remind: { label: '催办', content: '已向责任机构发送重大风险事件处理提醒' },
      track: { label: '跟踪', content: '已记录重大风险事件跟踪处理动作' },
      review: { status: '处理中', stage: '金融机构执行处置并跟踪', label: '审阅通过', content: '管理层已审阅重大风险事件方案' },
      close: { status: '已归档', stage: '终报归档', label: '关闭归档', content: '重大风险事件已确认关闭并归档' },
    };
    const transition = transitions[action];
    if (transition.status) item.status = transition.status;
    if (transition.stage) item.currentStage = transition.stage;
    item.logs.push(createLog(transition.label, transition.content, operator));
    item.workflow ||= { currentNodeId: 'verify-report', records: [] };
    const nodeId = action === 'verify' || action === 'return' ? 'verify-report' : action === 'review' ? 'management-review' : action === 'approve' ? 'management-review' : action === 'close' ? 'final-archive' : item.workflow.currentNodeId;
    const node = majorEventWorkflow.find(candidate => candidate.id === nodeId);
    if (node && !['remind', 'track'].includes(action)) {
      workflowService.append(item.workflow, node, { role: operator, action: transition.label, result: action === 'return' ? '退回修改' : transition.label, formData: { 处理意见: transition.content }, opinion: transition.content, returnReason: action === 'return' ? transition.content : undefined, status: action === 'return' ? '已退回' : action === 'close' ? '已关闭' : undefined });
      if (action === 'return') workflowService.returnTo(item.workflow, 'event-create');
      else workflowService.moveNext(item.workflow, majorEventWorkflow, node.id);
    }
    return item;
  },
};
