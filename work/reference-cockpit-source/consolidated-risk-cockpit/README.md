# 并表风险驾驶舱 · 完整源码

集团 / 国资公司高层领导共用的风险监测驾驶舱交互原型，采用深蓝色单屏三层布局。本包依据当前已确认页面整理，不改变原页面内容及交互。

## 直接使用

使用桌面浏览器打开根目录的 `index.html` 即可。页面已内嵌全部样式、脚本、SVG 图形和模拟数据，不需要安装依赖或启动后端服务。浏览器本地存储只用于保存演示偏好；不同设备不会同步。浏览器可能限制本地文件存储或全屏操作，受限时可通过普通静态网站服务访问。

**所有指标、金额、阈值、资讯、重大事件、处置报告和附件均为模拟，不代表相关机构实际情况。** 此交付为前端交互原型，不包含正式登录、权限校验、数据库、真实接口、审批办理或自动发函服务。

## 目录说明

```text
index.html                       可直接打开的完整单文件页面
package.json                     构建与测试命令，无第三方依赖
src/
  page.html                      页面框架、标题和月份选项
  styles/                        7 个分层样式文件
  scripts/                       8 个运行脚本文件
scripts/
  build.mjs                      将源码内嵌生成 index.html
  check.mjs                      一次运行构建和全部测试
tests/
  package-integrity.mjs           可重建性、依赖与语法检查
  qa-warning-classification.cjs   月度预警分类与统计校验
  qa-event-org-details.cjs        重大事件报告及机构下钻校验
docs/
  设计校核与使用说明.md            交互说明、统计口径和业务边界
  验证说明.md                    本次交付的核验范围
```

`src/page.html` 是构建模板，不能代替根目录 `index.html` 直接使用。源文件按职责分开维护，构建时按固定顺序合并到单文件，不依赖旧版页面、其他项目目录或原电脑路径。

## 功能范围

- 纵览：并表金融机构、本月黄灯、本月红灯、重大风险事件数量及较上月变化。
- 风险矩阵：机构与风险类别坐标底座、红黄旗、灯色状态及机构 / 风险类别下钻。
- 关键指标：并表指标、当前值、阈值状态、趋势图；多选添加、删除、筛选和分页。
- 风险舆情：连续循环滚动、主体标签、详情及模拟投资敞口。
- 重大事件：分类清单、完整报告、处置方案、当前流程、续报及附件示例。
- 明细交互：分类筛选、指标来源追溯、预警处置轨迹、弹窗返回、月份联动。

## 源码分工

| 文件 | 主要内容 |
| --- | --- |
| `src/scripts/base-runtime.js` | 基础指标样例、通用状态、格式化、阈值判定、趋势图与来源追溯工具 |
| `src/scripts/detail-data.js` | 机构及月份范围、补充指标、月度预警、舆情与事件等模拟数据 |
| `src/scripts/continuous-feed.js` | 连续循环滚动、暂停及恢复控制 |
| `src/scripts/metric-selection.js` | 指标多选、筛选、分页与浏览器偏好存储 |
| `src/scripts/warning-list.js` | 本月红黄灯清单分类、过滤与处置链接 |
| `src/scripts/org-monitoring.js` | 机构资本 / 风险概览、状态统计与明细筛选 |
| `src/scripts/event-reports.js` | 重大事件分类、完整报告、处置流程与材料预览 |
| `src/scripts/executive-view.js` | 首页组合、旗帜矩阵、弹窗路由、事件绑定及页面启动 |

样式依次加载 `base.css`、`screen-layout.css`、`executive-view.css`、`detail-layout.css`、`flag-layout.css`、`custom-panels.css`、`report-dialogs.css`，分别覆盖基础样式、单屏布局、首页布局、明细布局、旗帜、指标与资讯面板、报告弹窗。为保持现有外观，请保留加载顺序。

脚本也按 `scripts/build.mjs` 列示的顺序加载，共享同一运行上下文，并非独立 ES 模块；部分后置定义用于补充或替换基础原型逻辑。修改数据时请同时核对机构范围、指标标识、观察月份、阈值及事件关联，避免仅修改展示文字。

## 修改与构建

运行构建和测试需要 Node.js 22 或以上版本，无需执行 `npm install`。在本目录运行：

```bash
node scripts/build.mjs
node tests/package-integrity.mjs
node tests/qa-warning-classification.cjs
node tests/qa-event-org-details.cjs
```

也可使用 `node scripts/check.mjs` 一次执行构建与全部测试；安装了 npm 的环境也支持 `npm run check`。修改 `src/` 后重新构建并刷新页面；不要只修改 `index.html`，否则下次构建会覆盖修改。

## 交付边界

本包包含当前版本运行所需的全部前端源码及有效的逻辑测试，不包含历史草稿、临时截图、部署账号信息或其他项目资料。原工作目录不作改动。静态托管时仅需发布 `index.html`；真实数据接入、机构权限及流程办理需另行建设后端服务。
