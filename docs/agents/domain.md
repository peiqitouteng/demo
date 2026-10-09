# 领域文档（Domain Docs）

规定各工程技能在探索代码库时，应如何消费本仓库的领域文档。

## 开始探索前，先读这些

- 仓库根目录的 **`CONTEXT.md`**，或
- 仓库根目录的 **`CONTEXT-MAP.md`**（如果存在）—— 它指向每个上下文各自的 `CONTEXT.md`。把与当前主题相关的那些都读一遍。
- **`docs/adr/`** —— 阅读与你要改动的区域相关的 ADR。在多上下文仓库中，还要检查 `src/<context>/docs/adr/` 里与上下文相关的决策。

如果这些文件不存在，**静默继续**。不要指出它们缺失，也不要主动建议创建。`/domain-modeling` 技能（经由 `/grill-with-docs` 和 `/improve-codebase-architecture` 触达）会在术语或决策真正被确定下来时按需创建它们。

## 文件结构

单上下文仓库（绝大多数仓库）：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多上下文仓库（根目录存在 `CONTEXT-MAP.md`）：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统级决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 上下文相关决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用术语表里的词汇

当你的产出要命名某个领域概念时（在 issue 标题、重构建议、假设、测试名称中），使用 `CONTEXT.md` 里定义的术语。不要漂移到术语表明确避免的同义词上。

如果你需要的概念还没进术语表，这本身就是一个信号 —— 要么是你在发明项目并不使用的说法（重新考虑），要么是确实存在空白（记下来，交给 `/domain-modeling`）。

## 标出 ADR 冲突

如果你的产出与某个现有 ADR 相矛盾，要显式地把这一点摆出来，而不是悄悄覆盖：

> _与 ADR-0007（event-sourced orders）冲突 —— 但值得重新讨论，因为……_
