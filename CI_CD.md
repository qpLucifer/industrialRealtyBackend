# admin-web · CI/CD

本说明默认你的 **GitHub 仓库就是 admin-web 前端工程本身**（根目录有 `package.json`、`vite.config.*`，**不是**「一个大仓里再套一层 `admin-web/`」的 monorepo）。若你确实是后者，见下文「多包仓库」。

## 对应工作流

- **服务器上 git pull 再 build（常见）**：仓库根目录的 `.github/workflows/deploy-admin-web.yml` — SSH 执行 `admin-web/deploy/deploy-test.sh`（路径指你克隆到服务器上的**那一套前端目录**，名字可以叫 `admin-web` 或任意目录名）。
- **只在 GitHub 上 build 再打静态包（可选）**：`admin-web/.github/workflows/deploy-admin-web.yml` — 需在仓库根 `.github/workflows` 放一份才会被 GitHub 执行；或单独一个「只有前端」的仓库直接使用本文件。

## 做什么（服务器 git 部署）

`main` 分支 **push**（且 `admin-web/**` 有变更）→ GitHub **SSH** → 在 `SERVER_ADMIN_APP_DIR` 执行 `deploy-test.sh`：`git` 更新 → 可选写入 **`.env`** → `npm ci` → `npm run build` → `rsync dist/` 到 `SERVER_ADMIN_PUBLIC_DIR`。

## GitHub Secrets

仓库 **Settings → Secrets and variables → Actions** 新建：

| Secret | 必填 | 说明 |
|--------|------|------|
| `ALIYUN_HOST` | 是 | 服务器 IP 或域名 |
| `ALIYUN_USER` | 是 | SSH 用户 |
| `ALIYUN_SSH_PORT` | 是 | SSH 端口，**只填数字**（默认 `22`） |
| `ALIYUN_SSH_KEY` | 是 | SSH **私钥全文**（含 `BEGIN`/`END`） |
| `SERVER_ADMIN_APP_DIR` | 是 | 服务器上前端克隆目录（根目录有 `package.json`） |
| `SERVER_ADMIN_PUBLIC_DIR` | 是 | 宝塔站点 **网站根目录**（`rsync` 目标） |
| `DEPLOY_BRANCH` | 是 | 要检出的分支名，一般为 `main` |
| `SERVER_DOTENV_B64` | 否 | 有则每次部署在该克隆目录下解码写入 **`.env`**（供 `npm run build` 读 `VITE_*`） |

**`SERVER_DOTENV_B64`**：与后端同名 Secret 时，**同一仓库只能存一个字符串**；前后端都要注入且内容不同，请用 [Environment secrets](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) 或不同 Secret 名并改 workflow。

**生成 Secret（独立 admin 仓库：在仓库根目录，即与 `package.json` 同级）**：

```bash
printf '%s' "$(cat .env)" | base64 -w0   # Linux；macOS：base64 | tr -d '\n'
```

若你本地习惯把工程放在子文件夹里，只要 **encode 的那份 `.env` 与线上一致**（含 `VITE_AMAP_WEB_KEY`、`VITE_AMAP_SECURITY_JS_CODE` 等）即可。

将输出的**整段**粘贴到 Secret `SERVER_DOTENV_B64`。勿把 `.env` 提交到 Git。

### 多包仓库（可选）

若大仓根目录没有前端的 `package.json`，而是 **`admin-web/package.json`**：artifact 工作流会先解析目录，把 `.env` 写到 **`admin-web/.env`**，并在该目录执行 `npm run build`。日志里会打印 **Using admin-web/** 或 **Using repo root**。

### 高德地图仍报「搜索失败 / 缺安全密钥」时排查

1. **Vite 只在 `npm run build` 时读 `.env`**：站点根目录（如 `admin-web-test`）里**没有 `.env` 是正常的**。看 Actions / 服务器日志里 **`SERVER_DOTENV_B64 is set`**、**`VITE_AMAP_SECURITY_JS_CODE is non-empty`**（`deploy-test.sh`）。
2. **Secret 必须是纯 base64**；Windows 建议 WSL/Git Bash 生成。
3. **Key 类型**：须为 **Web 端（JS API）**；白名单填浏览器地址栏里的 **协议 + 域名**（含子域），与高德控制台一致。

## 仅静态产物部署（GitHub 上 build）

使用 **`admin-web/.github/workflows/deploy-admin-web.yml`**（放在仓库根 `.github/workflows` 后生效）时：

- 会先判断构建目录是 **仓库根** 还是 **`admin-web/` 子目录**，把 `SERVER_DOTENV_B64` 解码到 **与 `package.json` 同级** 的 `.env`，再在同一目录执行 `npm run build`，避免 `.env` 与构建目录不一致。
- 日志：`Using repo root (standalone admin-web repository).` 或 `Using admin-web/ (multi-package repo layout).`

## SSH 端口与密钥（简要）

**端口**：默认 `22`；可查 `grep -E '^Port' /etc/ssh/sshd_config` 或 `sudo ss -tlnp | grep sshd`。

**密钥**：

```bash
ssh-keygen -t ed25519 -C "gha-deploy" -f ~/.ssh/gha_aliyun -N ""
cat ~/.ssh/gha_aliyun.pub
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/gha_aliyun
ssh -i ~/.ssh/gha_aliyun -p 22 USER@HOST "echo ok"
```

## 宝塔 / 站点

1. `SERVER_ADMIN_PUBLIC_DIR` 与站点根一致。
2. Nginx：`try_files $uri $uri/ /index.html;`。
3. 勿误删 **`.user.ini`** 等。

## 排错

- **SCP/SSH 失败**：端口、密钥、安全组。
- **`APP_DIR` / `PUBLIC_DIR` 错误**：Secret 与服务器路径不一致。
- **缺 `VITE_AMAP_*`**：`SERVER_DOTENV_B64`、服务器克隆目录下的 `.env`、`deploy-test.sh` 校验日志。
- **404 / 旧页面**：Nginx、缓存。
