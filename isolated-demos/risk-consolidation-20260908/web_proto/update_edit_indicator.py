# -*- coding: utf-8 -*-
"""Update edit indicator form"""
import os

HTML = r'D:\work\AI\sig\rics\output\web_proto\pref-scheme.html'

with open(HTML, 'r', encoding='utf-8') as f:
    content = f.read()

old = "      var h = '<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:14px\">';\n      h += '<div class=\"filter-group\"><label>指标编号</label><input value=\"RPI-001\" disabled style=\"width:100%\"></div>';\n      h += '<div class=\"filter-group\"><label>指标名称</label><input value=\"资本充足率\" style=\"width:100%\"></div>';\n      h += '<div class=\"filter-group\"><label>类型</label><select style=\"width:100%\"><option selected>资本</option><option>集中度风险</option><option>流动性风险</option></select></div>';\n      h += '<div class=\"filter-group\"><label>目标偏好</label><input value=\"12%\" style=\"width:100%\"></div>';\n      h += '<div class=\"filter-group\"><label>生效日期</label><input type=\"date\" value=\"2026-01-01\" style=\"width:100%\"></div>';\n      h += '<div class=\"filter-group\"><label>失效日期</label><input type=\"date\" value=\"2026-12-31\" style=\"width:100%\"></div></div>';\n      openModal('编辑指标',h); return;"

new = "      var h = '<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:14px\">';\n      h += '<div class=\"filter-group\"><label>指标编号</label><input value=\"RPI-001\" disabled style=\"width:100%\"></div>';\n      h += '<div class=\"filter-group\"><label>类型</label><select style=\"width:100%\"><option selected>资本</option><option>集中度风险</option><option>流动性风险</option></select></div>';\n      h += '<div class=\"filter-group\" style=\"grid-column:1/-1\"><label>指标名称</label><input value=\"资本充足率\" style=\"width:100%\"></div>';\n      h += '<div class=\"filter-group\"><label>操作符</label><select style=\"width:100%\"><option>大于</option><option selected>大于等于</option><option>小于</option><option>小于等于</option></select></div>';\n      h += '<div class=\"filter-group\"><label>目标偏好阈值</label><input value=\"12%\" style=\"width:100%\"></div>';\n      h += '<div class=\"filter-group\"><label>生效日期</label><input type=\"date\" value=\"2026-01-01\" style=\"width:100%\"></div>';\n      h += '<div class=\"filter-group\"><label>失效日期</label><input type=\"date\" value=\"2026-12-31\" style=\"width:100%\"></div>';\n      h += '<div class=\"filter-group\" style=\"grid-column:1/-1\"><label>偏好说明</label><textarea style=\"width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;min-height:60px;font-family:inherit;font-size:13px;background:var(--card-bg);color:var(--text)\" placeholder=\"请输入偏好说明\"></textarea></div>';\n      h += '<div class=\"filter-group\" style=\"grid-column:1/-1\"><label>备注</label><textarea style=\"width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;min-height:60px;font-family:inherit;font-size:13px;background:var(--card-bg);color:var(--text)\" placeholder=\"请输入备注\"></textarea></div></div>';\n      openModal('编辑指标',h); return;"

content = content.replace(old, new)

with open(HTML, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')