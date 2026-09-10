# -*- coding: utf-8 -*-
"""Add tolerance table to view modal"""
import os

HTML = r'D:\work\AI\sig\rics\output\web_proto\pref-scheme.html'

with open(HTML, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the view modal's closing line and add tolerance table
old = '2026年度集团风险偏好方案。</p></div>\');\n\t  };\n\t});'
new = '2026年度集团风险偏好方案。</p></div>\'+\n\'<div><label style="color:var(--text-muted);font-size:11px;display:block;margin-bottom:8px;font-weight:600">容忍度指标</label>\'+\n\'<table style="width:100%;font-size:11px;border-collapse:collapse;margin-top:4px"><thead><tr style="background:var(--bg)"><th style="padding:5px 6px;text-align:left">指标编号</th><th style="padding:5px 6px;text-align:left">指标名称</th><th style="padding:5px 6px;text-align:left">类型</th><th style="padding:5px 6px;text-align:left">目标偏好</th><th style="padding:5px 6px;text-align:left">生效日期</th><th style="padding:5px 6px;text-align:left">失效日期</th><th style="padding:5px 6px;text-align:left">状态</th></tr></thead><tbody>\'+\n\'<tr><td style="padding:5px 6px;border-bottom:1px solid var(--border)">RPI-001</td><td style="padding:5px 6px">资本充足率</td><td style="padding:5px 6px">资本</td><td style="padding:5px 6px">>=12%</td><td style="padding:5px 6px">2026-01-01</td><td style="padding:5px 6px">2026-12-31</td><td style="padding:5px 6px"><span class="tag tag-success">启用</span></td></tr>\'+\n\'<tr><td style="padding:5px 6px;border-bottom:1px solid var(--border)">RPI-002</td><td style="padding:5px 6px">杠杆率</td><td style="padding:5px 6px">资本</td><td style="padding:5px 6px">>=7%</td><td style="padding:5px 6px">2026-01-01</td><td style="padding:5px 6px">2026-12-31</td><td style="padding:5px 6px"><span class="tag tag-success">启用</span></td></tr>\'+\n\'</tbody></table></div>\');\n\t  };\n\t});'

content = content.replace(old, new)

with open(HTML, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')