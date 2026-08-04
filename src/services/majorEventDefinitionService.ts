import type { DemoState, MajorRiskEventDefinition, Role } from '../types';
import { createLog, uid } from './storage';

export const seedMajorRiskEventDefinitions = (): MajorRiskEventDefinition[] => [
  {
    id: 'med-1', code: 'MED-001', name: '重大操作风险事件', status: '生效', version: 'V1.0', updatedAt: '2026-06-30', notes: '',
    referenceBasis: '《银行保险机构操作风险管理办法》第四十二条',
    criteria: [
      '形成预计损失5000万元（含）以上，或者超过上年度末资本净额5%（含）以上的事件；',
      '形成损失金额1000万元（含）以上，或者超过上年度末资本净额1%（含）以上的事件；',
      '造成重要数据、重要账册、重要空白凭证、重要资料严重损毁、丢失或者泄露，已经或者可能造成重大损失和严重影响的事件；',
      '重要信息系统出现故障、受到网络攻击，导致营业网点或电子渠道业务长时间中断的事件；',
      '因网络欺诈及其他信息安全事件，导致本机构或客户资金损失，或者造成重大社会影响的事件；',
      '董事、高级管理人员、监事及分支机构负责人被采取监察调查、刑事强制措施或者承担刑事法律责任的事件；',
      '严重侵犯公民个人信息安全和合法权益的事件；',
      '员工涉嫌发起、主导或者组织实施非法集资类违法犯罪被立案的事件。',
    ], logs: [createLog('初始化', '创建重大风险事件定义')],
  },
  { id: 'med-2', code: 'MED-002', name: '关注/异常项目事件', status: '生效', version: 'V1.0', updatedAt: '2026-06-30', notes: '', referenceBasis: '/', criteria: ['当期新增关注类或异常类项目。'], logs: [createLog('初始化', '创建重大风险事件定义')] },
  { id: 'med-3', code: 'MED-003', name: '重大合规风险事件', status: '生效', version: 'V1.0', updatedAt: '2026-06-30', notes: '', referenceBasis: '/', criteria: ['因违规行为引发重大法律纠纷案件、重大行政处罚，单项影响金额占本公司总资产、净资产或净利润10%以上，或者预计损失金额超过1000万元；', '涉外（含港澳台地区）或被国际组织制裁等合规风险事件；', '收到将导致监管评价扣分的监管函件，或行业自律组织出具的书面自律监管措施或纪律处分决定。'], logs: [createLog('初始化', '创建重大风险事件定义')] },
  { id: 'med-4', code: 'MED-004', name: '重大声誉风险事件', status: '生效', version: 'V1.0', updatedAt: '2026-06-30', notes: '', referenceBasis: '/', criteria: ['被新华社、《人民日报》等一类媒体首发或转载，被舆论广泛关注，或相关话题进入主要网络平台热点榜单并达到规定影响范围的事件；', '被宣传、网信部门相关内刊上报或被省级领导批示的敏感事件；', '50人以上（含）的信访等重大群体性事件，以及其他给集团利益带来重大损失的恶性事件。'], logs: [createLog('初始化', '创建重大风险事件定义')] },
  { id: 'med-5', code: 'MED-005', name: '重大信息科技风险事件', status: '生效', version: 'V1.0', updatedAt: '2026-06-30', notes: '', referenceBasis: '《银行保险机构操作风险管理办法》第四十二条', criteria: ['重要信息系统出现故障、受到网络攻击，导致在同一省份的营业网点、电子渠道业务中断3小时以上，或者在两个及以上省份业务中断30分钟以上；', '因网络欺诈及其他信息安全事件，导致本机构或客户资金损失5000万元以上，或者造成重大社会影响。'], logs: [createLog('初始化', '创建重大风险事件定义')] },
];

export const getActiveMajorRiskEventDefinitions = (state: Pick<DemoState, 'majorRiskEventDefinitions'>) =>
  state.majorRiskEventDefinitions.filter(definition => definition.status === '生效');

export const getMajorRiskEventTypeOptions = (state: Pick<DemoState, 'majorRiskEventDefinitions' | 'majorEvents'>, includeReferenced = false) => {
  const active = getActiveMajorRiskEventDefinitions(state).map(definition => definition.name);
  return includeReferenced ? [...new Set([...active, ...state.majorEvents.map(event => event.type)])] : active;
};

export const isValidMajorRiskEventType = (state: Pick<DemoState, 'majorRiskEventDefinitions'>, eventType: string, activeOnly = true) =>
  state.majorRiskEventDefinitions.some(definition => definition.name === eventType && (!activeOnly || definition.status === '生效'));

const legacyMajorRiskEventTypeMap: Record<string, string> = {
  重大信用风险事件: '关注/异常项目事件',
  信用风险事件: '关注/异常项目事件',
  项目风险事件: '关注/异常项目事件',
};

export const normalizeMajorRiskEventType = (eventType: string, eventName: string, definitions: MajorRiskEventDefinition[]) => {
  if (definitions.some(definition => definition.name === eventType)) return eventType;
  const mapped = legacyMajorRiskEventTypeMap[eventType];
  if (mapped && definitions.some(definition => definition.name === mapped)) return mapped;
  const candidates: [RegExp, string][] = [
    [/信息科技|信息系统|网络安全|系统故障/, '重大信息科技风险事件'],
    [/合规|处罚|监管|诉讼/, '重大合规风险事件'],
    [/声誉|舆情|群体性事件/, '重大声誉风险事件'],
    [/操作风险|欺诈|员工违法|数据泄露/, '重大操作风险事件'],
    [/项目|信用|逾期|不良资产/, '关注/异常项目事件'],
  ];
  const inferred = candidates.find(([pattern]) => pattern.test(eventName))?.[1];
  return inferred && definitions.some(definition => definition.name === inferred) ? inferred : eventType;
};

export const majorEventDefinitionService = {
  save(state: DemoState, value: Partial<MajorRiskEventDefinition>, operator: Role) {
    const existing = value.id ? state.majorRiskEventDefinitions.find(item => item.id === value.id) : undefined;
    if (existing) {
      const nextVersion = `V${Number(existing.version.replace(/^V/, '').split('.')[0] || 1) + 1}.0`;
      Object.assign(existing, value, { version: nextVersion, updatedAt: new Date().toISOString().slice(0, 10) });
      existing.logs.push(createLog('编辑定义', `重大风险事件定义更新至 ${nextVersion}`, operator));
      return existing;
    }
    const item: MajorRiskEventDefinition = {
      id: uid('med'), code: value.code || `MED-${String(state.majorRiskEventDefinitions.length + 1).padStart(3, '0')}`,
      name: value.name || '未命名事件类型', criteria: value.criteria || [], referenceBasis: value.referenceBasis || '/',
      status: value.status || '草稿', version: 'V1.0', updatedAt: new Date().toISOString().slice(0, 10), notes: value.notes || '',
      logs: [createLog('新增定义', '创建重大风险事件定义', operator)],
    };
    state.majorRiskEventDefinitions.unshift(item);
    return item;
  },
  setStatus(item: MajorRiskEventDefinition, status: '生效' | '停用', operator: Role) {
    item.status = status;
    item.updatedAt = new Date().toISOString().slice(0, 10);
    item.logs.push(createLog(status === '生效' ? '启用定义' : '停用定义', `定义状态调整为${status}`, operator));
  },
};
