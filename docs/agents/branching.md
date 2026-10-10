# 分支模型：test 是预览集成分支

`main` 是唯一的真相来源（source of truth）。`test` 是**预览集成分支**：它等于 `main` 加上所有在途分支，只用来在测试环境做集成验证，任何时候都可以重建。交付物只从 `main` 出。

## 生命周期

一个功能或修复：

1. **切分支** `git switch main && git pull && git switch -c <type>/<slug>`，`<type>` 用 `feat`、`fix`、`docs` 或 `chore`。
2. **合进 `test` 验证**（不需要 PR）：
   ```
   git switch test && git pull
   git merge --no-ff feat/<slug>
   git push
   ```
3. **向 `main` 开 PR**，head 就是这个功能分支：
   ```
   gh pr create --base main --head feat/<slug> --title "..." --body "..."
   ```
   review 和 CI 都在这个 PR 上完成 —— 它才是交付的门。
4. **合并后收尾**：删除功能分支，把 `main` 合回 `test`（`git switch test && git merge --no-ff origin/main && git push`），或直接重建 `test`。

紧急修复走同一条路：从 `main` 切 `fix/<slug>` → PR 到 `main` → 再合进 `test`。

## 规则

| 分支 | 规则 |
| --- | --- |
| `main` | 受保护：必须走 PR、禁止直接 push、禁止 force push、禁止删除 |
| `test` | 不需要 PR、不受保护；重建时可以 force push |
| `feat/*`、`fix/*`、`docs/*`、`chore/*` | 活到它自己的 `main` PR 合并为止 |

- **PR 一律指向 `main`。** 合并进 `test` 只是验证，不是交付。
- **每个功能一个 PR。** 不把多个功能攒成一个 PR。
- **`test` 不承载历史。** 需要干净复验时重建它：`git fetch origin && git reset --hard origin/main && git push --force-with-lease`。

## 验证过的状态 ≠ 发布的状态

A、B 两个分支都合进 `test` 并验证通过后，A、B 可能以另一种顺序、另一种冲突解决方式进入 `main` —— 在 `test` 上验证的那个 commit 组合，未必就是最终发布的组合。两条对策：

- **`main` 的 PR 必须自带完整 CI**（单元 + 集成），因为验证发生在 `test`，而发布发生在 `main`。
- **沿用 `test` 上的合并顺序**合入 `main`；冲突在 `main` 的 PR 里解决后，把 `main` 合回 `test` 保持两边一致，再继续验证后续分支。
