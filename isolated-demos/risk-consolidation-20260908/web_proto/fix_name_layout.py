# -*- coding: utf-8 -*-
"""Move 方案名称 to its own row in all three forms"""
import os

HTML = r'D:\work\AI\sig\rics\output\web_proto\pref-scheme.html'

with open(HTML, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add form
old = '方案编号</label><input placeholder="自动生成" disabled style="width:100%"></div>+\n\t    \'<div class="filter-group"><label>方案名称'
new = '方案编号</label><input placeholder="自动生成" disabled style="width:100%"></div>+\n\t    \'<div class="filter-group" style="grid-column:1/-1"><label>方案名称'
content = content.replace(old, new)

# 2. Edit form
old = 'RAP-2026-001" disabled style="width:100%"></div>+\n\t      \'<div class="filter-group"><label>方案名称'
new = 'RAP-2026-001" disabled style="width:100%"></div>+\n\t      \'<div class="filter-group" style="grid-column:1/-1"><label>方案名称'
content = content.replace(old, new)

# 3. View modal
old = 'RAP-2026-001</p></div>+\n\t      \'<div><label style="color:var(--text-muted);font-size:11px;display:block;margin-bottom:4px">状态</label><p><span class="tag tag-success">已生效</span></p></div>+\n\t      \'<div><label style="color:var(--text-muted);font-size:11px;display:block;margin-bottom:4px">方案名称'
new = 'RAP-2026-001</p></div>+\n\t      \'<div><label style="color:var(--text-muted);font-size:11px;display:block;margin-bottom:4px">状态</label><p><span class="tag tag-success">已生效</span></p></div>+\n\t      \'<div style="grid-column:1/-1"><label style="color:var(--text-muted);font-size:11px;display:block;margin-bottom:4px">方案名称'
content = content.replace(old, new)

with open(HTML, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')