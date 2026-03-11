# 文档分享实现说明（极简邮箱授权版）

本文档说明 StudyBudd 当前“文件分享”功能的实现方式，目标是用最小复杂度实现：

1. Owner 生成分享链接或分享标签（token）。
2. 通过邮箱白名单控制谁可访问。
3. 被授权用户可查看元数据并下载文件。

## 1. 用到了 Supabase 什么能力

1. Supabase Auth（JWT）
说明：后端从 Bearer token 解析 `sub` 和 `email`，作为权限判断依据。
代码：`apps/api/app/core/dependencies.py`

2. Supabase PostgreSQL（业务表）
说明：分享记录与收件人记录存储在 PostgreSQL 表 `document_shares` 和 `document_share_recipients`。
代码：`apps/api/app/documents/models.py` + Alembic migration

3. Supabase Storage（文件下载）
说明：分享下载接口通过存储路径从 Storage 拉取原文件字节并返回给前端。
代码：`apps/api/app/core/supabase.py`

## 2. 数据模型

### 2.1 `document_shares`

字段用途：
- `id`: 分享记录主键
- `document_id`: 关联被分享文档
- `owner_user_id`: 分享发起者
- `share_token`: 对外分享标识（可作为 tag）
- `expires_at`: 可选过期时间
- `is_revoked`: 是否撤销（当前预留）
- `created_at` / `updated_at`

### 2.2 `document_share_recipients`

字段用途：
- `id`: 主键
- `share_id`: 关联 `document_shares.id`
- `recipient_email`: 允许访问的邮箱

约束：
- `(share_id, recipient_email)` 唯一，防止重复授权。

## 3. API 设计（最小集）

### 3.1 创建分享

接口：
- `POST /api/documents/{document_id}/share-links`

请求体：
```json
{
  "recipient_emails": ["alice@example.com", "bob@example.com"],
  "expires_in_hours": 72
}
```

返回：
- `share_token`（可复制作为 share tag）
- `share_url`（可直接访问链接）

### 3.2 解析分享

接口：
- `GET /api/documents/shared/{share_token}`

行为：
- 校验 token 是否存在、是否过期、是否有权限。
- 返回文档元数据和 `access_level`。

### 3.3 下载分享文件

接口：
- `GET /api/documents/shared/{share_token}/download`

行为：
- 执行与解析接口相同的权限检查。
- 从 Supabase Storage 下载原文件并返回。

## 4. 权限规则（简单可解释）

1. 如果 `is_revoked=true`，返回 404。
2. 如果 `expires_at` 已过，返回 403。
3. 如果当前用户是 `owner_user_id`，允许访问。
4. 如果设置了 recipients，当前 JWT email 必须在 recipients 列表内。
5. 如果 recipients 为空，则“拿到 token 且已登录”的用户可访问。

## 5. 前端交互流程

页面：`/dashboard/files`

步骤：
1. 用户点击文件卡片上的 Share。
2. 在弹窗输入收件人邮箱（可空）。
3. 点击 `Create share` 或 `Copy` 按钮触发创建接口。
4. 前端展示并可复制：
- `Share tag`（`share_token`）
- `Share link`（`share_url`）

页面：`/shared/[token]`

步骤：
1. 页面读取 URL token。
2. 调用解析接口拉取共享文档信息。
3. 点击下载时调用下载接口，浏览器保存文件。

## 6. 关键代码映射

后端：
- 配置分享链接基地址：`apps/api/app/core/config.py`
- ORM 模型：`apps/api/app/documents/models.py`
- 分享 DTO：`apps/api/app/documents/schemas.py`
- 分享业务逻辑：`apps/api/app/documents/service.py`
- 分享路由：`apps/api/app/documents/router.py`
- 迁移建表：`apps/api/alembic/versions/20260224_000001_add_document_shares_and_profile_policies.py`
- Storage 下载：`apps/api/app/core/supabase.py`

前端：
- 分享弹窗与分享创建：`apps/web/src/app/dashboard/files/page.js`
- 分享落地页：`apps/web/src/app/shared/[token]/page.js`

文档：
- 概览文档：`document-sharing.md`（同目录）

## 7. 为什么这是“极简版”

当前明确不包含：
- 自动发邮件（SMTP/第三方邮件服务）
- 分享撤销管理页
- 分享历史列表页
- 权限角色层级（read/write 等）

当前只保留最核心闭环：
- token 生成
- 邮箱白名单授权
- 元数据访问
- 文件下载

## 8. 已知环境注意事项

如果本地执行 `alembic upgrade head` 报 `Can't locate revision identified by '20260302_000002'`：
- 原因：目标数据库 `alembic_version` 已指向一个仓库中不存在的迁移。
- 结论：这是数据库与代码仓库迁移链不一致，不是分享逻辑代码错误。
- 处理建议：先向团队同步缺失迁移文件，或在隔离数据库环境中验证迁移链。
