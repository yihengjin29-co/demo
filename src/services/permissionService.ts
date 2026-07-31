import type { Role } from '../types';

export const roleLabels: Role[] = ['集团管理层', '集团金融机构管理部门经办岗', '集团金融机构管理部门审核岗', '金控公司经办岗', '金控公司审核岗', '并表金融机构经办岗', '并表金融机构审核岗'];
const operational: Role[] = ['金控公司经办岗', '并表金融机构经办岗'];
const reviewers: Role[] = ['集团管理层', '集团金融机构管理部门审核岗', '金控公司审核岗'];
export const can = (role: Role, action: string) => {
  if (['view', 'query', 'export', 'history'].includes(action)) return true;
  if (action === 'preference-edit' || action === 'preference-create' || action === 'rule-config') return role === '金控公司经办岗';
  if (action === 'rule-approve' || action === 'review') return reviewers.includes(role);
  if (action === 'institution-submit' || action === 'feedback') return operational.includes(role);
  if (action === 'event-create' || action === 'report-upload' || action === 'special-create') return role === '并表金融机构经办岗' || role === '金控公司经办岗';
  if (action === 'state-edit') return role === '金控公司经办岗';
  if (action === 'delete') return role === '金控公司经办岗' || role === '集团金融机构管理部门经办岗';
  return true;
};
