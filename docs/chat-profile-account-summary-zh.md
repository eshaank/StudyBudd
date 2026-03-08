# Chat 和 Profile / Account 功能总结（中文）

分支：`ac-avatar-account`  
目标：可读、可展示、可快速定位到代码

## 1) 什么访问了什么（调用链）

### Chat（流式对话）调用链

1. 用户在 Chat 页面发送消息。  
   页面挂载与消息 hook 接线：`apps/web/src/app/dashboard/chat/page.js:49`、`apps/web/src/app/dashboard/chat/page.js:57`  
   发送入口：`apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:58`

2. 前端调用 `POST /api/chat/stream`。  
   代码：`apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:79`

3. 后端 Router 接收流式请求，进入 `chat_stream`。  
   代码：`apps/api/app/chat/router.py:30`

4. Service 处理流式对话：创建会话（如需要）、保存用户消息、构造消息历史、调用 Together 模型。  
   代码：`apps/api/app/chat/service.py:161`、`apps/api/app/chat/service.py:186`、`apps/api/app/chat/service.py:193`、`apps/api/app/chat/service.py:207`

5. 若触发 RAG，后端执行 `search_my_documents` 工具检索。  
   工具 schema / prompt：`apps/api/app/chat/tools.py:84`、`apps/api/app/chat/tools.py:107`  
   检索执行：`apps/api/app/chat/tools.py:134`  
   Service 调用工具：`apps/api/app/chat/service.py:247`、`apps/api/app/chat/service.py:266`、`apps/api/app/chat/service.py:308`

6. 后端通过 SSE 返回 `token` / `done` 事件，前端实时拼接并落最终消息。  
   后端：`apps/api/app/chat/service.py:299`、`apps/api/app/chat/service.py:400`  
   前端：`apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:114`、`apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:126`

7. 对话列表、历史、重命名、删除也都通过聊天 API 访问。  
   前端：`apps/web/src/app/dashboard/chat/hooks/useThreads.js:20`、`apps/web/src/app/dashboard/chat/hooks/useThreads.js:57`、`apps/web/src/app/dashboard/chat/hooks/useThreads.js:97`  
   后端：`apps/api/app/chat/router.py:49`、`apps/api/app/chat/router.py:59`、`apps/api/app/chat/router.py:68`、`apps/api/app/chat/router.py:90`

### Profile / Account（账户、头像、进度）调用链

1. 用户打开 `/account` 页面，前端先读取 Supabase 当前用户，再查询 `profiles.full_name`。  
   代码：`apps/web/src/app/account/page.js:20`、`apps/web/src/app/account/page.js:28`、`apps/web/src/app/account/page.js:41`

2. 用户在 Account 页面修改姓名并点击 `Save changes`。  
   代码入口：`apps/web/src/app/account/page.js:92`  
   前端调用 `profiles.upsert(...)` 保存 `full_name`：`apps/web/src/app/account/page.js:106`

3. 保存成功后，前端触发 `studybudd:profile-updated` 事件。  
   代码：`apps/web/src/app/account/page.js:115`、`apps/web/src/lib/profile.js:33`

4. Navbar 监听该事件，重新加载 `profiles`，并优先显示 `profiles.full_name`。  
   代码：`apps/web/src/app/components/Navbar.jsx:50`、`apps/web/src/app/components/Navbar.jsx:68`、`apps/web/src/app/components/Navbar.jsx:105`、`apps/web/src/app/components/Navbar.jsx:144`

5. 用户上传头像时，前端把文件写入私有 `avatars` bucket 的 `{user_id}/avatar.ext`。  
   代码入口：`apps/web/src/app/components/AvatarUploader.jsx:49`  
   Storage 上传：`apps/web/src/app/components/AvatarUploader.jsx:71`

6. 上传成功后，前端把路径回写到 `profiles.avatar_path`（旧 schema 回退到 `avatar_url`）。  
   代码：`apps/web/src/app/components/AvatarUploader.jsx:82`、`apps/web/src/app/components/AvatarUploader.jsx:89`

7. 头像显示不再依赖 public URL，而是对 storage path 生成 signed URL；Navbar 和 Account 都复用这套解析逻辑。  
   代码：`apps/web/src/lib/profile.js:20`  
   Account 头像预览：`apps/web/src/app/components/AvatarUploader.jsx:42`、`apps/web/src/app/components/AvatarUploader.jsx:100`  
   Navbar 头像显示：`apps/web/src/app/components/Navbar.jsx:81`、`apps/web/src/app/components/Navbar.jsx:89`、`apps/web/src/app/components/Navbar.jsx:234`

8. Account 页的 Productivity heatmap 优先从 `avatars/{user_id}/progress.json` 读取。  
   代码：`apps/web/src/app/components/ProductivityHeatmap.jsx:62`、`apps/web/src/app/components/ProductivityHeatmap.jsx:124`

9. 如果 `progress.json` 还不存在，前端回退查询 `productivity_days`，并顺手回填一份 Storage snapshot。  
   代码：`apps/web/src/app/components/ProductivityHeatmap.jsx:73`、`apps/web/src/app/components/ProductivityHeatmap.jsx:127`、`apps/web/src/app/components/ProductivityHeatmap.jsx:129`

10. 用户完成一个 focus pomodoro 时，前端先写 `pomodoro_sessions` 与 `productivity_days`，再把最新聚合同步到 `avatars/{user_id}/progress.json`。  
    代码：`apps/web/src/lib/pomodoro/logFocusCompletion.js:63`、`apps/web/src/lib/pomodoro/logFocusCompletion.js:74`、`apps/web/src/lib/pomodoro/logFocusCompletion.js:95`、`apps/web/src/lib/pomodoro/logFocusCompletion.js:103`

## 2) 在哪里的代码

### Chat

- 前端聊天页：`apps/web/src/app/dashboard/chat/page.js:18`、`apps/web/src/app/dashboard/chat/page.js:49`、`apps/web/src/app/dashboard/chat/page.js:57`
- Auth token hook：`apps/web/src/app/dashboard/chat/hooks/useAuth.js:4`
- 对话列表 / 重命名 / 删除：`apps/web/src/app/dashboard/chat/hooks/useThreads.js:6`
- 消息流式发送 / SSE 处理：`apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:12`
- 聊天路由：`apps/api/app/chat/router.py:30`、`apps/api/app/chat/router.py:49`、`apps/api/app/chat/router.py:59`、`apps/api/app/chat/router.py:68`、`apps/api/app/chat/router.py:90`
- 聊天服务：`apps/api/app/chat/service.py:31`、`apps/api/app/chat/service.py:161`
- RAG 工具与系统提示：`apps/api/app/chat/tools.py:84`、`apps/api/app/chat/tools.py:107`、`apps/api/app/chat/tools.py:134`

### Profile / Account

- 账户页：`apps/web/src/app/account/page.js:10`
- Navbar 账户入口 / 名字 / 头像刷新：`apps/web/src/app/components/Navbar.jsx:38`
- 头像上传组件：`apps/web/src/app/components/AvatarUploader.jsx:13`
- Productivity heatmap：`apps/web/src/app/components/ProductivityHeatmap.jsx:99`
- Profile helper（signed URL / refresh event）：`apps/web/src/lib/profile.js:3`
- Pomodoro 完成后写 progress snapshot：`apps/web/src/lib/pomodoro/logFocusCompletion.js:20`、`apps/web/src/lib/pomodoro/logFocusCompletion.js:63`

## 3) 用了 Supabase 什么

### Chat

- Supabase Auth JWT：接口鉴权。  
  代码：`apps/api/app/core/dependencies.py:66`

- Supabase PostgreSQL：`conversations`、`messages` 存储会话和消息。  
  代码：`apps/api/app/chat/router.py:55`、`apps/api/app/chat/service.py:39`、`apps/api/app/chat/service.py:61`、`apps/api/app/chat/service.py:196`

- Supabase Browser Session：前端从 session 拿 access token。  
  代码：`apps/web/src/app/dashboard/chat/hooks/useAuth.js:10`

### Profile / Account

- Supabase Auth：前端读取当前登录用户。  
  代码：`apps/web/src/app/account/page.js:28`、`apps/web/src/app/components/Navbar.jsx:55`、`apps/web/src/app/components/AvatarUploader.jsx:24`、`apps/web/src/app/components/ProductivityHeatmap.jsx:107`

- Supabase PostgreSQL：`profiles` 存名字和头像路径。  
  代码：`apps/web/src/app/account/page.js:41`、`apps/web/src/app/account/page.js:106`、`apps/web/src/app/components/AvatarUploader.jsx:83`、`apps/web/src/app/components/Navbar.jsx:68`

- Supabase PostgreSQL：`pomodoro_sessions`、`productivity_days` 存番茄钟会话和按日聚合。  
  代码：`apps/web/src/lib/pomodoro/logFocusCompletion.js:74`、`apps/web/src/lib/pomodoro/logFocusCompletion.js:84`

- Supabase Storage：私有 `avatars` bucket 存头像和 `progress.json`。  
  代码：`apps/web/src/app/components/AvatarUploader.jsx:71`、`apps/web/src/lib/profile.js:26`、`apps/web/src/app/components/ProductivityHeatmap.jsx:63`、`apps/web/src/lib/pomodoro/logFocusCompletion.js:53`

## 4) 代码上用了哪些功能

### Chat

- SSE 流式返回（`token` / `done`）。  
  代码：`apps/api/app/chat/service.py:299`、`apps/api/app/chat/service.py:400`

- 前端按 token 实时拼接，再用 done 事件替换最终消息。  
  代码：`apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:114`、`apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:126`

- 新会话自动创建、历史拼装。  
  代码：`apps/api/app/chat/service.py:186`、`apps/api/app/chat/service.py:208`

- Together AI function calling / 文本工具调用双通道兼容。  
  代码：`apps/api/app/chat/service.py:227`、`apps/api/app/chat/service.py:244`、`apps/api/app/chat/tools.py:38`

- 可选 RAG 工具检索并回传 sources。  
  代码：`apps/api/app/chat/tools.py:134`、`apps/api/app/chat/service.py:267`、`apps/api/app/chat/service.py:396`

### Profile / Account

- `profiles.upsert(...)` 保存 `full_name`。  
  代码：`apps/web/src/app/account/page.js:106`

- 头像上传到私有 bucket，并把 storage path 回写到 `profiles.avatar_path`。  
  代码：`apps/web/src/app/components/AvatarUploader.jsx:71`、`apps/web/src/app/components/AvatarUploader.jsx:83`

- signed URL 生成与旧 public URL 兼容解析。  
  代码：`apps/web/src/lib/profile.js:8`、`apps/web/src/lib/profile.js:20`

- `studybudd:profile-updated` 事件，驱动 Navbar 立即刷新名字和头像。  
  代码：`apps/web/src/lib/profile.js:4`、`apps/web/src/lib/profile.js:33`、`apps/web/src/app/components/Navbar.jsx:105`

- `progress.json` snapshot 写入、Storage 优先读取、数据库回退补写。  
  代码：`apps/web/src/lib/pomodoro/logFocusCompletion.js:20`、`apps/web/src/app/components/ProductivityHeatmap.jsx:62`、`apps/web/src/app/components/ProductivityHeatmap.jsx:73`、`apps/web/src/app/components/ProductivityHeatmap.jsx:85`
