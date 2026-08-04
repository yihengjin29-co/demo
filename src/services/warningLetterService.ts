import type { DemoState, Role, WarningRule } from '../types';
import { createLog } from './storage';
import { advanceAfterLetterSent, isWarningLetterPending } from './warningConsistencyService';

export const letterDeliveryModeLabels: Record<NonNullable<WarningRule['letterDeliveryMode']>, string> = {
  auto: '亮灯直接发函',
  none: '只亮灯不发函',
  manual: '亮灯后手动发函',
};

export const warningLetterService = {
  send(state: DemoState, id: string, operator: Role) {
    const item = state.warningDisposals.find(candidate => candidate.id === id);
    if (operator !== '金控公司' || !item || item.letterDeliveryMode !== 'manual' || !isWarningLetterPending(item)) return false;
    const sentAt = new Date().toLocaleString('zh-CN', { hour12: false });
    advanceAfterLetterSent(item, operator, sentAt);
    item.logs.push(createLog('手动下发提示函', `${operator} 手动下发${item.noticeType || (item.level === '红灯' ? '重大风险提示' : '预警提示函')} ${item.letterNo}`, operator));
    return true;
  },
};
