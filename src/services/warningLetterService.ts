import type { DemoState, Role, WarningRule } from '../types';
import { createLog } from './storage';

export const letterDeliveryModeLabels: Record<NonNullable<WarningRule['letterDeliveryMode']>, string> = {
  auto: '亮灯直接发函',
  none: '只亮灯不发函',
  manual: '亮灯后手动发函',
};

export const warningLetterService = {
  send(state: DemoState, id: string, operator: Role) {
    const item = state.warningDisposals.find(candidate => candidate.id === id);
    if (!item || item.letterDeliveryMode !== 'manual' || item.letterStatus !== '待下发') return false;
    item.letterStatus = '已下发';
    item.letterSentBy = operator;
    item.letterSentAt = new Date().toLocaleString('zh-CN', { hour12: false });
    item.logs.push(createLog('手动下发提示函', `${operator} 手动下发 ${item.letterNo}`, operator));
    return true;
  },
};
