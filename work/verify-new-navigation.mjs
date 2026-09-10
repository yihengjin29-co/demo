import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const app = fs.readFileSync('src/App.tsx', 'utf8');
const permissions = fs.readFileSync('src/services/permissionService.ts', 'utf8');
const groupDashboard = fs.readFileSync('src/dashboard/GroupDashboard.tsx', 'utf8');
const groupDashboardCss = fs.readFileSync('src/dashboard/group-dashboard.css', 'utf8');
const overrides = fs.readFileSync('src/overrides.css', 'utf8');

const checks = {
  topLevelOrder: ['首页', '驾驶舱', '风险偏好管理', '风险限额管理', '风险指标管理', '风险预警与处置', '风险报告管理', '知识库管理', '数据管理', 'AI应用', '基础与系统管理']
    .every((label, index, labels) => index === 0 || app.indexOf(`label: '${labels[index - 1]}'`) < app.indexOf(`label: '${label}'`)),
  nestedReportMenu: app.includes("{ label: '报表管理', children:") && ['报表中心', '风险看板', '资本看板'].every(label => app.includes(`label: '${label}'`)),
  riskBoardGroupOnly: app.includes("{ label: '风险看板', path: '/dashboard', roles: ['集团'] }") && app.includes("return role === '集团';"),
  institutionReadOnly: app.includes("queryOnlyFor: ['各金融机构']") && permissions.includes('canAccessRiskPreference = (role: Role) => roleLabels.includes(role)'),
  cockpitRoleSplit: app.includes("role === '各金融机构' ? <InstitutionCockpit") && app.includes('<GroupDashboard navigate={navigate} />'),
  institutionPrototypeConnected: app.includes('/institution-cockpit/index.html?name=') && app.includes('institution-cockpit-host'),
  groupLabelsRemoved: !groupDashboard.includes('市属国企') && !groupDashboard.includes('集团控股平台'),
  ownershipFontsRaised: groupDashboardCss.includes('.gd-ownership-root b,.gd-ownership-holding b { font-size:16px;') && groupDashboardCss.includes('.gd-ownership-institutions button b { font-size:16px;'),
  thirdLevelStyled: overrides.includes('.menu-children.level-2') && overrides.includes('.menu-child.active-child'),
  cockpitFrameStyled: overrides.includes('.app:has(.institution-cockpit-host)') && overrides.includes('.institution-cockpit-back'),
  embeddedAiStyled: overrides.includes('.smart-assistant-panel.embedded') && overrides.includes('.ai-application-page'),
};

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear(),
};
globalThis.window = {
  location: { pathname: '/workbench', href: 'http://localhost:4173/workbench' },
  history: { pushState() {}, replaceState() {} },
  addEventListener() {}, removeEventListener() {}, scrollTo() {},
};
globalThis.document = { querySelector: () => null };

const vite = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' });
try {
  const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
  const render = (role, path) => {
    storage.set('demo-authenticated', 'true');
    storage.set('demo-role', role);
    window.location.pathname = path;
    window.location.href = `http://localhost:4173${path}`;
    return renderToStaticMarkup(React.createElement(App));
  };
  const groupMenu = render('集团', '/dashboard');
  const holdingMenu = render('金控公司', '/reports');
  const institutionPreferenceMenu = render('各金融机构', '/warning/risk-preference');
  const institutionIndicatorMenu = render('各金融机构', '/indicators/maintenance');
  const institutionCockpit = render('各金融机构', '/cockpit');
  const groupCockpit = render('集团', '/cockpit');
  const aiApplication = render('集团', '/ai-assistant');
  checks.renderedRoleMenus = groupMenu.includes('风险看板') && !holdingMenu.includes('风险看板') && !institutionPreferenceMenu.includes('风险看板') && institutionPreferenceMenu.includes('仅查询') && institutionIndicatorMenu.includes('仅查询');
  checks.renderedInstitutionCockpit = institutionCockpit.includes('institution-cockpit-host') && institutionCockpit.includes('institution-cockpit/index.html?name=');
  checks.renderedGroupCockpit = groupCockpit.includes('集团及国资公司驾驶舱') && !groupCockpit.includes('市属国企') && !groupCockpit.includes('集团控股平台');
  checks.renderedAiApplication = aiApplication.includes('AI应用 · 智能问答') && aiApplication.includes('smart-assistant-panel embedded') && !aiApplication.includes('smart-assistant-launcher');
} finally {
  await vite.close();
}

console.log(JSON.stringify(checks, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
