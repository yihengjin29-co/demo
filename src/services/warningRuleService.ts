import type { Attachment, DemoState, Role, WarningRule } from '../types';
import { createLog, uid } from './storage';

const now = () => new Date().toLocaleString('zh-CN', { hour12: false });
const nextVersion = (item: WarningRule) => `V${(item.versions?.length || 0) + 1}.0`;

export const warningRuleService = {
  update(item: WarningRule, patch: Partial<WarningRule>, action: string, content: string, operator: string) {
    Object.assign(item, patch, { logs: [...item.logs, createLog(action, content, operator)] });
  },
  create(state: DemoState, operator: string) {
    const item: WarningRule = {
      id: uid('wr'), code: `RW-${new Date().getFullYear()}-${String(state.warningRules.length + 1).padStart(3, '0')}`,
      indicator: '请选择指标', riskType: '信用风险', institution: '上海农商银行', frequency: '月度', ruleType: '阈值预警',
      yellow: '偏离预测范围5%以上', red: '偏离预测范围10%以上', effectiveDate: '', status: '未生效', letterDeliveryMode: 'manual',
      nodes: [], segments: [], pushMethods: [], submitter: operator, logs: [createLog('新增', '创建预警规则草稿', operator)], versions: [], operationRecords: [], letterDeliveryChanges: [],
    };
    state.warningRules.unshift(item);
    return item;
  },
  submitStatusChange(item: WarningRule, target: WarningRule['status'], date: string, reason: string, attachments: Attachment[], operator: Role, review: boolean) {
    const beforeStatus = item.status;
    const version = item.versions?.[0]?.version || 'V1.0';
    item.operationRecords ||= [];
    item.operationRecords.push({ id: uid('rule-op'), action: review ? '提交状态变更审核' : '状态变更', beforeStatus, afterStatus: target, operator, role: operator, time: now(), reason: `${date}生效；${reason}`, opinion: review ? '待审核' : '无需审核', attachments, version });
    item.status = review ? '状态变更待审核' : target;
    item.logs.push(createLog(review ? '提交状态变更审核' : '状态变更', `目标状态：${target}；${reason}`, operator));
  },
  stageConfig(item: WarningRule, config: Omit<NonNullable<WarningRule['pendingConfig']>, 'version' | 'submittedAt'>, operator: Role) {
    const version = nextVersion(item);
    item.pendingConfig = { ...config, version, submittedAt: now() };
    item.status = item.versions?.length ? '规则配置变更待审核' : '待审核';
    item.operationRecords ||= [];
    item.operationRecords.push({ id: uid('rule-op'), action: '提交规则配置审核', beforeStatus: item.versions?.[0]?.status || '未生效', afterStatus: item.status, operator, role: operator, time: now(), reason: config.reason, opinion: '待审核', attachments: [], version });
    item.logs.push(createLog('提交规则配置审核', `${version} 已提交审核，当前生效版本保持不变`, operator));
  },
  stageLetterDeliveryMode(item: WarningRule, requestedMode: NonNullable<WarningRule['letterDeliveryMode']>, reason: string, effectiveDate: string, operator: Role) {
    const change = { id: uid('letter-mode'), currentMode: item.letterDeliveryMode || 'manual' as const, requestedMode, reason, effectiveDate, applicant: operator, appliedAt: now(), reviewStatus: '待审核' as const };
    item.pendingLetterDelivery = { ...change, previousStatus: item.status };
    item.letterDeliveryChanges ||= [];
    item.letterDeliveryChanges.push(change);
    item.operationRecords ||= [];
    item.operationRecords.push({ id: uid('rule-op'), action: '提交提示函方式变更审核', beforeStatus: item.status, afterStatus: '提示函方式变更待审核', operator, role: operator, time: change.appliedAt, reason, opinion: '待审核', attachments: [], version: item.versions?.[0]?.version || 'V1.0' });
    item.status = '提示函方式变更待审核';
    item.logs.push(createLog('提交提示函方式变更审核', `申请调整提示函下发方式，计划 ${effectiveDate} 生效`, operator));
  },
  approve(item: WarningRule, pass: boolean, opinion: string, operator: Role) {
    const pendingLetter = item.status === '提示函方式变更待审核' ? item.pendingLetterDelivery : undefined;
    const pendingStatusChange = item.status === '状态变更待审核';
    const operation = [...(item.operationRecords || [])].reverse().find(record => record.opinion === '待审核');
    if (pendingLetter) {
      const history = item.letterDeliveryChanges?.find(change => change.id === pendingLetter.id);
      if (history) Object.assign(history, { reviewStatus: pass ? '通过' : '驳回', reviewer: operator, reviewedAt: now(), reviewOpinion: opinion });
      if (pass) item.letterDeliveryMode = pendingLetter.requestedMode;
      item.status = pendingLetter.previousStatus === '提示函方式变更待审核' ? '生效' : pendingLetter.previousStatus;
      delete item.pendingLetterDelivery;
    } else if (pass && item.pendingConfig && !pendingStatusChange) {
      const config = item.pendingConfig;
      Object.assign(item, { indicator: config.indicator, riskType: config.riskType, institution: config.institution, frequency: config.frequency, ruleType: config.ruleType, yellow: config.yellow, red: config.red, effectiveDate: config.effectiveDate, nodes: config.nodes, segments: config.segments, pushMethods: config.pushMethods, letterDeliveryMode: config.letterDeliveryMode, submitter: config.submitter, status: '生效' as const });
      item.versions ||= [];
      item.versions.unshift({ version: config.version, effectiveDate: config.effectiveDate, yellow: config.yellow, red: config.red, nodes: structuredClone(config.nodes), segments: structuredClone(config.segments), pushMethods: [...config.pushMethods], letterDeliveryMode: config.letterDeliveryMode, reason: config.reason, status: '生效' });
      delete item.pendingConfig;
    } else if (pass && pendingStatusChange) {
      item.status = (operation?.afterStatus || '生效') as WarningRule['status'];
    } else {
      item.status = '被退回';
    }
    if (operation) operation.opinion = opinion;
    item.logs.push(createLog(pass ? '审核通过' : '审核驳回', opinion, operator));
  },
};
