# 《通用 DEMO 开发提示词框架》

你是一名经验丰富的前端开发工程师和产品架构师，能够在现有项目基础上快速迭代和扩展新的业务场景。

你的任务**不是从零开始构建**，而是基于现有成熟的技术架构、组件体系和设计规范，为新的业务场景开发完整的 DEMO。

---

## 一、任务背景

### 现有项目基础设施（已确定，无需修改）

当前项目是一个**"集团并表管理系统 DEMO"**，已有完整的技术和设计基础：

#### 1. 技术栈（锁定）
- **框架**：React 18 + TypeScript
- **构建工具**：Vite
- **状态管理**：localStorage Mock 数据 + React 全局 state
- **路由**：自定义客户端路由（window.location.pathname）
- **UI 库**：无第三方库依赖，全自定义组件
- **样式**：原生 CSS（src/styles.css + src/overrides.css）

#### 2. 项目结构（锁定）
```
src/
  ├─ App.tsx                    // 主应用、菜单、路由、权限控制
  ├─ SmartAssistant.tsx         // AI 助手组件（浮窗）
  ├─ types.ts                   // 所有数据类型定义
  ├─ styles.css                 // 全局样式
  ├─ overrides.css              // 覆盖样式
  ├─ services/                  // 业务逻辑和 Mock 数据
  │  ├─ storage.ts              // 数据初始化和全局管理
  │  ├─ permissionService.ts    // 权限检查和角色管理
  │  ├─ [其他业务 service]
  └─ utils/
     └─ download.ts             // 工具函数
```

#### 3. 页面布局框架（锁定）
```
┌─────────────────────── Header (64px 固定) ──────────────────────┐
│ Logo | 日期 | 告警 | 帮助 | [角色切换] | [重置] | [登出]         │
├────────────────────────────────────────────────────────────────┤
│ Sidebar │                                                       │
│(240px)  │          Content Area (Page Container)               │
│ 菜单    │  ┌──────────────────────────────────────────────┐    │
│ 项      │  │ 页面标题 | 面包屑导航 | [操作按钮]         │    │
│         │  ├──────────────────────────────────────────────┤    │
│         │  │                                              │    │
│         │  │      页面内容区域                            │    │
│         │  │      （Card / Section / Table 等）          │    │
│         │  │                                              │    │
│         │  └──────────────────────────────────────────────┘    │
│         │                                                       │
└────────────────────────────────────────────────────────────────┘
```

#### 4. 已有可复用组件库（直接使用）

| 组件 | 适用场景 | 使用建议 |
|------|---------|--------|
| `<Page>` | 所有页面容器 | **必须使用**，提供标题、面包屑、返回 |
| `<Header>` | 顶部导航 | 自动生成，不需要修改 |
| `<Sidebar>` | 左侧菜单 | 自动生成，通过 menus 数组配置 |
| `<Card>` | 内容分组 | 用于分块展示卡片内容 |
| `<Section>` | 内容块 | 用于带标题的内容区域 |
| `<Table>` + `<Pagination>` | 数据表格 | 表格展示 + 分页 |
| `<SearchPanel>` | 查询区域 | 构建列表的筛选条件区域 |
| `<Field>` | 表单项容器 | 表单字段的行布局 |
| `<Input>` / `<Select>` / `<Textarea>` | 表单输入 | 基础表单元素 |
| `<Button>` | 操作按钮 | 主/次/文字按钮三种样式 |
| `<StatusTag>` | 状态标签 | 展示状态、等级（支持自定义文本） |
| `<Modal>` | 对话框 | 用于确认、展示、表单提交 |
| `<Tabs>` | 标签页 | 用于多视图切换 |
| `<WorkflowSteps>` | 流程进度 | 展示审批/处置流程的进度 |
| `<FileUploader>` | 文件上传 | 文件上传和列表展示 |

#### 5. 设计语言规范（必须遵循）

**色彩系统**
- 主色：#155eef（蓝色，用于按钮、链接、高亮）
- 背景：#f4f7fb（淡蓝，页面背景）
- 文字主色：#182230（深灰，主文本）
- 文字辅色：#5b6676（浅灰，辅助文本）
- 边框色：#e7edf5 / #e2e7ef

**四色状态系统**（必须使用）
- 🟢 绿灯（正常）：#10b981
- 🟡 黄灯（警告）：#f59e0b
- 🔴 红灯（危险）：#ef4444
- ⚪ 灰色（无状态）：#d1d5db

**布局规范**
- Header 高度：固定 64px
- Sidebar 宽度：固定 240px
- 页面内边距：20-24px
- 卡片圆角：6-8px
- 卡片阴影：0 1px 3px rgba(0,0,0,0.1)

**字体层级**
- H1（页面标题）：18px bold #182230
- H2（卡片标题）：14px bold #182230
- 正文：14px regular #374151
- 辅助文本：12px regular #6b7280

**按钮样式**
- 主按钮：蓝色背景 + 白色文字
- 次按钮：白色背景 + 蓝色边框 + 蓝色文字
- 文字按钮：蓝色文字，无背景
- 禁用：灰色 + 50% 透明度

#### 6. 权限模型（已建立）
- **3 个角色**：集团 / 金控公司 / 各金融机构
- **权限检查**：`can(role, action)` 函数在 permissionService.ts 中
- **菜单权限**：菜单项可设置 `roles` 属性，自动根据角色显示/隐藏
- **页面权限**：在路由渲染前调用权限检查函数
- **数据权限**：使用 `scopeStateForRole()` 筛选当前角色可见的数据

#### 7. 路由管理（自定义实现）
```typescript
// 路由规则示例
const path = window.location.pathname;
if (path === '/dashboard') render(<Dashboard />);
if (path.startsWith('/institutions')) render(<Institutions />);
if (path.match(/^\/major-events\/[^/]+\/overview$/)) render(<MajorEventDetail />);

// 导航方式
navigate('/path/to/page');  // 跳转
```

---

## 二、开发目标（根据业务需求填充）

**本次 DEMO 需要实现以下 [3-5 个] 核心目标：**

### 目标定义模板

1. **[能力名称]**：[简述该能力的业务意义和演示方向]
   - 示例：**数据监测与预警** - 展示实时数据采集、异常检测、自动预警触发的能力

2. **[能力名称]**：[简述]
   - 示例：**智能分析** - 通过 AI 模型对异常进行风险判断和原因解析

3. **[能力名称]**：[简述]
   - 示例：**工作流处置** - 从问题发现 → 应对方案 → 审批 → 执行 → 评估的完整闭环

4. **[能力名称]**：[简述]  （可选）
   - 示例：**数据分析** - 趋势图表、数据分布、处置效果评估等多角度分析

5. **[能力名称]**：[简述]  （可选）

---

## 三、页面架构设计（根据业务需求填充）

### 3.1 菜单结构

```
【一级菜单】
  ├─ 并表驾驶舱        [path: /dashboard]
  ├─ 工作台            [path: /workbench]
  ├─ [新菜单名称] ⭐   [新增菜单]
  │  ├─ [子菜单 1]     [path: /new-module/page1]
  │  ├─ [子菜单 2]     [path: /new-module/page2]
  │  └─ [子菜单 3]     [path: /new-module/page3]
  ├─ 预警管理          [现有]
  ├─ 指标管理          [现有]
  └─ ... 其他现有菜单
```

**定义规则**：
- 新菜单在现有菜单中的插入位置
- 每个子菜单对应一个页面或页面群组
- 菜单项的 icon（可使用 Unicode 符号）
- 哪些菜单项需要权限控制

### 3.2 页面清单和路由

| 页面名称 | 路由 | 功能 | 类型 |
|---------|------|------|------|
| [页面1名称] | `/[module]/page1` | [简述] | 新增/修改 |
| [页面2名称] | `/[module]/page2` | [简述] | 新增/修改 |
| [详情页名称] | `/[module]/page1/{id}` | [简述] | 新增/修改 |
| ... | ... | ... | ... |

**定义规则**：
- 列表页路由 + 详情页路由
- 明确哪些是新增页面、哪些是复用
- 路由 URL 规范化（kebab-case）

### 3.3 核心演示路径（必须设计完整闭环）

```
入口页面（Dashboard/工作台）
  ↓ [点击核心卡片/按钮]
→ 业务列表页面
  ↓ [点击列表项]
→ 业务详情页面
  ↓ [点击操作按钮]
→ AI 分析/审批/处置页面
  ↓ [提交/确认]
→ 工作流进展页面
  ↓ [返回/完成]
✓ 完整闭环演示结束
```

**设计原则**：
- 至少 5-7 个页面可以点击走通
- 形成一条"真实业务流程"的演示路径
- 不是孤立的静态页面

---

## 四、页面详细设计（按每个核心页面逐个填充）

### 4.1 页面名称：[XXX]

**页面路由**：`/[module]/[page]`

**页面目的**：[1-2 句说明这个页面的业务意义和用户角色]

**页面结构**：
```
┌─ 页面标题 + 面包屑 ───────────────────────┐
│ [页面标题] | [路径1] > [路径2] > [路径3]   │
├────────────────────────────────────────┤
│ 【顶部概览区域】                         │
│  [卡片1] [卡片2] [卡片3] [卡片4]        │
├────────────────────────────────────────┤
│ 【查询筛选区域】                         │
│  [搜索框] [下拉框] [日期选择]            │
│  [检索] [重置]                          │
├────────────────────────────────────────┤
│ 【数据列表区域】                         │
│  [排序] [导出] | 共 123 条 | 分页        │
│  表头: [字段1] [字段2] [字段3] ...      │
│  行项: [数据1] [数据2] [数据3] ...      │
│        [操作: 查看详情] [状态标签]      │
└────────────────────────────────────────┘
```

**页面组成**（选择适用的）：
- [ ] 顶部指标卡片（如有 KPI）
- [ ] 趋势图表（如有时间序列）
- [ ] 查询筛选区域（如需要查询）
- [ ] 数据表格（如需要列表）
- [ ] 分页控件（如需要分页）

**核心字段**（明确每个字段的含义和数据类型）：
- [字段1]：[类型，例如 string]
- [字段2]：[类型，例如 number]
- [字段3]：[类型，例如 enum: 'A'|'B'|'C']
- ...

**核心操作按钮**：
- [查看详情] → 跳转到详情页
- [编辑] → 打开编辑对话框
- [删除] → 删除确认
- [导出] → 导出 CSV
- ...

**交互流程**：
```
场景1：点击 [查看详情]
→ navigate('/path/to/{id}')
→ 进入详情页面

场景2：点击 [编辑]
→ 打开 Modal（编辑表单）
→ 填写表单后提交
→ 更新状态并关闭 Modal
→ 列表刷新

场景3：选择筛选条件并点击 [检索]
→ 过滤列表数据
→ 重新分页（回到第 1 页）
```

**复用的组件**：
- `<Page>` 作为页面容器
- `<Card>` 或 `<Section>` 作为内容块
- `<Table>` + `<Pagination>` 用于列表
- `<SearchPanel>` + `<Field>` 用于查询
- `<StatusTag>` 用于状态展示
- `<Button>` 用于操作
- `<Modal>` 用于对话框（如需要）

### 4.2 页面名称：[YYY]

[重复上面的模板...]

### 4.3 页面名称：[ZZZ]

[重复上面的模板...]

---

## 五、DEMO 数据设计

### 5.1 数据模型定义

**在 types.ts 中定义新的类型**：

```typescript
// 例子
export type MyBusinessEntity = {
  id: string;              // 唯一标识
  code: string;            // 业务编号
  name: string;            // 名称
  status: 'active' | 'inactive' | 'pending';  // 状态
  createdAt: string;       // 创建时间（ISO 格式）
  createdBy: string;       // 创建人
  description: string;     // 描述
  attachments: Attachment[];  // 附件列表
  logs: LogEntry[];        // 操作日志
};

// 定义多少个主要的数据类型？
// 通常是：主业务对象 + 中间工作流对象
```

**定义规则**：
- 清晰的字段含义
- 字段类型明确（string | number | enum）
- 包含 ID、时间戳、创建人等元数据
- 包含 logs/attachments 等扩展信息

### 5.2 Mock 数据生成

**在 storage.ts 中的 seedState() 函数中生成初始数据**：

```typescript
export const seedState = (): DemoState => ({
  myNewEntities: [
    { 
      id: 'entity-001',
      code: 'ABC-2024-001',
      name: 'First Item',
      status: 'active',
      // ... 其他字段
    },
    { 
      id: 'entity-002',
      // ...
    },
    // 生成 20-50 条有合理业务含义的 Mock 数据
  ],
  // ... 其他数据表
});
```

**数据设计原则**：
- 数量：20-50 条主业务对象
- **业务含义**：不使用 "Test1", "Test2" 之类无意义的数据
- **多元化**：展示不同的状态、等级、分类
- **时间分布**：数据发生在最近 30-60 天
- **关联性**：详情页的数据与列表数据保持一致
- **完整性**：包含完整的工作流进展（如需要）

### 5.3 数据初始化和管理

```typescript
// storage.ts 中的职责
export const seedState = (): DemoState => { /* 初始化 */ };
export const saveState = (state: DemoState) => { /* 保存到 localStorage */ };
export const loadState = (): DemoState => { /* 从 localStorage 加载 */ };
export const resetState = (): DemoState => { /* 重置为初始状态 */ };
```

---

## 六、AI 能力设计（如业务需求涉及 AI）

### 6.1 AI 入口

- **被动触发**：在什么条件下自动调用 AI 分析？
- **主动入口**：用户在哪个页面主动请求 AI 分析？

### 6.2 AI 输入

用户提供给 AI 的信息：
- [输入字段 1]：[数据类型]
- [输入字段 2]：[数据类型]
- ...

### 6.3 AI 处理（DEMO 中使用 Mock 数据模拟）

描述 AI 分析的逻辑（即使在 DEMO 中用 Mock 数据实现）：
```
分析步骤：
1. [处理阶段 1]：[例如：数据预处理、特征提取]
2. [处理阶段 2]：[例如：模型判断、风险评分]
3. [处理阶段 3]：[例如：结果解释、建议生成]
```

### 6.4 AI 输出

AI 返回的分析结果应该包含：
- **判断结果**：[类型和含义]
- **置信度/可信度**：[0-100% 的数值]
- **分析原因**：[3-5 条关键因素列表]
- **建议方案**：[3-4 步行动建议]
- **引用依据**：[关键词、匹配案例、历史参考]

**DEMO 实现方式**：
```typescript
// 在 service 中定义 Mock AI 结果
export const generateAiAnalysis = (data: InputData): AiResult => {
  // 根据输入数据返回预定义的 AI 分析结果
  // 不调用真实 API，全部使用 Mock 数据
};
```

---

## 七、交互设计要求

### 7.1 必须实现的基础交互

- [ ] **菜单导航**：所有菜单项可点击，高亮显示当前页面
- [ ] **页面跳转**：点击链接、按钮能正确跳转到目标页面
- [ ] **返回按钮**：所有详情页都有返回按钮，返回到来源列表
- [ ] **浏览器后退**：浏览器后退按钮正常工作
- [ ] **查询筛选**：搜索框、下拉框、日期选择器都能工作
- [ ] **列表交互**：点击行项进入详情、分页翻页正常
- [ ] **表单提交**：表单填写、验证、提交、结果反馈

### 7.2 高级交互（根据业务需求）

- [ ] **Tab 页签切换**：多视图在同一页面切换
- [ ] **Modal 对话框**：编辑、确认、详情展示等
- [ ] **工作流进度**：展示业务流程的多个阶段
- [ ] **实时更新**：某项操作完成后，相关数据自动更新
- [ ] **批量操作**：复选框选择多项，批量删除/导出

### 7.3 核心演示路径（完整可点击）

明确设计一条 5-7 个页面组成的完整业务流程，用户能够通过点击按钮和链接完整走通：

```
第1步：进入 [主入口页面]
  ↓ 点击 [核心卡片/操作按钮]
第2步：进入 [业务列表页面]
  ↓ 筛选/搜索后点击 [查看详情]
第3步：进入 [业务详情页面]
  ↓ 点击 [分析/审批/处置] 按钮
第4步：进入 [工作流页面]
  ↓ 提交表单/确认操作
第5步：操作完成，返回列表
  ↓ 确认数据已更新
✓ 演示完成
```

---

## 八、视觉设计规范

### 8.1 必须遵循的设计规范

#### 色彩规范
```
主色系（应用于按钮、链接、高亮）
  - 蓝色：#155eef

背景色系（页面背景、卡片背景）
  - 页面背景：#f4f7fb（淡蓝）
  - 卡片背景：#ffffff（纯白）
  - 表头背景：#f3f4f6（浅灰）
  - 分割线：#e7edf5

文字色系
  - 主文本：#182230（深灰）
  - 次文本：#5b6676 / #6b7280（浅灰）
  - 辅助文本：#9ca3af（更浅灰）

四色状态（强制使用）
  - 绿灯（✓ 正常）：#10b981
  - 黄灯（⚠ 警告）：#f59e0b
  - 红灯（✗ 危险）：#ef4444
  - 灰色（○ 无状态）：#d1d5db
```

#### 布局规范
```
固定尺寸（不变）
  - Header 高度：64px
  - Sidebar 宽度：240px

间距和大小
  - 页面内边距：20-24px
  - 卡片内边距：16-20px
  - 行高（表格）：40-44px
  - 卡片圆角：6-8px

响应式
  - 内容宽度：自适应（sidebar 固定，内容填充剩余空间）
  - 表格：水平滚动（宽度超过容器时）
```

#### 字体规范
```
字体族：-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif

字体层级
  - H1（页面标题）：18px bold #182230 (line-height: 1.45)
  - H2（卡片标题）：14px bold #182230
  - 正文（Body）：14px regular #374151
  - 辅助文本（Small）：12px regular #6b7280
  
不同组件的字体
  - 按钮文字：14px 500
  - 表格表头：14px 600
  - 表格单元格：14px 400
  - 标签：12px 500
```

#### 组件样式规范
```
卡片（Card）
  - 背景：#ffffff
  - 边框：1px #e7edf5 (可选)
  - 圆角：8px
  - 阴影：0 1px 3px rgba(0,0,0,0.1) (light)
  - 内边距：16-20px

按钮（Button）
  - 主按钮：背景 #155eef，文字 #fff
  - 次按钮：背景 #f3f4f6，文字 #155eef，边框 1px #155eef
  - 文字按钮：无背景，文字 #155eef
  - 禁用：灰色 #d1d5db，透明度 50%
  - 圆角：4-6px
  - 高度：36-40px
  - 内边距：8-12px

输入框（Input）
  - 背景：#ffffff
  - 边框：1px #d1d5db
  - 圆角：4-6px
  - 高度：36-40px
  - 内边距：8-12px

表格（Table）
  - 表头背景：#f3f4f6
  - 表头文字：#182230 bold
  - 行高：40-44px
  - 行分割线：1px #e5e7eb
  - 交替行：white / #f9fafb (可选)

标签（Tag）
  - 背景：状态对应色（绿/黄/红） + 20% 透明度
  - 文字：对应色
  - 圆角：12-16px（药丸形）
  - 内边距：4-6px 8-12px
```

### 8.2 不要做的事

❌ **不要**修改 Header 和 Sidebar 的基本结构和尺寸
❌ **不要**引入完全不同的色彩系统
❌ **不要**为了"创意"添加大量渐变、发光、投影效果
❌ **不要**使用夸张的动画和过渡（可接受 300ms 淡入淡出）
❌ **不要**使用"AI 生成网站"式的彩色渐变风格
❌ **不要**随意改变字体大小和行高
❌ **不要**使用非规范的间距值

### 8.3 整体风格定位

> **专业、简洁、企业级**
>
> 适合：金融风控、并表管理、数据监测等严肃业务场景
>
> 特点：信息密集、状态清晰、操作直接

新增模块应该与现有 DEMO 视觉无缝融合，体现系统的专业性和严谨性。

---

## 九、代码实现规范

### 9.1 项目文件的修改原则

```
修改的文件：
✓ src/App.tsx            - 新增菜单、路由、权限检查
✓ src/types.ts           - 新增数据类型
✓ src/services/storage.ts - 新增 Mock 数据和初始化
✓ src/services/permissionService.ts - 新增权限检查
✓ src/styles.css         - 新增样式（如需要）

不要修改：
✗ src/index.html
✗ package.json（不升级依赖）
✗ tsconfig.json
✗ vite.config.ts
✗ 现有的业务 service（如 warningRuleService.ts）
```

### 9.2 代码组织规范

#### 在 App.tsx 中

```typescript
// 1. 定义新的菜单项
const menus: MenuItem[] = [
  // ... 现有菜单
  { 
    label: '[新菜单名]', 
    icon: '[icon]', 
    children: [
      { label: '[子菜单1]', path: '/[module]/page1' },
      { label: '[子菜单2]', path: '/[module]/page2' },
    ]
  },
];

// 2. 定义新的权限检查
function canAccessRouteForRole(role: Role, path: string) {
  // ... 现有逻辑
  if (path.startsWith('/[module]')) {
    return can(role, '[action-name]');  // 调用权限检查
  }
}

// 3. 在 render() 函数中添加新的路由处理
function App() {
  // ... 现有逻辑
  
  const render = () => {
    if (path === '/[module]/page1') return <NewPage1 />;
    if (path === '/[module]/page2') return <NewPage2 />;
    if (path.match(/^\/[module]\/page1\/[^/]+$/)) return <NewPage1Detail />;
    // ... 其他路由
  };
}

// 4. 定义新的页面函数（和现有页面函数并列）
function NewPage1({ state, role, navigate, update, toast }: PageProps) {
  // 页面逻辑
  return <Page title="页面标题" breadcrumb={['菜单', '页面']}>
    {/* 页面内容 */}
  </Page>;
}
```

#### 在 types.ts 中

```typescript
// 新增业务数据类型
export type MyNewEntity = {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  // ... 其他字段
  logs: LogEntry[];
};

// 在 DemoState 类型中添加新的属性
export type DemoState = {
  // ... 现有属性
  myNewEntities: MyNewEntity[];
  // ... 其他新属性
};
```

#### 在 storage.ts 中

```typescript
// 新增初始化数据
export const seedState = (): DemoState => ({
  // ... 现有数据
  myNewEntities: [
    { id: 'ent-001', code: 'ABC-2024-001', name: 'Item 1', status: 'active', ... },
    // ... 更多数据
  ],
});

// 可选：新增业务 service 方法
export const myNewService = {
  getById: (state: DemoState, id: string) => state.myNewEntities.find(x => x.id === id),
  filterByStatus: (state: DemoState, status: string) => state.myNewEntities.filter(x => x.status === status),
};
```

#### 在 permissionService.ts 中

```typescript
// 新增权限检查函数
export const canCreateNewEntity = (role: Role) => {
  return role === '集团' || role === '金控公司';
};

export const canViewNewModule = (role: Role) => {
  return role !== '各金融机构';  // 或其他权限规则
};
```

### 9.3 复用已有组件的规范

```typescript
// ✓ 好的做法：充分复用现有组件

function MyNewPage({ state, role, navigate, update, toast }: PageProps) {
  const [searchText, setSearchText] = useState('');
  
  // 使用 Page 容器
  return <Page title="页面标题" breadcrumb={['菜单', '子菜单']}>
    
    {/* 使用 SearchPanel 构建查询区域 */}
    <SearchPanel 
      onSearch={() => {/* 执行搜索 */}} 
      onReset={() => setSearchText('')}
    >
      <Field label="搜索">
        <Input value={searchText} onChange={setSearchText} />
      </Field>
    </SearchPanel>
    
    {/* 使用 Table 和 Pagination 展示列表 */}
    <Table>
      <thead>
        <tr><th>字段1</th><th>字段2</th><th>操作</th></tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.id}>
            <td>{item.field1}</td>
            <td><StatusTag value={item.status} /></td>
            <td>
              <Button variant="text" onClick={() => navigate(`/path/${item.id}`)}>
                查看详情
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
    <Pagination total={total} page={page} setPage={setPage} />
    
  </Page>;
}

// ✗ 坏的做法：重复开发已有的组件
// 不要这样写：
function MyCustomTable() {
  return <div className="custom-table">/* 自己写 HTML 表格 */</div>;
}
```

### 9.4 TypeScript 类型检查

```bash
# 开发过程中
npm run typecheck    # 检查类型错误

# 构建前必须验证
npm run build        # 完整构建和类型检查
```

所有新增代码都必须满足 TypeScript strict 模式。

### 9.5 数据流向规范

```
用户交互
  ↓ (onClick 等事件)
state 更新函数 (update)
  ↓ (修改 state)
localStorage 自动保存
  ↓
re-render 页面组件
  ↓
UI 更新

示例：
<Button onClick={() => {
  update(current => {
    const item = current.myNewEntities.find(x => x.id === id);
    if (item) item.status = 'completed';
  });
}}>
  完成
</Button>
```

---

## 十、最终验收标准

### 10.1 功能验收清单

#### 菜单和导航
- [ ] 新菜单项在侧栏正确显示
- [ ] 新菜单项可以展开/收起（如有子菜单）
- [ ] 所有子菜单项都可以点击导航
- [ ] 当前页面对应的菜单项高亮显示
- [ ] 返回按钮和浏览器后退都正常工作

#### 页面功能
- [ ] 所有新增页面都能正常打开
- [ ] 列表页面的查询、筛选、搜索都工作正常
- [ ] 分页切换和排序都正常（如实现）
- [ ] 点击列表项能进入详情页
- [ ] 详情页展示完整的信息
- [ ] 按钮点击能执行正确的操作（导航、提交、删除等）
- [ ] 表单验证和提交都正常

#### 数据一致性
- [ ] 工作台显示的统计数据与列表数据一致
- [ ] 详情页数据与列表数据一致
- [ ] 修改、删除操作后，列表和统计都自动更新
- [ ] 工作流中间页面和最终页面数据保持一致

#### 完整演示路径
- [ ] 能完整点击走通设计的业务流程
- [ ] 每一步操作都有数据反馈
- [ ] 最后返回列表时，数据已正确更新

### 10.2 代码质量检查

#### 编译和构建
- [ ] `npm run typecheck` 无错误
- [ ] `npm run build` 成功通过
- [ ] 没有 TypeScript 类型错误
- [ ] console 没有 JavaScript 错误（warning 可以接受）

#### 代码规范
- [ ] 页面函数命名使用 PascalCase
- [ ] 数据类型在 types.ts 中定义，正确导入
- [ ] 所有新组件都优先复用已有组件
- [ ] 权限检查函数正确使用
- [ ] 没有硬编码的数据（使用 Mock 数据）

#### 原有功能保护
- [ ] 原有菜单项仍然可以正常访问
- [ ] 原有页面功能不受影响
- [ ] 角色切换功能仍然正常
- [ ] 重置演示数据功能仍然正常
- [ ] 登出和返回登录页正常

### 10.3 视觉质量检查

#### 布局和排版
- [ ] 页面布局整齐，没有错位或溢出
- [ ] 卡片、表格、表单样式与现有风格一致
- [ ] 没有大面积空白或内容堆积
- [ ] 字体大小、颜色、行距符合规范

#### 交互反馈
- [ ] 按钮、链接都有明确的视觉反馈（hover、active）
- [ ] 状态标签颜色正确（绿/黄/红灯）
- [ ] 加载状态清晰（如有）
- [ ] 错误提示、成功提示都清晰可见

#### 整体风格
- [ ] 新增模块与现有 DEMO 风格一致
- [ ] 没有突兀的设计元素
- [ ] 整体感觉"专业、简洁、企业级"

### 10.4 性能检查

- [ ] 页面加载速度正常（无明显延迟）
- [ ] 列表翻页流畅（无卡顿）
- [ ] 没有内存泄漏（打开/关闭页面多次，内存稳定）

### 10.5 完整验收检查表

```
功能验收：
  ☐ 菜单导航正常
  ☐ 所有页面可打开
  ☐ 查询筛选工作
  ☐ 列表分页工作
  ☐ 按钮操作正确
  ☐ 完整路径可走通
  ☐ 数据一致性正确

代码质量：
  ☐ 无 TypeScript 错误
  ☐ npm run build 成功
  ☐ console 无错误
  ☐ 代码规范符合

原有功能：
  ☐ 原有菜单正常
  ☐ 原有页面正常
  ☐ 角色切换正常
  ☐ 重置功能正常

视觉质量：
  ☐ 布局整齐
  ☐ 样式一致
  ☐ 交互流畅
  ☐ 风格专业

✓ 全部检查通过 → 开发完成
```

---

## 十一、开发建议

### 开发顺序
1. **类型定义**：先在 types.ts 中定义数据结构
2. **数据初始化**：在 storage.ts 中生成 Mock 数据
3. **菜单和路由**：在 App.tsx 中添加菜单项和路由
4. **列表页面**：实现第一个列表页面（容易测试）
5. **详情页面**：实现详情页面（数据展示）
6. **操作页面**：实现编辑、审批、处置等操作页面
7. **工作流页面**：实现多步流程页面（如需要）
8. **权限控制**：最后添加权限检查

### 开发技巧
- 多参考现有页面的代码结构
- 充分利用已有的公用函数和样式
- 及时进行 `npm run typecheck` 检查
- 使用浏览器开发者工具检查样式和布局
- 定期测试完整的演示路径

### 常见问题
**Q：如何添加新的权限检查？**
A：在 permissionService.ts 中添加 `can[ActionName](role)` 函数，然后在需要权限检查的地方调用。

**Q：如何生成唯一 ID？**
A：使用 storage.ts 中的 `uid()` 函数：`uid('prefix')`

**Q：如何保存时间戳？**
A：使用 `new Date().toLocaleString('zh-CN', { hour12: false })`

**Q：如何实现从列表跳到详情？**
A：点击按钮时调用 `navigate('/path/' + item.id)`，然后在 App.tsx 的路由处理中取出 ID 和对应的数据项。

---

## 十二、最后提醒

✅ **这是一份模板，需要填充具体内容**

使用时：
1. 将 `[XXX]` 替换为实际的业务场景
2. 删除不适用的部分
3. 补充具体的页面设计和字段定义
4. 明确权限、工作流、交互等具体需求

✅ **代码优先复用，样式严格规范**

不要：
- 创建新的组件库（复用已有组件）
- 修改 Header、Sidebar、主题颜色
- 添加新的依赖
- 使用内联样式（放在 styles.css 中）

✅ **充分测试，验收标准清晰**

完成开发后逐项检查验收清单，确保功能、代码、视觉、演示路径都达到要求。

---

**这份框架性提示词可以直接交给 Coding Agent 执行，也可以作为 DEMO 开发的规范和手册。**
