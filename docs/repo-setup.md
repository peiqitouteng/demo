# 新仓库 GitHub 配置清单

按顺序执行。**有硬依赖的地方标了 ⚠️**。每一步都给了验证方法 —— 没验证过就等于没配。

约定：`<owner>/<repo>` 换成实际仓库；本地需要 `gh` CLI，`gh auth status` 里要有 `repo` 和 `workflow` scope。

## 0. 先回答两个问题

| 问题 | 影响什么 |
| --- | --- |
| 仓库 public 还是 private？ | **环境部署保护规则（人工闸门）在公开仓库免费**，私有仓库需要付费计划 |
| 几个人往 `main` 合代码？ | 决定 PR 的 `required_approving_review_count`：solo = `0`，多人 = `1` |

## 1. 建仓库

```sh
gh repo create <owner>/<repo> --public --source . --remote origin
```

## 2. 本地骨架（先于任何 GitHub 配置）

- **`.gitignore`** —— 第一件事。优先写密钥：`.env`、`.env.*`、`*.pem`、`*.key`
- **分支模型文档** —— 本仓库的 [branching.md](agents/branching.md) 可直接抄
- `AGENTS.md` + `docs/agents/`（如果用了 Matt Pocock 那套 skills，跑 `/setup-matt-pocock-skills` 生成）

理由：先把文件放进仓库，后面的 PR 才有东西可验证。

## 3. workflow 骨架，并让它跑通一次 ⚠️

**`.github/workflows/ci.yml`** —— 触发 `pull_request: branches: [main]` 和 `push: branches: [test]`，至少一个 job。**记住 job 名**（例如 `check`，它是必需检查要填的字符串）。

**`.github/workflows/cd.yml`** —— 三个触发：`push: branches: [test]`（测试环境）、`push: tags: ['v*']`（生产）、`workflow_dispatch`（带 `version` 输入，回滚入口）。

合并一次进 `main`，确认 CI **至少跑过一次**。

> ⚠️ **硬依赖**：第 4 步的"必需状态检查"要填 **job 名**，而这个名字只有跑过才能确认。GitHub 是**逐字匹配**的 —— 填错（比如填 workflow 名 `CI` 而不是 job 名 `check`）会让 PR 永远卡在 `Expected`，合不进去。

## 4. `main` 分支 ruleset

用 ruleset，不用 classic branch protection —— **classic 表达不了"必须走 PR，但 0 个 approve"**（solo 会被永久锁死）。

`main-ruleset.json`：

```json
{
  "name": "protect-main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [{ "context": "check" }]
      }
    }
  ],
  "bypass_actors": []
}
```

```sh
gh api --method POST repos/<owner>/<repo>/rulesets --input main-ruleset.json
```

三个点：

- `required_approving_review_count`：solo 填 `0`，多人填 `1`
- `bypass_actors: []` —— **留空**。给自己加 `bypass_mode: always` 会让门禁形同虚设（本仓库原来就是这样，规则写了等于没写）
- `strict_required_status_checks_policy: true` —— PR 必须基于 `main` 最新提交跑绿。代价见附录 B 第 6 条

**验证**：随便推一个提交到 main，应被拒：

```sh
git push origin HEAD:main     # 期望：remote rejected ... repository rule violations
```

## 5. tag ruleset

发布 tag 是回滚锚点，不能被改写。

`tag-ruleset.json`：

```json
{
  "name": "protect-release-tags",
  "target": "tag",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/tags/v*"], "exclude": [] } },
  "rules": [{ "type": "deletion" }, { "type": "update" }],
  "bypass_actors": []
}
```

```sh
gh api --method POST repos/<owner>/<repo>/rulesets --input tag-ruleset.json
```

**验证**：创建一个 tag 能推上去，删除会被拒：

```sh
git tag -a v0.0.0-probe -m probe && git push origin v0.0.0-probe   # 期望：成功
git push origin --delete v0.0.0-probe                             # 期望：被拒
```

> 验完记得删掉探测 tag —— 删不掉正是这条规则的作用，要临时把 ruleset 设为 disabled 才能删。

## 6. Environments（人工闸门）

先在 `cd.yml` 里写 `environment: test` / `environment: production`，GitHub 会在首次运行时**自动创建**这两个环境（比手动建省事）。

然后只给 `production` 加保护规则，`test` 保持空白（它要的就是"合进去自动部署"）：

`env-production.json`：

```json
{
  "wait_timer": 0,
  "prevent_self_review": false,
  "can_admins_bypass": false,
  "reviewers": [{ "type": "User", "id": <你的数字 user id> }],
  "deployment_branch_policy": { "protected_branches": false, "custom_branch_policies": true }
}
```

```sh
gh api --method PUT repos/<owner>/<repo>/environments/production --input env-production.json
gh api --method POST repos/<owner>/<repo>/environments/production/deployment-branch-policies -f name='main' -f type='branch'
gh api --method POST repos/<owner>/<repo>/environments/production/deployment-branch-policies -f name='v*' -f type='tag'
```

- `<你的数字 user id>`：`gh api user --jq .id`
- `prevent_self_review: false` —— **solo 必须**，否则没人能批你触发的部署
- `can_admins_bypass: false` —— 否则管理员（你自己）可以不点批准直接放行
- **分支策略要放两条**：`main`（分支）**和** `v*`（tag）。只放 tag 会把手动 dispatch（回滚入口）挡掉 —— 手动触发时的 ref 是分支

**验证**：手动触发一次，应停在等待；批准才继续、拒绝则不部署：

```sh
gh workflow run cd.yml --ref main -f version=v0.0.0-probe
gh api repos/<owner>/<repo>/actions/runs/<run_id>/pending_deployments   # 应看到 production
```

```json
// POST 到 .../actions/runs/<run_id>/pending_deployments
{ "environment_ids": [<env id>], "state": "approved", "comment": "..." }
```

## 7. Secrets（接真实部署时）

- 用 **Environments secrets**（生产密钥只挂到 `production` 环境），不要用仓库级 secrets
- 阿里云优先走 **RAM OIDC 免密**（`aliyun/configure-aliyun-credentials-action`），退而求其次用 RAM 子账号 + 最小权限 AK
- 公开仓库：**fork 的 PR 拿不到 secrets**（这是保护机制，但排查问题时要想到）

## 8. 可选项

- **Dependabot**：管 actions 和依赖版本（`actions/checkout@v4` 多次出现 Node 弃用告警）
- **PR 模板**：固定字段「改了什么 / 怎么验证 / 怎么回滚」
- **CODEOWNERS**：多人才有意义
- **issue 模板**：配合 triage 标签使用

## 附录 A：四个验证命令

```sh
gh api repos/<owner>/<repo>/rulesets --jq '.[] | {name, target, enforcement}'   # 规则存在且 active
gh api repos/<owner>/<repo>/branches/main --jq .protected                        # main 受保护
git push origin HEAD:main                                                        # 直推被拒
gh api repos/<owner>/<repo>/environments/production --jq .protection_rules       # 闸门已配
```

## 附录 B：踩过的坑

1. **classic branch protection 表达不了"必须 PR + 0 approve"** —— 用 ruleset。
2. **`bypass_actors` 留空**。给自己 `always` 后门 = 规则只是建议。
3. **必需检查填 job 名，不是 workflow 名**（`check` 而非 `CI`），且必须逐字匹配。
4. **必需检查要在 CI 跑过一次之后再加**，否则 PR 永远卡 `Expected`。
5. **部署分支策略别忘了分支**，否则手动 dispatch（回滚入口）被挡。
6. **`strict` 的代价**：`main` 一动，其他 PR 立刻 `BLOCKED`，要 merge `main` 再等一次 CI。人少时这是可接受的代价，人多时考虑合并队列。
7. **tag 保护之后，打错的 tag 删不掉** —— 应急要先临时 `disabled` ruleset。
8. **single reviewer 的风险**：账号出问题就没人能批生产部署 —— 应急是同上去掉规则或放开 admin bypass。
9. **`-f` 会把值转成字符串**，数组/数字参数用 `--input` 传 JSON（`environment_ids` 传字符串会 422）。
