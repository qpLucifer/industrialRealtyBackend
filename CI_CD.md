# admin-web · CI/CD

对应工作流：

- **Monorepo（本仓库根目录）**：`.github/workflows/deploy-admin-web.yml` — SSH 在服务器执行 `admin-web/deploy/deploy-test.sh`（`git pull` + `npm run build`）。
- **仅打包静态资源（可选）**：`admin-web/.github/workflows/deploy-admin-web.yml` — 在 GitHub 上 `npm run build` 后 SCP `dist`（若该文件放在仓库根 `.github/workflows` 才生效）。

## 做什么

`main` 分支 **push**（且 `admin-web/**` 有变更）→ GitHub **SSH** 到服务器 → 在 `SERVER_ADMIN_APP_DIR` 执行 `deploy-test.sh`：`git` 更新 → 可选写入 **`.env`** → `npm ci` → `npm run build` → `rsync dist/` 到 `SERVER_ADMIN_PUBLIC_DIR`。

## GitHub Secrets

仓库 **Settings → Secrets and variables → Actions** 新建：

| Secret | 必填 | 说明 |
|--------|------|------|
| `ALIYUN_HOST` | 是 | 服务器 IP 或域名 |
| `ALIYUN_USER` | 是 | SSH 用户 |
| `ALIYUN_SSH_PORT` | 是 | SSH 端口，**只填数字**（默认 `22`） |
| `ALIYUN_SSH_KEY` | 是 | SSH **私钥全文**（含 `BEGIN`/`END`） |
| `SERVER_ADMIN_APP_DIR` | 是 | 服务器上 **admin-web 克隆目录**（内含 `package.json`、`deploy/deploy-test.sh`） |
| `SERVER_ADMIN_PUBLIC_DIR` | 是 | 宝塔站点 **网站根目录**（`rsync` 目标） |
| `DEPLOY_BRANCH` | 是 | 要检出的分支名，一般为 `main` |
| `SERVER_DOTENV_B64` | 否 | 有则每次部署在 `SERVER_ADMIN_APP_DIR` 下解码写入 **`.env`**（供 `npm run build` 读取 `VITE_*`）；**内容应为 `admin-web/.env` 整文件的 base64** |

**`SERVER_DOTENV_B64`**（与后端 `industrial-realty-server` 工作流同名 Secret 的用法一致，便于记忆；**同一 GitHub 仓库里该 Secret 只能存一个字符串**——若 monorepo 里前后端都要 CI 注入不同 `.env`，请拆成两个仓库，或为其中一侧改用 [Environment secrets](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) / 不同 Secret 名并自行改 workflow）。

生成方式（在 **`admin-web` 目录** 下，对应当前 `admin-web/.env`）：

```bash
cd admin-web
printf '%s' "$(cat .env)" | base64 -w0   # Linux；macOS 去掉 -w0
```

将输出的**整段**粘贴到 Secret `SERVER_DOTENV_B64`。勿把 `.env` 提交到 Git。

## 仅静态产物部署（GitHub 上 build）

若使用 **`admin-web/.github/workflows/deploy-admin-web.yml`** 且已放到仓库根 `.github/workflows`（或单独 admin-web 仓库）：

- 在 **Install and build** 之前会解码 `SERVER_DOTENV_B64` → `admin-web/.env`（monorepo）或仓库根 `.env`（单包仓库）。
- `VITE_*` 在 **GitHub Actions 构建时** 打入产物；无需在 Nginx 目录再放 `.env`。

## SSH 端口与密钥（简要）

**端口**：未改 sshd 时一般为 `22`。服务器上可查：`grep -E '^Port' /etc/ssh/sshd_config` 或 `sudo ss -tlnp | grep sshd`。宝塔 / 阿里云安全组 / 防火墙需放行同一端口。

**密钥**（建议单独一对，勿用日常主密钥）：

```bash
ssh-keygen -t ed25519 -C "gha-deploy" -f ~/.ssh/gha_aliyun -N ""
cat ~/.ssh/gha_aliyun.pub   # 整行追加到服务器该用户的 ~/.ssh/authorized_keys
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/gha_aliyun       # 全文粘贴到 Secret ALIYUN_SSH_KEY
ssh -i ~/.ssh/gha_aliyun -p 22 USER@HOST "echo ok"   # 先本地验证再保存 Secrets
```

Windows：用 PowerShell 执行 `ssh-keygen`，私钥路径一般为 `%USERPROFILE%\.ssh\gha_aliyun`。

## 宝塔 / 站点

1. `SERVER_ADMIN_PUBLIC_DIR` 与站点根目录一致；`deploy-test.sh` 会 `rsync --delete dist/` 到该目录。
2. 前端路由：Nginx 建议 `try_files $uri $uri/ /index.html;`。
3. 根目录的 **`.user.ini`** 等为宝塔常见文件，勿误删。

## 排错

- **SCP/SSH 失败**：端口、安全组、`ALIYUN_SSH_KEY` 是否完整（勿改行、勿单行合并）。
- **`APP_DIR` / `PUBLIC_DIR` 错误**：Secret 路径与服务器实际目录不一致。
- **构建缺少 `VITE_AMAP_*` 等**：检查是否设置 `SERVER_DOTENV_B64` 或服务器 `APP_DIR/.env`。
- **404 / 旧页面**：Nginx 根目录、SPA 配置、浏览器缓存。
