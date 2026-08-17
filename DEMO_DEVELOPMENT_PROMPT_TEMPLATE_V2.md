# 《通用 DEMO 开发框架 - Prompt 模板》

你是一名经验丰富的前端开发工程师，能够在现有 React 项目基础上快速开发任意业务场景的 DEMO。

你的任务是根据业务需求，**在不修改现有技术栈的前提下**，为新业务场景开发完整的功能模块。

---

## 一、现有项目技术基础（锁定）

### 1.1 技术栈

```
框架:       React 18 + TypeScript
构建:       Vite
路由:       自定义客户端路由（window.location.pathname）
状态管理:   localStorage Mock 数据 + React useState
UI 库:      无依赖，全自定义 CSS 组件
样式:       原生 CSS（单文件组织）
```

**约束条件**：
- ❌ 不能升级/修改 package.json
- ❌ 不能引入第三方 UI 库
- ❌ 不能修改现有的 React 版本或其他依赖
- ✅ 所有 UI 组件都是自定义的

### 1.2 项目核心结构

```
src/
  ├─ App.tsx                    // 唯一的入口，负责：
  │                             //   - 菜单定义和渲染
  │                             //   - 路由处理（if/else 判断 path）
  │                             //   - 权限检查（如需要）
  │                             //   - 页面渲染
  │
  ├─ types.ts                   // 所有 TypeScript 类型定义
  │                             // （全局共享的接口）
  │
  ├─ services/
  │  ├─ storage.ts              // 数据初始化 + 全局状态管理
  │  │                          //   - seedState()：初始 Mock 数据
  │  │                          //   - saveState()：存储到 localStorage
  │  │                          //   - loadState()：加载数据
  │  │                          //   - resetState()：重置为初始状态
  │  │
  │  └─ [可选] 其他业务 service 文件
  │                             // （业务逻辑抽象）
  │
  ├─ styles.css                 // 全局样式表（所有 UI 规范定义于此）
  ├─ overrides.css              // 样式覆盖
  └─ utils/
     └─ download.ts             // 工具函数
```

### 1.3 已有的可复用组件库（必须优先使用）

所有这些组件都在 App.tsx 中定义，任何新页面都可以直接复用：

| 组件 | 功能 | 何时使用 |
|------|------|---------|
| `<Page>` | 页面容器框架 | **所有新页面必用**，提供标题/面包屑/返回 |
| `<Section>` | 内容块容器 | 用于分组内容，提供标题和内边距 |
| `<Card>` | 卡片容器 | 用于独立的卡片式内容 |
| `<Table>` | 数据表格 | 展示表格数据（不含分页） |
| `<Pagination>` | 分页控件 | 与 Table 配合，管理分页 |
| `<SearchPanel>` | 查询面板 | 包装查询条件的区域 |
| `<Field>` | 表单项容器 | 单个表单字段的布局 |
| `<Input>` | 文本输入框 | 表单中的文本输入 |
| `<Select>` | 下拉选择框 | 选择固定选项 |
| `<Textarea>` | 多行文本框 | 长文本输入 |
| `<Button>` | 按钮 | 操作按钮（主/次/文字样式） |
| `<StatusTag>` | 状态标签 | 展示状态/标签 |
| `<Modal>` | 对话框 | 弹出式操作（确认/详情/表单） |
| `<Tabs>` | 标签页 | 多视图切换 |
| `<WorkflowSteps>` | 流程进度 | 展示多步骤流程 |
| `<FileUploader>` | 文件上传 | 文件上传和显示列表 |

**规则**：优先复用这些组件，不要自己创建类似的 HTML 结构。

### 1.4 设计规范（全部遵循）

#### 色彩系统
```
主色:    #155eef（蓝色 - 按钮/链接/高亮）
背景:    #f4f7fb（页面背景）
白色:    #ffffff（卡片背景）
边框:    #e7edf5（分割线）

文字:
  主文本:   #182230（深灰）
  次文本:   #5b6676（浅灰）
  辅助:    #9ca3af（更浅）

四色状态系统（强制使用）：
  绿灯:    #10b981（正常/成功）
  黄灯:    #f59e0b（警告/进行中）
  红灯:    #ef4444（错误/失败）
  灰色:    #d1d5db（无状态/禁用）
```

#### 布局规范
```
固定尺寸:
  Header 高度:     64px（不变）
  Sidebar 宽度:    240px（不变）
  内容区:         剩余空间

间距:
  页面内边距:     20-24px
  卡片内边距:     16-20px
  元素间距:       8-16px

圆角:
  按钮:          4-6px
  卡片:          6-8px
  输入框:        4-6px

阴影:
  轻阴影:        0 1px 3px rgba(0,0,0,0.1)
```

#### 字体
```
字体族: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif

尺寸和权重:
  H1 (页面标题):      18px bold
  H2 (卡片标题):      14px bold
  正文 (Body):       14px regular
  小文本 (Small):    12px regular
  按钮:              14px 500
```

---

## 二、新业务需求定义（填充项）

### 2.1 DEMO 核心目标

**清晰定义本次 DEMO 要展示的 3-5 个核心能力**：

1. **[能力名称]**：[简述该能力的演示价值]
   - 例如："用户列表管理" - 展示数据列表、查询、分页的标准实现

2. **[能力名称]**：[简述]
   - 例如："用户详情展示" - 展示单条记录的完整信息

3. **[能力名称]**：[简述]
   - 例如："用户创建编辑" - 展示表单的新增和修改流程

4. **[能力名称]**：[简述]  （可选）

5. **[能力名称]**：[简述]  （可选）

### 2.2 使用场景和用户角色

**明确谁会使用这个 DEMO**：

- 用户角色 1：[描述]
- 用户角色 2：[描述]
- 用户角色 3：[描述]（可选）

**是否需要角色权限控制？**
- [ ] 不需要（所有人看到同样内容）
- [ ] 需要（不同角色看到不同功能）

---

## 三、页面架构设计

### 3.1 菜单结构

**在现有菜单中的位置**（需要在 App.tsx 的 menus 数组中添加）：

```
【一级菜单】
  ├─ [现有菜单 1]
  ├─ [现有菜单 2]
  ├─ [新增菜单 - 你的业务模块名称] ⭐
  │  ├─ [子菜单 1 - 页面 1]      [path: /your-module/page1]
  │  ├─ [子菜单 2 - 页面 2]      [path: /your-module/page2]
  │  ├─ [子菜单 3 - 页面 3]      [path: /your-module/page3]
  │  └─ [子菜单 4 - 页面 4]      [path: /your-module/page4]
  └─ [其他现有菜单]
```

**菜单配置项**（在 App.tsx 中）：
```typescript
const menus: MenuItem[] = [
  // ... 现有菜单
  {
    label: '[你的模块名称]',
    icon: '[Unicode 符号]',  // 例如 '▤' 或 '★'
    children: [
      { label: '[页面名1]', path: '/your-module/page1' },
      { label: '[页面名2]', path: '/your-module/page2' },
      // ... 其他子菜单
    ]
  },
  // ... 其他菜单
];
```

### 3.2 页面清单和路由

**列出所有需要创建的新页面**：

| 页面名称 | 路由路径 | 功能描述 | 是否新增 |
|---------|---------|--------|--------|
| [列表页] | `/[module]/[list]` | [功能] | 新增 |
| [详情页] | `/[module]/[list]/{id}` | [功能] | 新增 |
| [编辑页] | `/[module]/[list]/{id}/edit` | [功能] | 新增/修改 |
| [其他页] | `/[module]/[page]` | [功能] | 新增 |

**路由命名规则**：
- kebab-case（单词用小写和连字符）
- 例如：`/user-management/list`, `/order-tracking/detail`
- 不使用下划线或驼峰

### 3.3 完整演示路径（必须设计）

**设计一条 5-7 步的完整业务流程，确保可以点击走通**：

```
第 1 步：进入 [主列表页]
  ↓ 点击 [列表中的操作按钮]
第 2 步：进入 [详情页] 或 [编辑页]
  ↓ 执行 [操作]（例如：提交表单、确认删除）
第 3 步：进入 [流程页面]（例如：工作流、结果反馈）
  ↓ 点击 [返回] 或 [下一步]
第 4 步：返回 [列表页]，确认数据已更新
  ↓ 验证演示完成
✓ 演示闭环完成
```

**关键要点**：
- 不是孤立的静态页面
- 每一步都有交互和数据流转
- 最后返回列表时数据应该已更新
- 用户能看到前后的因果关系

---

## 四、页面设计规范

### 4.1 页面设计模板

**每个新页面都应该遵循这个模板进行设计**：

#### 页面：[页面名称]

**路由**：`/[module]/[page]` 或 `/[module]/[page]/{id}`

**页面目的**：[1-2 句说明这个页面要做什么、谁来用]

**页面结构**（选择适用的部分）：

```
┌─ Page 容器 ────────────────────────────────┐
│ 标题 | 面包屑 | [返回/操作按钮]              │
├─────────────────────────────────────────────┤
│ 【Section 1：数据展示区】                    │
│  - 关键指标卡片（如需要）                   │
│  - 说明文字                                 │
│                                             │
│ 【Section 2：查询/筛选区】                   │
│  - 搜索框、选择框、日期选择                 │
│  - [检索] [重置] 按钮                      │
│                                             │
│ 【Section 3：数据表格区】                    │
│  - 表头行                                   │
│  - 数据行（含操作列）                       │
│  - 分页控件                                 │
│                                             │
│ 【Section 4：其他区域】（根据需要）         │
│  - Tab 页签                                 │
│  - 表单                                     │
│  - 流程进度                                 │
└─────────────────────────────────────────────┘
```

**核心字段**（明确数据结构）：

```typescript
// 在这里列出此页面展示的所有字段
// 格式：[字段名] - [类型] - [含义]

例如：
- name - string - 名称
- status - 'active' | 'inactive' | 'pending' - 状态
- createdAt - string - 创建时间
- description - string - 描述
- attachments - Attachment[] - 附件列表
```

**页面交互流程**：

```
用户操作 1：[操作名称]
→ 触发 [事件]
→ 调用 [函数]
→ 更新 [状态]
→ UI 变化：[变化描述]

用户操作 2：[操作名称]
→ ...

用户操作 3：[操作名称]
→ ...
```

**页面使用的组件**：
- `<Page>` - 页面容器
- `<Section>` - [第几个内容块用的组件]
- `<Table>` + `<Pagination>` - [数据展示]
- `<SearchPanel>` - [查询区]
- `<Button>` - [操作按钮]
- `<Modal>` - [对话框（如需要）]
- 其他...

---

## 五、数据模型设计

### 5.1 TypeScript 类型定义（types.ts）

**定义本模块需要的所有数据类型**：

```typescript
// 主业务对象类型
export type YourMainEntity = {
  id: string;                      // 唯一标识（uuid）
  code: string;                    // 业务编号
  name: string;                    // 名称
  status: 'active' | 'inactive';   // 状态（取决于业务）
  description: string;             // 描述
  createdAt: string;               // 创建时间
  createdBy: string;               // 创建人
  updatedAt?: string;              // 更新时间
  updatedBy?: string;              // 更新人
  
  // 可选：关联数据
  attachments?: Attachment[];      // 附件
  logs?: LogEntry[];               // 操作日志
};

// 其他相关的数据类型
export type YourSecondEntity = {
  id: string;
  // ...
};

// 扩展 DemoState 类型，加入新数据表
export type DemoState = {
  // ... 现有属性
  
  // 新增：你的模块数据
  yourMainEntities: YourMainEntity[];
  yourSecondEntities: YourSecondEntity[];
};
```

**设计原则**：
- 用明确的类型（string | number | boolean | enum）
- 必须包含 id、createdAt、createdBy 等元数据
- 如需要，包含 attachments 和 logs
- 使用联合类型表示枚举（例如 `'active' | 'inactive'`）

### 5.2 Mock 数据生成（storage.ts）

**在 storage.ts 中的 seedState() 函数中生成初始化数据**：

```typescript
export const seedState = (): DemoState => ({
  // ... 现有数据
  
  yourMainEntities: [
    {
      id: 'entity-001',
      code: 'CODE-2024-001',
      name: 'First Item',
      status: 'active',
      description: 'Description of first item',
      createdAt: '2024-06-01 10:00:00',
      createdBy: 'admin',
      attachments: [],
      logs: [
        { id: 'log-001', action: '创建', operator: 'admin', time: '2024-06-01 10:00:00', content: '创建记录' }
      ],
    },
    {
      id: 'entity-002',
      // ... 更多数据
    },
    // 生成 20-50 条 Mock 数据
  ],
  
  yourSecondEntities: [
    // ... 相关数据
  ],
});
```

**Mock 数据原则**：
- 数量：20-50 条主对象
- **无意义的数据**：❌ 不要用 "Test1", "Test2", "Item A", "Item B"
- **有业务含义**：✅ 用真实可能的数据（例如："订单 ORD-2024-0001"）
- **多样性**：展示不同的状态、等级、分类
- **时间分布**：最近 30-60 天的数据混合
- **数据关联**：详情页展示的数据与列表保持一致
- **完整性**：包含工作流的各个阶段数据

### 5.3 数据管理接口

**在 storage.ts 中暴露的核心函数**：

```typescript
// 初始化数据
export const seedState = (): DemoState => { ... };

// 加载数据（从 localStorage）
export const loadState = (): DemoState => { ... };

// 保存数据（到 localStorage）
export const saveState = (state: DemoState) => { ... };

// 重置数据
export const resetState = (): DemoState => { ... };

// 可选：业务逻辑方法
export const yourModuleService = {
  getById: (state: DemoState, id: string) => { ... },
  filterByStatus: (state: DemoState, status: string) => { ... },
  sortByDate: (items: YourMainEntity[]) => { ... },
};
```

---

## 六、代码实现规范

### 6.1 在 App.tsx 中的改动

#### Step 1：定义菜单项
```typescript
const menus: MenuItem[] = [
  // ... 现有菜单
  {
    label: '你的模块名称',
    icon: '▤',  // 选择一个合适的 Unicode 符号
    children: [
      { label: '页面 1', path: '/your-module/page1' },
      { label: '页面 2', path: '/your-module/page2' },
      // ...
    ]
  },
  // ... 其他菜单
];
```

#### Step 2：添加路由处理
```typescript
function render() {
  // ... 现有路由
  
  // 新增路由
  if (path === '/your-module/page1') return <YourPage1 {...pageProps} />;
  if (path === '/your-module/page2') return <YourPage2 {...pageProps} />;
  if (path.match(/^\/your-module\/page1\/[^/]+$/)) return <YourPage1Detail {...pageProps} />;
  
  // ... 其他路由
}
```

#### Step 3：权限检查（如需要）
```typescript
function canAccessRouteForRole(role: Role, path: string) {
  // ... 现有检查
  
  if (path.startsWith('/your-module')) {
    // 定义谁可以访问你的模块
    return role === '某个角色' || role === '其他角色';
  }
}
```

### 6.2 页面函数的标准写法

**所有新页面都应该按照这个模式编写**：

```typescript
// 页面的 Props 类型
type PageProps = { 
  state: DemoState; 
  role: Role;  // 可选，如不需要权限控制可以省略
  navigate: (path: string) => void; 
  update: (fn: (state: DemoState) => void) => void;  // 更新状态函数
  toast: (message: string) => void;  // 吐司提示
};

// 页面组件
function YourPage1({ state, role, navigate, update, toast }: PageProps) {
  // 本地状态（如需要）
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  
  // 过滤和计算数据
  const items = state.yourMainEntities.filter(item => 
    item.name.includes(searchText)
  );
  
  // 返回页面 JSX
  return <Page title="页面标题" breadcrumb={['菜单', '页面']}>
    
    {/* 查询区域 */}
    <SearchPanel 
      onSearch={() => { /* 执行搜索 */ }} 
      onReset={() => setSearchText('')}
    >
      <Field label="搜索">
        <Input value={searchText} onChange={setSearchText} />
      </Field>
    </SearchPanel>
    
    {/* 表格区域 */}
    <Table>
      <thead><tr><th>名称</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td><StatusTag value={item.status} /></td>
            <td>
              <Button variant="text" onClick={() => navigate(`/your-module/page1/${item.id}`)}>
                查看详情
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
    <Pagination total={items.length} page={page} setPage={setPage} />
    
  </Page>;
}
```

**关键点**：
- 使用 `<Page>` 作为容器
- 充分利用 `<Table>`, `<Pagination>`, `<SearchPanel>`, `<Button>` 等已有组件
- 用 state 和 update 管理数据
- 用 navigate 进行页面跳转

### 6.3 复用现有组件的规范

**✅ 正确做法**：

```typescript
// 使用已有的 SearchPanel
<SearchPanel onSearch={search} onReset={reset}>
  <Field label="名称"><Input value={name} onChange={setName} /></Field>
  <Field label="状态"><Select value={status} onChange={setStatus} options={[...]} /></Field>
</SearchPanel>

// 使用已有的 Table
<Table>
  <thead><tr><th>列1</th><th>列2</th></tr></thead>
  <tbody>{items.map(item => <tr key={item.id}><td>{item.name}</td></tr>)}</tbody>
</Table>

// 使用已有的 Modal
{showModal && <Modal title="操作" onClose={close} footer={<Button onClick={confirm}>确认</Button>}>
  <div>操作内容</div>
</Modal>}
```

**❌ 错误做法**：

```typescript
// 不要自己写搜索框
<div className="custom-search">
  <input type="text" />
  <button>搜索</button>
</div>

// 不要自己写表格
<div className="custom-table">
  <div className="row"><div>{item.name}</div></div>
</div>

// 不要自己写对话框
<div className="custom-modal">
  <div className="content"></div>
</div>
```

### 6.4 数据流向规范

**正确的 React 数据流**：

```
用户交互（点击按钮）
  ↓
调用 onClick 回调
  ↓
调用 update() 函数修改 state
  ↓
state 更新触发 re-render
  ↓
页面 UI 更新

例如：
<Button onClick={() => {
  update(current => {
    const item = current.yourMainEntities.find(x => x.id === id);
    if (item) item.status = 'completed';
  });
  toast('状态已更新');
}}>
  完成
</Button>
```

---

## 七、交互和演示要求

### 7.1 必须实现的基础交互

- [ ] **菜单导航**：所有菜单项可点击
- [ ] **页面跳转**：链接和按钮能正确跳转
- [ ] **返回按钮**：详情页能返回列表
- [ ] **浏览器后退**：浏览器后退键正常工作
- [ ] **查询筛选**：搜索框、下拉框能生效
- [ ] **列表交互**：点击行进入详情、分页翻页
- [ ] **数据提交**：表单提交、状态更新

### 7.2 完整演示路径

**明确设计 5-7 步的演示流程，确保可以完整点击走通**：

```
演示路径：
  第 1 步 → 第 2 步 → 第 3 步 → 第 4 步 → 第 5 步 → 返回第 1 步
  
验证：
  - 每一步都有用户交互
  - 每一步都有数据反馈
  - 每一步的数据与上下文保持一致
  - 最后返回时，列表数据已更新
```

---

## 八、视觉和样式规范

### 8.1 设计规范（必须遵循）

**色彩**：
```
主色:      #155eef
背景:      #f4f7fb
卡片:      #ffffff
文字主:    #182230
文字次:    #5b6676
边框:      #e7edf5

状态色：
  绿: #10b981  黄: #f59e0b  红: #ef4444  灰: #d1d5db
```

**布局**：
```
Header:  64px (固定)
Sidebar: 240px (固定)
间距:    20-24px
圆角:    4-8px
```

**字体**：
```
H1: 18px bold
H2: 14px bold
正文: 14px regular
小: 12px regular
```

### 8.2 不允许的操作

❌ **不能做**：
- 修改 Header 和 Sidebar 的结构和尺寸
- 改变主题色、文字色
- 添加渐变、发光、复杂阴影
- 使用夸张动画

✅ **可以做**：
- 在已有框架内添加新的页面样式
- 调整内边距、间距
- 使用状态色突出重点

### 8.3 整体风格定位

> **简洁、专业、企业级**
>
> 新增模块应与现有风格完全融合

---

## 九、代码验收标准

### 9.1 编译和构建

- [ ] `npm run typecheck` 无错误
- [ ] `npm run build` 成功
- [ ] console 无 JavaScript 错误

### 9.2 功能验收

- [ ] 所有菜单项可点击
- [ ] 所有页面可正常打开
- [ ] 查询筛选功能正常
- [ ] 列表分页正常
- [ ] 操作按钮功能正确
- [ ] 完整演示路径可走通
- [ ] 数据一致性正确

### 9.3 代码质量

- [ ] 页面函数命名规范（PascalCase）
- [ ] 数据类型在 types.ts 中定义
- [ ] 充分复用已有组件
- [ ] 没有重复创建组件或样式

### 9.4 原有功能保护

- [ ] 现有菜单项正常
- [ ] 现有页面不受影响
- [ ] 没有修改 package.json
- [ ] 没有改变项目结构

---

## 十、开发步骤

**按以下顺序进行开发**：

1. **定义数据模型** → 在 types.ts 中定义所有类型
2. **准备 Mock 数据** → 在 storage.ts 中生成初始数据
3. **配置菜单和路由** → 在 App.tsx 中添加菜单和路由
4. **编写列表页面** → 实现第一个列表页（最容易测试）
5. **编写详情页面** → 实现详情页面（数据展示）
6. **编写操作页面** → 实现编辑、删除等操作页面
7. **完整路径测试** → 验证演示流程可走通
8. **权限检查** → 如需要，添加角色权限控制

---

## 十一、最终检查清单

```
【菜单和导航】
☐ 新菜单项显示
☐ 子菜单项可点击
☐ 菜单项高亮

【页面功能】
☐ 所有页面打开正常
☐ 查询筛选工作
☐ 列表分页工作
☐ 操作按钮正确
☐ 完整路径可走通

【数据一致性】
☐ 列表和详情数据一致
☐ 操作后数据更新
☐ 返回列表时数据已变更

【代码质量】
☐ 无 TypeScript 错误
☐ npm run build 成功
☐ console 无错误
☐ 代码规范符合

【原有功能】
☐ 原有菜单正常
☐ 原有页面正常
☐ 没有修改依赖

【视觉质量】
☐ 布局整齐
☐ 样式一致
☐ 风格专业

✓ 全部检查通过 → 开发完成
```

---

## 十二、总结

### 核心原则

1. **优先复用** → 不要重新开发已有的组件
2. **数据驱动** → 所有 UI 都从 state 生成
3. **类型安全** → 所有 types 都在 types.ts 中定义
4. **样式统一** → 遵循既有的设计规范
5. **交互完整** → 设计可以完整走通的演示路径
6. **代码清晰** → 易于理解和维护

### 适配任何业务

这套框架可以适配：
- 用户管理系统
- 订单管理系统
- 内容管理系统
- 数据监测系统
- 任何其他业务场景

关键是**遵循这套代码规范和交互规范**，而非复制具体的业务逻辑。

---

**这是一份通用的 DEMO 开发框架，可以直接交给 Coding Agent 使用。**

**根据具体的业务需求，填充"第二部分"的内容，其他部分保持不变。**
