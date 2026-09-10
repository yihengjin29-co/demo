# 风险并表原型（隔离运行）

此目录从 `风险并表原型20260908(2).zip` 独立解压，不使用或修改上层原 DEMO 的源码、依赖与配置。

## 启动

在 PowerShell 中进入本目录后运行：

```powershell
.\start-local.ps1
```

默认访问地址：<http://127.0.0.1:8098/>

如需更换端口：

```powershell
.\start-local.ps1 -Port 8099
```

## 停止

```powershell
.\stop-local.ps1
```

服务只监听本机回环地址。PID 与日志保存在本目录：

- `.local-server.pid`
- `local-server.out.log`
- `local-server.err.log`

页面中的 Font Awesome 和 ECharts 仍使用原压缩包内配置的公共 CDN，断网时图标或图表可能无法显示。
