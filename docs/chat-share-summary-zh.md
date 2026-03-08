# Chat 和 Share 功能总结（中文）

> 分支：`ac-share`  
> 目标：可读、可展示、可快速定位到代码

## 1) 什么访问了什么（调用链）

### Share（文件分享）调用链

1. 用户在文件页点击 Share，输入邮箱并创建分享。  
   代码入口：`apps/web/src/app/dashboard/files/page.js:206`、`apps/web/src/app/dashboard/files/page.js:258`
2. 前端调用 `POST /api/documents/{id}/share-links`。  
   代码：`apps/web/src/app/dashboard/files/page.js:268`
3. 后端 Router 收请求并校验文档归属。  
   代码：`apps/api/app/documents/router.py:126`
4. Service 生成 `share_token`，写入 `document_shares`，再写邮箱到 `document_share_recipients`。  
   代码：`apps/api/app/documents/service.py:231`
5. 前端拿到 `share_url` 和 `share_token`，显示 Share link 和 Share tag。  
   代码：`apps/web/src/app/dashboard/files/page.js:288`、`apps/web/src/app/dashboard/files/page.js:1062`
6. 访问方打开 `/shared/[token]` 页面，调用 `GET /api/documents/shared/{token}`。  
   代码：`apps/web/src/app/shared/[token]/page.js:42`、`apps/api/app/documents/router.py:163`
7. 后端按 JWT email 做权限判断（`owner` 或 `recipient` allowlist，或公开 `link`）。  
   代码：`apps/api/app/documents/service.py:319`
8. 下载时调用 `GET /api/documents/shared/{token}/download`，后端从 Supabase Storage 读取文件字节并返回。  
   代码：`apps/api/app/documents/router.py:194`、`apps/api/app/core/supabase.py:85`

### Chat（流式对话）调用链

1. 用户在 Chat 页面发送消息。  
   代码入口：`apps/web/src/app/dashboard/chat/page.js:200`
2. 前端调用 `POST /api/chat/stream`。  
   代码：`apps/web/src/app/dashboard/chat/page.js:225`
3. 后端 Router 接收流式请求，进入 `chat_stream`。  
   代码：`apps/api/app/chat/router.py:30`
4. Service 处理流式对话：创建会话（如需要）、保存用户消息、构造历史、调用 Agent 流式输出。  
   代码：`apps/api/app/chat/service.py:147`
5. 若触发 RAG，Agent 工具 `search_my_documents` 调用检索。  
   代码：`apps/api/app/chat/agent.py:94`、`apps/api/app/chat/agent.py:115`
6. 后端通过 SSE 返回 `token`/`done` 事件，前端实时拼接并落最终消息。  
   代码：`apps/api/app/chat/service.py:205`、`apps/api/app/chat/service.py:239`、`apps/web/src/app/dashboard/chat/page.js:263`、`apps/web/src/app/dashboard/chat/page.js:276`

## 2) 在哪里的代码

### Share

- 分享表模型：`apps/api/app/documents/models.py:142`、`apps/api/app/documents/models.py:168`
- 分享请求/响应 DTO：`apps/api/app/documents/schemas.py:59`、`apps/api/app/documents/schemas.py:84`、`apps/api/app/documents/schemas.py:96`
- 分享业务逻辑：`apps/api/app/documents/service.py:195` 到 `apps/api/app/documents/service.py:358`
- 分享路由：`apps/api/app/documents/router.py:126`、`apps/api/app/documents/router.py:163`、`apps/api/app/documents/router.py:194`
- 前端分享弹窗：`apps/web/src/app/dashboard/files/page.js:206`、`apps/web/src/app/dashboard/files/page.js:1020`
- 分享落地页：`apps/web/src/app/shared/[token]/page.js:30`
- 分享链接基地址配置：`apps/api/app/core/config.py:163`
- 建表迁移：`apps/api/alembic/versions/20260224_000001_add_document_shares_and_profile_policies.py:21`

### Chat

- 前端聊天页：`apps/web/src/app/dashboard/chat/page.js:48`、`apps/web/src/app/dashboard/chat/page.js:77`、`apps/web/src/app/dashboard/chat/page.js:200`
- 聊天路由：`apps/api/app/chat/router.py:30`、`apps/api/app/chat/router.py:49`、`apps/api/app/chat/router.py:59`、`apps/api/app/chat/router.py:68`、`apps/api/app/chat/router.py:90`
- 聊天服务：`apps/api/app/chat/service.py:147`
- Agent/RAG 工具：`apps/api/app/chat/agent.py:58`、`apps/api/app/chat/agent.py:94`

## 3) 用了 Supabase 什么

### Share

- Supabase Auth JWT：解析 `sub` 和 `email`。  
  代码：`apps/api/app/core/dependencies.py:66`、`apps/api/app/core/dependencies.py:154`
- Supabase PostgreSQL：`document_shares`、`document_share_recipients` 存储分享权限关系。  
  代码：`apps/api/app/documents/models.py:142`、`apps/api/app/documents/models.py:168`
- Supabase Storage：分享下载读取文件。  
  代码：`apps/api/app/core/supabase.py:85`

### Chat

- Supabase Auth JWT：接口鉴权。  
  代码：`apps/api/app/core/dependencies.py:66`
- Supabase PostgreSQL：`conversations`、`messages` 存储会话和消息。  
  代码：`apps/api/app/chat/router.py:55`、`apps/api/app/chat/service.py:169`、`apps/api/app/chat/service.py:227`

## 4) 代码上用了哪些功能

### Share

- 安全 token 生成：`secrets.token_urlsafe(24)`。  
  代码：`apps/api/app/documents/service.py:249`
- 邮箱规范化和去重：`lower/strip + 校验`。  
  代码：`apps/api/app/documents/schemas.py:65`、`apps/api/app/documents/service.py:195`
- 邮箱白名单唯一约束：`(share_id, recipient_email)`。  
  代码：`apps/api/app/documents/models.py:173`
- 访问控制：`owner / recipient / link` 三种级别。  
  代码：`apps/api/app/documents/service.py:319`
- 前端支持“只生成 tag/link 不填邮箱”与“按邮箱限制分享”两种模式。  
  代码：`apps/web/src/app/dashboard/files/page.js:329`

### Chat

- SSE 流式返回（`token` / `done`）。  
  代码：`apps/api/app/chat/service.py:205`、`apps/api/app/chat/service.py:239`
- 前端按 token 实时拼接，再用 done 事件替换最终消息。  
  代码：`apps/web/src/app/dashboard/chat/page.js:263`、`apps/web/src/app/dashboard/chat/page.js:276`
- 新会话自动创建、历史拼装。  
  代码：`apps/api/app/chat/service.py:161`、`apps/api/app/chat/service.py:181`
- 可选 RAG 工具检索并回传 sources。  
  代码：`apps/api/app/chat/agent.py:94`、`apps/api/app/chat/service.py:248`
