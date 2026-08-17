import fs from 'node:fs';

const app = fs.readFileSync('C:/Users/Yiheng.jin/demo/src/App.tsx', 'utf8');
const permission = fs.readFileSync('C:/Users/Yiheng.jin/demo/src/services/permissionService.ts', 'utf8');
const checks = {
  riskReportMenu: app.includes("{ label: '风险报告'") && ['重大风险事件报告', '定期风险报告', '专项风险报告'].every(label => app.includes(`label: '${label}'`)),
  removedOldTopMenus: !app.includes("{ label: '重大风险事件管理', icon:") && !app.includes("{ label: '定期报告', icon:") && !app.includes("{ label: '专项风险管理', icon:"),
  indicatorQueryMenu: app.includes("{ label: '指标查询', path: '/indicators/query' }") && !app.includes("{ label: '最新期指标状态', path:"),
  indicatorDefaultLatest: app.includes("hasPeriodQuery ? indicatorPeriodService.history") && app.includes(": indicatorPeriodService.latest"),
  indicatorRange: app.includes('periodStart') && app.includes('periodEnd') && app.includes('record.periodOrder >= startOrder') && app.includes('record.periodOrder <= endOrder'),
  indicatorColumnsAndExport: ['序号', '指标编码', '指标名称', '监测频率', '指标值', '当期亮灯情况', '累计亮灯情况', '指标定义', '指标类型', '指标子类', '适用机构', '预测范围', '黄灯规则', '红灯规则', '指标期次'].every(label => app.includes(label)) && app.includes("downloadCSV('指标查询.csv'"),
  legacyIndicatorRoutes: app.includes("path === '/indicators/latest-status'") && app.includes("replace('/indicators/query')") && app.includes("path.replace('/reports/indicator/', '/indicators/query/')"),
  reportCenterTabs: ['管理报表', '专题分析', '监管报表', '报表记录'].every(label => app.includes(label)),
  reportCenterDescription: app.includes('集中提供并表管理相关报表、专题分析及监管报表的统一查询、生成和应用入口。'),
  reportActions: ['生成报表', '上传报表', '进入分析', '生成监管报表', '下载历史版本'].every(label => app.includes(label)),
  permissionsPreserved: app.includes("can(role, 'report-upload'") && permission.includes("path === '/indicators/query'"),
  noGarbledNewLabel: !app.includes('閲嶅ぇ椋庨櫓浜嬩欢瀹氫箟绠＄悊'),
};

console.log(JSON.stringify(checks, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
