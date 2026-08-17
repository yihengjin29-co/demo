$path = 'C:\Users\Yiheng.jin\demo\src\App.tsx'
$content = Get-Content -Raw -Encoding UTF8 -LiteralPath $path
$content = $content.Replace("breadcrumb={['重大风险事件管理', '重大风险事件定义管理']}", "breadcrumb={['风险报告', '重大风险事件报告', '重大风险事件定义管理']}")
$content = $content.Replace("breadcrumb={['重大风险事件管理', '重大风险事件定义管理', item.name]}", "breadcrumb={['风险报告', '重大风险事件报告', '重大风险事件定义管理', item.name]}")
$content = $content.Replace("breadcrumb={['重大风险事件管理', '重大风险事件定义管理', existing ? '编辑' : '新增']}", "breadcrumb={['风险报告', '重大风险事件报告', '重大风险事件定义管理', existing ? '编辑' : '新增']}")
$content = $content.Replace("breadcrumb={['重大风险事件管理']}", "breadcrumb={['风险报告', '重大风险事件报告']}")
$content = $content.Replace("breadcrumb={['重大风险事件管理', editing ? '编辑事件首报' : '新增事件首报']}", "breadcrumb={['风险报告', '重大风险事件报告', editing ? '编辑事件首报' : '新增事件首报']}")
$content = $content.Replace("breadcrumb={['重大风险事件管理', item.code, '进度总览']}", "breadcrumb={['风险报告', '重大风险事件报告', item.code, '进度总览']}")
$content = $content.Replace("breadcrumb={['重大风险事件管理', item.code]}", "breadcrumb={['风险报告', '重大风险事件报告', item.code]}")
$content = $content.Replace("breadcrumb={['重大风险事件管理', item.code, node.name]}", "breadcrumb={['风险报告', '重大风险事件报告', item.code, node.name]}")
$content = $content.Replace('title="重大风险事件管理" breadcrumb=', 'title="重大风险事件报告" breadcrumb=')
$content = $content.Replace('inline={behindEditorModal}>', 'inline={behindEditorModal} actions={<Button variant="secondary" onClick={() => navigate(''/major-events/definitions'')}>重大风险事件定义管理</Button>}>')
$content = $content.Replace("breadcrumb={['定期报告']}", "breadcrumb={['风险报告', '定期风险报告']}")
$content = $content.Replace("breadcrumb={['定期报告', existing ? '编辑' : '报告上传']}", "breadcrumb={['风险报告', '定期风险报告', existing ? '编辑' : '报告上传']}")
$content = $content.Replace("breadcrumb={['专项风险管理',", "breadcrumb={['风险报告', '专项风险报告',")
$content = $content.Replace("breadcrumb={['专项风险管理']}", "breadcrumb={['风险报告', '专项风险报告']}")
Set-Content -Encoding UTF8 -LiteralPath $path -Value $content
