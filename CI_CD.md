# admin-web · CI/CD

对应工作流：`.github/workflows/deploy-admin-web.yml`。

## 做什么

`main` 分支 **push** → GitHub 上 `npm ci && npm run build` → 打包 `dist` → **SCP** 到服务器 `/tmp` → **SSH** 清空站点目录（**保留** `.user.ini`、`.htaccess`）→ 解压到 `SERVER_ADMIN_PUBLIC_DIR`。服务器**不需要 Git**。

## GitHub Secrets

仓库 **Settings → Secrets and variables → Actions** 新建：

| Secret | 说明 |
|--------|------|
| `ALIYUN_HOST` | 服务器 IP 或域名 |
| `ALIYUN_USER` | SSH 用户（如 `root`） |
| `ALIYUN_SSH_PORT` | SSH 端口，**只填数字**（默认 `22`） |
| `ALIYUN_SSH_KEY` | SSH **私钥全文**（含 `BEGIN`/`END` 行） |
| `SERVER_ADMIN_PUBLIC_DIR` | 宝塔站点**网站根目录**（须已存在，与 Nginx 根目录一致） |

`ALIYUN_*` 可与后端项目共用。

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

1. 新建站点，根目录 = `SERVER_ADMIN_PUBLIC_DIR`（工作流会 `test -d`，目录必须先有）。
2. 前端路由：Nginx 建议 `try_files $uri $uri/ /index.html;`。
3. 根目录的 **`.user.ini`** 为宝塔常见文件，工作流已排除删除；勿改为「无差别全删」。

## 排错

- **SCP/SSH 失败**：端口、安全组、`ALIYUN_SSH_KEY` 是否完整（勿改行、勿单行合并）。
- **`test -d` 失败**：Secret 路径与宝塔站点根不一致。
- **404 / 旧页面**：Nginx 根目录、SPA 配置、浏览器缓存。
