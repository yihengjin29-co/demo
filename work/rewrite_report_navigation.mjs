import fs from 'node:fs';

const file = 'C:/Users/Yiheng.jin/demo/src/App.tsx';
let source = fs.readFileSync(file, 'utf8');

const replacements = [
  ["breadcrumb={['重大风险事件管理', '重大风险事件定义管理']}", "breadcrumb={['风险报告', '重大风险事件报告', '重大风险事件定义管理']}"],
  ["breadcrumb={['重大风险事件管理', '重大风险事件定义管理', item.name]}", "breadcrumb={['风险报告', '重大风险事件报告', '重大风险事件定义管理', item.name]}"],
  ["breadcrumb={['重大风险事件管理', '重大风险事件定义管理', existing ? '编辑' : '新增']}", "breadcrumb={['风险报告', '重大风险事件报告', '重大风险事件定义管理', existing ? '编辑' : '新增']}"],
  ["breadcrumb={['重大风险事件管理']}", "breadcrumb={['风险报告', '重大风险事件报告']}"],
  ["breadcrumb={['重大风险事件管理', editing ? '编辑事件首报' : '新增事件首报']}", "breadcrumb={['风险报告', '重大风险事件报告', editing ? '编辑事件首报' : '新增事件首报']}"],
  ["breadcrumb={['重大风险事件管理', item.code, '进度总览']}", "breadcrumb={['风险报告', '重大风险事件报告', item.code, '进度总览']}"],
  ["breadcrumb={['重大风险事件管理', item.code]}", "breadcrumb={['风险报告', '重大风险事件报告', item.code]}"],
  ["breadcrumb={['重大风险事件管理', item.code, node.name]}", "breadcrumb={['风险报告', '重大风险事件报告', item.code, node.name]}"],
  ['title="重大风险事件管理" breadcrumb=', 'title="重大风险事件报告" breadcrumb='],
  ['>閲嶅ぇ椋庨櫓浜嬩欢瀹氫箟绠＄悊</Button>', '>重大风险事件定义管理</Button>'],
  ["breadcrumb={['定期报告']}", "breadcrumb={['风险报告', '定期风险报告']}"],
  ["breadcrumb={['定期报告', existing ? '编辑' : '报告上传']}", "breadcrumb={['风险报告', '定期风险报告', existing ? '编辑' : '报告上传']}"],
  ["breadcrumb={['专项风险管理',", "breadcrumb={['风险报告', '专项风险报告',"],
  ["breadcrumb={['专项风险管理']}", "breadcrumb={['风险报告', '专项风险报告']}"],
];

for (const [before, after] of replacements) source = source.split(before).join(after);

source = source.replace(
  /(<Page title="专项风险提示与管理" breadcrumb=\{\['风险报告', '专项风险报告', '专项风险提示与管理'\]\})>/,
  `$1 actions={<><Button variant="secondary" onClick={() => navigate('/special-risks/feedback')}>专项风险查看与反馈</Button>{can(role, 'special-create') && <Button onClick={() => navigate('/special-risks/drafts')}>＋ 新建专项风险提示</Button>}</>}>`,
);

fs.writeFileSync(file, source, 'utf8');
