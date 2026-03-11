# Document Sharing 功能总结（中文）

分支：`ac-avatar-account`  
目标：可读、可展示、可快速定位到代码

## 1) 什么访问了什么（调用链）

### Document Sharing（文档分享）调用链

1. 用户在 Files 页点击某个文档行上的 `Share` 按钮。  
   按钮入口：`apps/web/src/app/dashboard/files/components/DocumentRow.jsx:61`  
   Files 页接线：`apps/web/src/app/dashboard/files/page.js:32`、`apps/web/src/app/dashboard/files/page.js:254`

2. 前端打开分享弹窗，并在本地维护 `shareDoc`、邮箱输入、分享链接和 loading/error 状态。  
   Modal 挂载：`apps/web/src/app/dashboard/files/page.js:271`  
   状态与事件：`apps/web/src/app/dashboard/files/hooks/useShareModal.js:5`、`apps/web/src/app/dashboard/files/hooks/useShareModal.js:30`、`apps/web/src/app/dashboard/files/hooks/useShareModal.js:67`  
   弹窗 UI：`apps/web/src/app/dashboard/files/components/ShareModal.jsx:28`、`apps/web/src/app/dashboard/files/components/ShareModal.jsx:66`

3. 用户点击 `Generate & Copy` 时，前端调用 `POST /api/documents/{id}/share-links`，并以空 `recipient_emails` 生成公开 link。  
   前端：`apps/web/src/app/dashboard/files/hooks/useShareModal.js:74`、`apps/web/src/app/dashboard/files/hooks/useShareModal.js:88`

4. 用户点击 `Share` 时，前端调用同一个 `POST /api/documents/{id}/share-links`，但会把 recipient email 列表一起提交。  
   前端：`apps/web/src/app/dashboard/files/hooks/useShareModal.js:102`、`apps/web/src/app/dashboard/files/hooks/useShareModal.js:108`

5. 后端 Router 接收创建分享请求，先校验文档归属，再进入 share service。  
   Router：`apps/api/app/documents/router.py:126`  
   文档归属校验：`apps/api/app/documents/router.py:134`

6. Service 规范化邮箱、生成 `share_token`、写入 `document_shares`，再把邮箱白名单写入 `document_share_recipients`。  
   规范化：`apps/api/app/documents/service.py:238`  
   token 生成：`apps/api/app/documents/service.py:249`  
   share 写入：`apps/api/app/documents/service.py:261`  
   recipient 写入：`apps/api/app/documents/service.py:271`

7. 前端拿到 `share_url` 后，弹窗展示可复制链接；如果是 recipient share，也会显示成功 toast。  
   前端 state：`apps/web/src/app/dashboard/files/hooks/useShareModal.js:91`、`apps/web/src/app/dashboard/files/hooks/useShareModal.js:117`  
   弹窗展示：`apps/web/src/app/dashboard/files/components/ShareModal.jsx:22`、`apps/web/src/app/dashboard/files/components/ShareModal.jsx:75`

8. 访问方打开 `/shared/[token]` 页面时，前端调用 `GET /api/documents/shared/{token}` 拉取共享文档元数据。  
   页面入口：`apps/web/src/app/shared/[token]/page.js:37`  
   页面加载请求：`apps/web/src/app/shared/[token]/page.js:52`、`apps/web/src/app/shared/[token]/page.js:63`  
   Router：`apps/api/app/documents/router.py:163`

9. 后端按 JWT 里的 `sub` / `email` 做权限判断，返回 `owner` / `recipient` / `link` 三种 access level。  
   取 share + document + recipients：`apps/api/app/documents/service.py:290`  
   权限判断：`apps/api/app/documents/service.py:365`

10. 访问方点击 `Save to my library` 时，前端调用 `POST /api/documents/shared/{token}/import`。后端重新校验权限，然后从 Supabase Storage 下载原文件，复制到当前用户自己的 storage path，再创建新的 `documents` 记录。  
    前端：`apps/web/src/app/shared/[token]/page.js:81`、`apps/web/src/app/shared/[token]/page.js:91`  
    Router：`apps/api/app/documents/router.py:225`、`apps/api/app/documents/router.py:257`  
    Service：`apps/api/app/documents/service.py:319`、`apps/api/app/documents/service.py:337`、`apps/api/app/documents/service.py:344`

11. 后端也保留了 `GET /api/documents/shared/{token}/download` 下载路由，但当前 shared page UI 主流程已经切到 `Save to my library`。  
    Router：`apps/api/app/documents/router.py:194`

## 2) 在哪里的代码

### Frontend

- Files 页分享入口：`apps/web/src/app/dashboard/files/components/DocumentRow.jsx:7`
- Files 页 share modal 接线：`apps/web/src/app/dashboard/files/page.js:21`
- Share modal state hook：`apps/web/src/app/dashboard/files/hooks/useShareModal.js:5`
- Share modal UI：`apps/web/src/app/dashboard/files/components/ShareModal.jsx:3`
- Shared 落地页：`apps/web/src/app/shared/[token]/page.js:37`

### Backend

- 分享路由：`apps/api/app/documents/router.py:32`、`apps/api/app/documents/router.py:126`、`apps/api/app/documents/router.py:163`、`apps/api/app/documents/router.py:194`、`apps/api/app/documents/router.py:225`
- 分享业务逻辑：`apps/api/app/documents/service.py:225` 到 `apps/api/app/documents/service.py:393`
- 分享表模型：`apps/api/app/documents/models.py:109`、`apps/api/app/documents/models.py:135`
- 分享请求 / 响应 DTO：`apps/api/app/documents/schemas.py:59`、`apps/api/app/documents/schemas.py:84`、`apps/api/app/documents/schemas.py:96`
- Storage 下载封装：`apps/api/app/core/supabase.py:85`
- 分享链接基地址配置：`apps/api/app/core/config.py:137`

## 3) 用了 Supabase 什么

### Document Sharing

- Supabase Auth JWT：后端从 Bearer token 解析 `sub` 和 `email`，用于 owner / recipient 权限判断。  
  代码：`apps/api/app/core/dependencies.py:66`、`apps/api/app/core/dependencies.py:146`

- Supabase PostgreSQL：`document_shares`、`document_share_recipients` 存储分享关系和邮箱白名单；`documents` 也会在 import 时新增一份副本记录。  
  代码：`apps/api/app/documents/models.py:109`、`apps/api/app/documents/models.py:135`、`apps/api/app/documents/service.py:344`

- Supabase Storage：创建 share 后通过 storage path 间接访问原文件；import 时先下载原文件，再重新上传到 recipient 的 storage path。  
  代码：`apps/api/app/core/supabase.py:85`、`apps/api/app/documents/service.py:337`、`apps/api/app/documents/service.py:338`

## 4) 代码上用了哪些功能

### Document Sharing

- 安全 token 生成：`secrets.token_urlsafe(24)`。  
  代码：`apps/api/app/documents/service.py:249`

- 邮箱规范化、校验和去重：`lower/strip` + invalid email reject。  
  代码：`apps/api/app/documents/schemas.py:65`、`apps/api/app/documents/service.py:238`

- 邮箱白名单唯一约束：`(share_id, recipient_email)`。  
  代码：`apps/api/app/documents/models.py:139`

- 访问控制：`owner` / `recipient` / `link` 三种 access level。  
  代码：`apps/api/app/documents/service.py:365`

- 分享链接组装：后端用 `WEB_BASE_URL` + `/shared/{token}` 生成 `share_url`。  
  代码：`apps/api/app/documents/service.py:225`、`apps/api/app/core/config.py:137`

- 前端支持“只生成 link 不填邮箱”与“按邮箱限制分享”两种模式。  
  代码：`apps/web/src/app/dashboard/files/hooks/useShareModal.js:74`、`apps/web/src/app/dashboard/files/hooks/useShareModal.js:102`

- Shared 落地页使用当前 Supabase session access token 调用受保护 API，并支持一键 `Save to my library`。  
  代码：`apps/web/src/app/shared/[token]/page.js:11`、`apps/web/src/app/shared/[token]/page.js:58`、`apps/web/src/app/shared/[token]/page.js:81`

- Import 流程会复制 storage object，而不是直接把共享者的 storage path 暴露给接收方长期复用。  
  代码：`apps/api/app/documents/service.py:337`、`apps/api/app/documents/service.py:344`

## 5) 当前分支注意事项

1. 当前 `ac-avatar-account` 分支的 Files 页 share modal 已经接到真实 share API，不再是纯 mock。  
   证据：`apps/web/src/app/dashboard/files/hooks/useShareModal.js:88`、`apps/web/src/app/dashboard/files/hooks/useShareModal.js:108`

2. 当前 shared page 的主流程是 `Save to my library`，不是直接下载；不过后端 `download` 路由仍然保留，后续如果要恢复“直接下载”按钮，后端不需要重写。  
   代码：`apps/api/app/documents/router.py:194`、`apps/web/src/app/shared/[token]/page.js:81`
