## Agent skills

### Branching

`main` 是唯一真相来源，`test` 是可随时重建的预览集成分支。切分支、提交、开 PR、修 hotfix 时，先读 `docs/agents/branching.md`：功能从 `main` 切出 → 直接合进 `test` 验证 → 同一个分支开 PR 到 `main`。

### Issue tracker

本仓库的 issue 以 GitHub Issues 的形式保存在 `peiqitouteng/demo`，使用 `gh` CLI 操作。详见 `docs/agents/issue-tracker.md`。

### Triage labels

沿用默认的五个分诊角色标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。详见 `docs/agents/triage-labels.md`。

### Domain docs

单上下文（single-context）：仓库根目录的 `CONTEXT.md` + `docs/adr/`。详见 `docs/agents/domain.md`。
