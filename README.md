# demo

测试项目（test）。

## 说明

本仓库用于验证 Git 多账户（GitHub / Gitee）与分支协作流程，目前仅包含本 README 文件。

## 分支策略

| 分支 | 用途 | 限制 |
|---|---|---|
| `main` | 主分支，稳定版本 | 禁止直接推送，必须通过 Pull Request 合并 |
| `dev` | 开发分支，日常集成 | 可直接推送 |
| `test` | 测试分支，验证环境 | 可直接推送 |

## 工作流

1. 从 `dev` 切出功能分支：`git switch -c feat/xxx dev`
2. 提交并推送功能分支：`git push -u origin feat/xxx`
3. 向 `dev` 发起 Pull Request，评审通过后合并
4. 需要发布时，从 `dev` 向 `main` 发起 Pull Request，经评审后合并

## 本地 Git 配置

本仓库使用 SSH 方式访问，提交身份按远端自动区分：

- GitHub 远端（`git@github.com:...`）→ 使用 GitHub 专用身份与密钥
- Gitee 远端（`git@gitee.com:...`）→ 使用 Gitee 专用身份与密钥

## 克隆

```bash
git clone git@github.com:peiqitouteng/demo.git
```
