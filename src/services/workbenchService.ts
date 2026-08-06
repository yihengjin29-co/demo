import type { ConcentrationData, DemoState, Role } from '../types';
import { getConcentrationRecords, concentrationTypes, concentrationTypeLabels } from './concentrationService';
import { canHandleMajorEventNode, canHandleWarningNode, currentInstitution, filterDataByCurrentInstitution, getMajorEventNodeRole } from './permissionService';
import { getWarningWorkflowSteps } from './warningDisposalService';

export type WorkbenchTask = { id: string; category: string; title: string; institution: string; deadline: string; status: string; path: string; action: string };
export type WorkbenchStatistic = { label: string; value: number; note: string; path: string };
export type WorkbenchInstitutionRow = { institution: string; red: number; yellow: number; majorEvents: number; pending: number; reportStatus: string };
export type WorkbenchFocusItem = { id: string; title: string; detail: string; status: string; path: string };
export type WorkbenchRecentItem = { id: string; action: string; detail: string; time: string };
export type WorkbenchData = {
  mode: 'management' | 'institution'; title: string; description: string; statistics: WorkbenchStatistic[]; tasks: WorkbenchTask[];
  institutions: WorkbenchInstitutionRow[]; focus: WorkbenchFocusItem[]; recent: WorkbenchRecentItem[];
  concentrationSummary: { type: string; red: number; yellow: number; green: number }[];
};

const displayInstitutions = ['国际AMC', '浦发银行', '太保集团', '上农商', '国泰海通'];
const aliases: Record<string, string[]> = { 太保集团: ['太保集团', '中国太平洋保险'], 上农商: ['上农商', '上海农商银行'] };
const matchesInstitution = (value: string, institution: string) => (aliases[institution] || [institution]).some(name => value.split(/[、,，/]/).includes(name));

const concentrationSummaryFor = (data: ConcentrationData, role: Role, institution = '') => concentrationTypes.map(type => {
  const records = getConcentrationRecords(data, type, role, institution);
  return { type: concentrationTypeLabels[type], red: records.filter(item => item.lightStatus === 'red').length, yellow: records.filter(item => item.lightStatus === 'yellow').length, green: records.filter(item => item.lightStatus === 'green').length };
});

export const getWorkbenchDataByRole = (source: DemoState, role: Role, concentrationData: ConcentrationData): WorkbenchData => {
  const warnings = filterDataByCurrentInstitution(source.warningDisposals, role, item => item.institution);
  const events = filterDataByCurrentInstitution(source.majorEvents, role, item => item.institution);
  const reports = filterDataByCurrentInstitution(source.reports, role, item => item.institution);
  const tasks: WorkbenchTask[] = [];

  warnings.forEach(item => {
    const nodeId = item.workflow?.currentNodeId;
    if (role === '金控公司' && item.letterDeliveryMode === 'manual' && item.letterStatus === '待下发') {
      tasks.push({ id: `letter-${item.id}`, category: '提示函下发', title: `${item.institution}${item.noticeType || '提示函'}待下发`, institution: item.institution, deadline: '今日', status: '待下发', path: '/warning/disposal', action: '下发' });
    } else if (nodeId && canHandleWarningNode(role, nodeId, item)) {
      const node = getWarningWorkflowSteps(item).find(candidate => candidate.id === nodeId);
      tasks.push({ id: `warning-${item.id}`, category: '预警处置', title: `${item.indicator} · ${node?.name || '预警处置'}`, institution: item.institution, deadline: '按流程办理', status: item.status, path: `/warning/disposal/${item.id}/overview`, action: '办理' });
    }
  });
  events.forEach(item => {
    const nodeId = item.workflow?.currentNodeId;
    if (nodeId && canHandleMajorEventNode(role, nodeId, item)) tasks.push({ id: `event-${item.id}`, category: '重大事件', title: `${item.name} · ${item.currentStage}`, institution: item.institution, deadline: '持续跟踪', status: item.status, path: `/major-events/${item.id}/overview`, action: getMajorEventNodeRole(item, nodeId) === '各金融机构' ? '填报' : '办理' });
  });
  if (role === '各金融机构') reports.forEach(report => tasks.push({ id: `report-${report.id}`, category: '数据报送', title: `${report.name}报送确认`, institution: report.institution, deadline: '本期截止前', status: report.status, path: '/reports', action: '查看' }));

  const concentrationRecords = concentrationTypes.flatMap(type => getConcentrationRecords(concentrationData, type, role));
  if (role !== '各金融机构') concentrationRecords.filter(record => record.lightStatus !== 'green').slice(0, 3).forEach(record => tasks.push({ id: `concentration-${record.id}`, category: '集中度监测', title: `${record.objectName}${concentrationTypeLabels[record.concentrationType]}`, institution: record.involvedInstitutionNames.join('、'), deadline: '持续关注', status: record.lightStatus === 'red' ? '红灯' : '黄灯', path: `/concentration-monitoring/${record.concentrationType === 'groupCustomer' ? 'group-customer' : record.concentrationType}/${record.id}`, action: '查看' }));

  const focus: WorkbenchFocusItem[] = [
    ...warnings.filter(item => item.level === '红灯').map(item => ({ id: `focus-warning-${item.id}`, title: `${item.indicator}红灯预警`, detail: `${item.institution} · ${item.status}`, status: '红灯', path: `/warning/disposal/${item.id}/overview` })),
    ...concentrationRecords.filter(item => item.lightStatus !== 'green').slice(0, 4).map(item => ({ id: `focus-${item.id}`, title: `${item.objectName}${concentrationTypeLabels[item.concentrationType]}`, detail: `当前集中度 ${item.concentrationRate.toFixed(2)}%`, status: item.lightStatus === 'red' ? '红灯' : '黄灯', path: `/concentration-monitoring/${item.concentrationType === 'groupCustomer' ? 'group-customer' : item.concentrationType}/${item.id}` })),
    ...events.filter(item => !['已归档', '已关闭'].includes(item.status)).map(item => ({ id: `focus-event-${item.id}`, title: item.name, detail: `${item.institution} · ${item.currentStage}`, status: item.status, path: `/major-events/${item.id}/overview` })),
  ].slice(0, 6);

  const recent: WorkbenchRecentItem[] = [
    ...warnings.flatMap(item => item.logs.map(log => ({ id: `${item.id}-${log.id}`, action: log.action, detail: `${item.institution} · ${log.content}`, time: log.time }))),
    ...events.flatMap(item => item.logs.map(log => ({ id: `${item.id}-${log.id}`, action: log.action, detail: `${item.institution} · ${log.content}`, time: log.time }))),
    ...reports.flatMap(item => item.logs.map(log => ({ id: `${item.id}-${log.id}`, action: log.action, detail: `${item.institution} · ${log.content}`, time: log.time }))),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);

  const red = warnings.filter(item => item.level === '红灯').length;
  const yellow = warnings.filter(item => item.level === '黄灯').length;
  const pendingLetters = warnings.filter(item => item.letterDeliveryMode === 'manual' && item.letterStatus === '待下发').length;
  const institutionRows = role === '各金融机构' ? [] : displayInstitutions.map(institution => {
    const institutionWarnings = warnings.filter(item => matchesInstitution(item.institution, institution));
    const institutionEvents = events.filter(item => matchesInstitution(item.institution, institution));
    const report = reports.find(item => matchesInstitution(item.institution, institution));
    return { institution, red: institutionWarnings.filter(item => item.level === '红灯').length, yellow: institutionWarnings.filter(item => item.level === '黄灯').length, majorEvents: institutionEvents.length, pending: institutionWarnings.filter(item => !['已解除', '已关闭'].includes(item.status)).length + institutionEvents.filter(item => !['已归档', '已关闭'].includes(item.status)).length, reportStatus: report?.status || '待报送' };
  });

  const management = role !== '各金融机构';
  const statistics: WorkbenchStatistic[] = management ? [
    { label: '待处理事项', value: tasks.length, note: '当前角色可办理', path: '/workbench' },
    { label: '红灯预警事项', value: red, note: '集团范围', path: '/warning/disposal?level=红灯' },
    { label: '黄灯预警事项', value: yellow, note: '集团范围', path: '/warning/disposal?level=黄灯' },
    { label: '待下发函件', value: pendingLetters, note: '手动发函', path: '/warning/disposal?status=待下发' },
    { label: '待跟踪处置', value: warnings.filter(item => /跟踪|执行/.test(item.status)).length, note: '预警处置', path: '/warning/disposal' },
    { label: '待审核终报', value: events.filter(item => item.status === '终报审核中').length, note: '重大事件', path: '/major-events' },
    { label: '重大风险事件', value: events.length, note: '全部机构', path: '/major-events' },
    { label: '数据报送异常', value: reports.filter(item => item.status !== '已报送').length, note: '报送检查', path: '/reports' },
  ] : [
    { label: '本机构待办事项', value: tasks.length, note: currentInstitution, path: '/workbench' },
    { label: '本机构红灯预警', value: red, note: currentInstitution, path: '/warning/disposal?level=红灯' },
    { label: '本机构黄灯预警', value: yellow, note: currentInstitution, path: '/warning/disposal?level=黄灯' },
    { label: '待反馈原因分析', value: warnings.filter(item => item.workflow?.currentNodeId.endsWith('-reason')).length, note: '机构办理', path: '/warning/disposal' },
    { label: '待提交处置方案', value: warnings.filter(item => item.workflow?.currentNodeId.endsWith('-plan')).length, note: '机构办理', path: '/warning/disposal' },
    { label: '待提交续报', value: events.filter(item => item.workflow?.currentNodeId === 'event-execution-report').length, note: '重大事件', path: '/major-events' },
    { label: '待提交终报', value: events.filter(item => item.status === '待终报').length, note: '重大事件', path: '/major-events' },
    { label: '本机构数据报送', value: reports.length, note: '报表与报告', path: '/reports' },
  ];

  return {
    mode: management ? 'management' : 'institution', title: management ? `${role}管理工作台` : `${currentInstitution}工作台`,
    description: management ? '集团范围风险监测、管理、跟踪和协调工作台。' : '本机构报送、反馈、处置和跟踪工作台。',
    statistics, tasks, institutions: institutionRows, focus, recent,
    concentrationSummary: concentrationSummaryFor(concentrationData, role),
  };
};
