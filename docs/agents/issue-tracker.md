# Issue tracker：GitHub

本仓库的 issue 和 spec 都以 GitHub issue 的形式保存。所有操作都使用 `gh` CLI。

## 约定

- **创建 issue**：`gh issue create --title "..." --body "..."`。多行正文使用 heredoc。
- **读取 issue**：`gh issue view <number> --comments`，用 `jq` 过滤评论，并同时获取标签。
- **列出 issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，配合合适的 `--label` 和 `--state` 过滤条件。
- **评论 issue**：`gh issue comment <number> --body "..."`
- **添加 / 移除标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭 issue**：`gh issue close <number> --comment "..."`

仓库信息从 `git remote -v` 推断 —— 在克隆目录内运行时，`gh` 会自动识别。

## 把 Pull Request 作为分诊入口

**PRs as a request surface: no.** _（如果本仓库把外部 PR 视为功能请求，请把这里改为 `yes`；`/triage` 会读取这个标志。）_

当该标志为 `yes` 时，PR 会走与 issue 相同的标签和状态，只是把命令换成对应的 `gh pr` 版本：

- **读取 PR**：`gh pr view <number> --comments`，diff 用 `gh pr diff <number>`。
- **列出待分诊的外部 PR**：`gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`，然后只保留 `authorAssociation` 为 `CONTRIBUTOR`、`FIRST_TIME_CONTRIBUTOR` 或 `NONE` 的条目（丢弃 `OWNER`/`MEMBER`/`COLLABORATOR`）。
- **评论 / 打标签 / 关闭**：`gh pr comment`、`gh pr edit --add-label`/`--remove-label`、`gh pr close`。

GitHub 的 issue 和 PR 共用同一套编号，所以单独的 `#42` 可能是两者之一 —— 先用 `gh pr view 42` 解析，失败再回退到 `gh issue view 42`。

## 当某个技能说 “publish to the issue tracker”

创建一个 GitHub issue。

## 当某个技能说 “fetch the relevant ticket”

运行 `gh issue view <number> --comments`。

## Wayfinding 操作

供 `/wayfinder` 使用。**map** 是单个 issue，**child** issue 则是它的 ticket。

- **Map**：单个 issue，打上 `wayfinder:map` 标签，正文承载 Notes / Decisions-so-far / Fog。`gh issue create --label wayfinder:map`。
- **Child ticket**：以 GitHub sub-issue 的形式链接到 map 的 issue（对 sub-issues 端点调用 `gh api`）。如果仓库未启用 sub-issues，就把 child 加入 map 正文里的任务列表，并在 child 正文开头写上 `Part of #<map>`。标签：`wayfinder:<type>`（`research`/`prototype`/`grilling`/`task`）。一旦被认领，ticket 就指派给负责推进的开发者。
- **阻塞关系**：使用 GitHub 原生的 **issue dependencies** —— 这是最标准、在 UI 上可见的表达方式。用 `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>` 添加依赖边，其中 `<blocker-db-id>` 是阻塞方的数字 **database id**（用 `gh api repos/<owner>/<repo>/issues/<n> --jq .id` 获取，_不是_ `#number` 也不是 `node_id`）。GitHub 通过 `issue_dependencies_summary.blocked_by` 报告结果（只统计未关闭的阻塞方 —— 这才是实时的门禁）。如果依赖功能不可用，退化为在 child 正文开头写一行 `Blocked by: #<n>, #<n>`。当所有阻塞方都已关闭时，ticket 即为解除阻塞。
- **Frontier 查询**：列出 map 下所有未关闭的 child（`gh issue list --state open`，限定在 map 的 sub-issues / 任务列表范围内），丢弃任何存在未关闭阻塞方（`issue_dependencies_summary.blocked_by > 0`，或 `Blocked by` 行里还有未关闭 issue）或已有 assignee 的条目；按 map 中的顺序取第一个。
- **认领**：`gh issue edit <n> --add-assignee @me` —— 这是本 session 的第一次写入。
- **解决**：`gh issue comment <n> --body "<answer>"`，然后 `gh issue close <n>`，最后把上下文指针（要点摘要 + 链接）追加到 map 的 Decisions-so-far 中。
