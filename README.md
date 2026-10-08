# demo

一个**零依赖静态页**，把 Matt Skills（`dsh-mattpocock-skills`）的 25 个技能、常用命令和作用整理成一页速查表。

## 页面内容

- **主流程**：想法 → 打磨 → 拆分 → 实现（`/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement`），含两条分叉。
- **命令速查**：25 张卡片，按 5 类筛选（主流程 / 入口 / 代码库健康 / 词汇层 / 独立技能），可搜索、可展开说明、点命令即复制。
- **入口与边界**：`/triage`、`/diagnosing-bugs`、`/wayfinder`、`/improve-codebase-architecture`、词汇层两份参考，以及阶段边界的五种选择。
- **开始使用**：安装命令 + 每仓库一次的 `/setup-matt-pocock-skills`。

## 目录结构

```
.
├── index.html             # 页面骨架（静态，负责区块与文案）
├── styles.css             # 全部样式：跟随系统深浅色，可手动切换
├── app.js                 # 渲染逻辑：时间线、卡片、搜索筛选、复制、主题
├── data/skills.js         # 单一数据源：25 个技能 + 主流程 + 边界 + 起步命令
├── scripts/serve.mjs      # 零依赖本地预览服务器（Node 内置模块）
├── tests/skills.test.mjs  # node --test 自检：内容完整性与页面结构
└── package.json           # dev / start / test 三个脚本，无任何依赖
```

## 本地运行

```bash
npm run dev     # http://127.0.0.1:4173
npm test        # 内容与结构自检
```

也可以直接双击 `index.html`（`file://` 打开同样可用；剪贴板 API 在 `file://` 下可能受限，页面里有兜底）。换端口：`PORT=8080 npm run dev`。

## 维护

改内容只需要动 `data/skills.js`：技能名、分类、调用方式、作用、要点都在那里，页面和测试都会跟着走。加一个技能后跑一次 `npm test`，测试会校验数量、分类、调用方式、页面引用的命令是否都能在数据里找到。

## 下一步

在这个仓库里第一次用这套技能，先跑一次初始化，然后让路由器指路：

```text
/setup-matt-pocock-skills   # 每仓库一次：issue tracker、triage 标签、文档布局
/ask-matt                   # 之后每次都从这里开始
```
