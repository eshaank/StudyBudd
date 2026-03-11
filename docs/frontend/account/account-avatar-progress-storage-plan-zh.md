# Account Avatar / Productivity Storage 改造方案（中文）

> 目标：在 `Account` 页面中，复用现有 `avatars` bucket，并把 `avatar` 和 `productivity progress` 都放进去，同时把 bucket 改成 private，保证每个用户只能访问自己的数据。

## 1. 改造前检查

当前 `Account` 页没有走 FastAPI 自定义接口，主要是前端直接调用 Supabase。

### 1.1 当前页面入口

- `Account` 页面入口：`apps/web/src/app/account/page.js:9`
- 页面里直接挂载：
  - `AvatarUploader`：`apps/web/src/app/account/page.js:147`
  - `ProductivityHeatmap`：`apps/web/src/app/account/page.js:192`
- 浏览器端 Supabase client 创建位置：`apps/web/src/lib/supabase/client.js:3`

### 1.2 当前 Avatar 逻辑

当前头像已经使用 Supabase Storage，bucket 是现成的 `avatars`。

- bucket 常量：`apps/web/src/app/components/AvatarUploader.jsx:6`
- 读取当前用户：`apps/web/src/app/components/AvatarUploader.jsx:20`
- 读取 `profiles` 表中的 `avatar_path` / `avatar_url`：`apps/web/src/app/components/AvatarUploader.jsx:26`
- 如果拿到的是路径，则用 `getPublicUrl()` 显示头像：`apps/web/src/app/components/AvatarUploader.jsx:40`
- 上传头像到 Storage：`apps/web/src/app/components/AvatarUploader.jsx:69`
- 上传后把路径回写到 `profiles`：`apps/web/src/app/components/AvatarUploader.jsx:82`

结论：

- 头像已经落到 Storage。
- 但现在是 `avatars` bucket。
- 现在显示头像依赖 `public URL`，这意味着 bucket 倾向于是公开访问，不适合“每个人只能访问自己的 avatar”这个要求。

### 1.3 当前 Productivity 逻辑

当前 progress 不是存到 Storage，而是存到数据库表里。

- 热力图读取 `productivity_days`：`apps/web/src/app/components/ProductivityHeatmap.jsx:41`
- 按 `user_id` 查询用户自己的每日聚合：`apps/web/src/app/components/ProductivityHeatmap.jsx:44`
- 番茄钟结束时写入 `pomodoro_sessions`：`apps/web/src/lib/pomodoro/logFocusCompletion.js:16`
- 然后 upsert `productivity_days`：`apps/web/src/lib/pomodoro/logFocusCompletion.js:37`

结论：

- 现在 productivity 展示依赖数据库表，不依赖 Storage。
- 如果直接全量改成“只存 Storage”，会牵扯当前番茄钟写入逻辑，风险比 avatar 大。

### 1.4 当前 Profile 逻辑

- 账户页读取 `profiles.full_name`：`apps/web/src/app/account/page.js:40`
- 保存 `full_name` 到 `profiles`：`apps/web/src/app/account/page.js:105`
- 现有 profile helper：`apps/web/src/lib/profile.js:3`

结论：

- `full_name` 继续留在 `profiles` 表即可，不需要放 Storage。
- 这个需求只聚焦 `avatar` 和 `progress`。

## 2. 最简单版本的改造目标

我建议直接复用已有的私有 bucket：

- bucket 名称：`avatars`

每个用户只使用自己的目录：

- avatar 路径：`{user_id}/avatar.<ext>`
- progress 路径：`{user_id}/progress.json`

### 为什么复用旧 bucket

- 现在头像已经在 `avatars` bucket 里。
- 直接复用现有 bucket，改动比“新建 bucket + 迁移头像逻辑”更小。
- avatar 和 progress 都是 account 页面资产，放一起更容易管理。
- 路径按 `user_id/` 隔离后，权限模型很清晰。

### 为什么 bucket 要设为私有

- 用户要求“每个人都自己的 avatar 和 progress”。
- 如果 bucket 是 public，别人只要拿到路径就可能访问。
- 私有 bucket + Storage policy + signed URL 才符合这个要求。

## 3. 我会怎么改

### 3.1 Avatar 改造

要改的文件：

- `apps/web/src/app/components/AvatarUploader.jsx`
- `apps/web/src/app/account/page.js`

改法：

1. 继续使用 `avatars` bucket。
2. 上传路径保留为 `{user.id}/avatar.<ext>`。
3. `profiles` 里继续记录路径，优先统一为 `avatar_path`。
4. 因为 bucket 改成私有，不再用 `getPublicUrl()`，改为 `createSignedUrl()` 或同等 signed URL 方式显示图片。
5. `Account` 页文案改成 “private Supabase Storage (avatars bucket)”。

为什么这样改：

- 改动最小，复用现有上传组件。
- 不需要新建 FastAPI 上传接口。
- 仍然有一份 `profiles.avatar_path` 作为头像入口，UI 刷新也简单。

### 3.2 Productivity Progress 改造

要改的文件：

- `apps/web/src/app/components/ProductivityHeatmap.jsx`
- `apps/web/src/lib/pomodoro/logFocusCompletion.js`

改法：

1. 新增一个 Storage 文件：`{user_id}/progress.json`。
2. `ProductivityHeatmap` 从 Storage 读取这个 JSON，而不是直接查 `productivity_days`。
3. `logFocusCompletion()` 在现有数据库写入成功后，额外同步一份最新的 progress JSON 到 Storage。
4. JSON 里至少保存：
   - `updated_at`
   - `days[]`
   - 每天的 `day`
   - `focus_minutes`
   - `focus_sessions`

为什么这样改：

- 页面层面可以满足“progress 存 bucket”。
- 现有番茄钟数据库表逻辑不用推翻。
- 这是最小改动，不会把别的依赖 `productivity_days` 的代码一起打坏。

### 3.3 Full Name 不改存储位置

不改的文件逻辑：

- `apps/web/src/app/account/page.js:91`
- `apps/web/src/lib/profile.js:35`

原因：

- 用户当前需求只针对 avatar 和 progress。
- `full_name` 这种结构化 profile 字段放 `profiles` 表更合理。
- 没必要把整个 account 页面都搬去 Storage。

## 4. 接口和接口怎么交流

这版的关键点是：

- 不新增 FastAPI 接口。
- 主要通信链路是：`Frontend Component -> Supabase Browser Client -> Supabase Auth / Storage / Postgres`

### 4.1 Avatar 读取链路

```text
AccountPage
  -> AvatarUploader
  -> createSupabaseBrowser()
  -> supabase.auth.getUser()
  -> supabase.from("profiles").select("avatar_path / avatar_url")
  -> supabase.storage.from("avatars").createSignedUrl(path)
  -> <img src="signedUrl" />
```

说明：

- `profiles` 只负责告诉前端“头像文件路径是什么”。
- 真正的头像文件放在 `avatars` bucket。
- 图片展示依赖 signed URL，而不是 public URL。

### 4.2 Avatar 上传链路

```text
User selects image
  -> AvatarUploader.onFileChange()
  -> supabase.auth.getUser()
  -> supabase.storage.from("avatars").upload("{user_id}/avatar.ext")
  -> supabase.from("profiles").upsert({ id, avatar_path, updated_at })
  -> supabase.storage.from("avatars").createSignedUrl(path)
  -> UI updates avatar preview
```

说明：

- Storage 存文件。
- `profiles` 存路径引用。
- 页面刷新后仍然能通过 `profiles.avatar_path` 找回头像。

### 4.3 Productivity 读取链路

```text
AccountPage
  -> ProductivityHeatmap
  -> createSupabaseBrowser()
  -> supabase.auth.getUser()
  -> supabase.storage.from("avatars").download("{user_id}/progress.json")
  -> parse JSON
  -> build heatmap cells
  -> render streak + grid
```

说明：

- 这里不经过 FastAPI。
- Heatmap 以 Storage 里的 JSON 为读取源。

### 4.4 Productivity 写入链路

```text
Pomodoro focus completed
  -> logFocusCompletion()
  -> supabase.auth.getUser()
  -> supabase.from("pomodoro_sessions").insert(...)
  -> supabase.from("productivity_days").upsert(...)
  -> build next progress JSON
  -> supabase.storage.from("avatars").upload("{user_id}/progress.json", upsert=true)
```

说明：

- 现有数据库写入保留。
- Storage JSON 作为 Account 页 progress 展示文件。
- 这能保证最简单上线，不影响现有番茄钟统计表。

## 5. 为什么不加后端 API

最简单版本里，不建议新增 FastAPI 路由，原因很直接：

- 现在 account 页本来就是前端直连 Supabase。
- avatar 上传已经是前端上传 Storage，改 bucket 就能复用。
- progress 如果只是 account 页面展示，直接存 JSON 到 Storage 就够了。
- 如果这时候额外加后端接口，会增加：
  - 新 router
  - 新 service
  - 新鉴权链路
  - 更多测试面

这不符合“最简单版本”的要求。

## 6. Supabase 需要新增什么

### 6.1 复用旧 bucket

- 名称：`avatars`
- 类型：private

### 6.2 目录约定

- Avatar：`{user_id}/avatar.<ext>`
- Progress：`{user_id}/progress.json`

### 6.3 Storage Policy 目标

需要两类规则：

1. 用户只能读自己目录下的文件
2. 用户只能写自己目录下的文件

逻辑表达式的目标是：

```sql
bucket_id = 'avatars'
AND auth.uid()::text = (storage.foldername(name))[1]
```

说明：

- `storage.foldername(name))[1]` 表示路径第一段，也就是 `user_id`
- 这样用户 A 只能访问 `A/...`

## 7. `progress.json` 结构

最简单结构建议如下：

```json
{
  "updated_at": "2026-03-08T12:34:56Z",
  "days": [
    {
      "day": "2026-03-06",
      "focus_minutes": 25,
      "focus_sessions": 1
    },
    {
      "day": "2026-03-07",
      "focus_minutes": 50,
      "focus_sessions": 2
    }
  ]
}
```

为什么这样设计：

- Heatmap 只需要 `day` 和 `focus_minutes`
- streak 计算也只需要每天有没有分钟数
- `focus_sessions` 保留后续扩展空间

## 8. 我实际会改哪些文件，以及为什么

### 前端

- `apps/web/src/app/components/AvatarUploader.jsx`
  - 改 bucket
  - 改 public URL 为 signed URL
  - 保留当前上传和 profile 回写结构

- `apps/web/src/app/components/ProductivityHeatmap.jsx`
  - 改读取源，从 `productivity_days` 查询切到 Storage JSON 下载

- `apps/web/src/lib/pomodoro/logFocusCompletion.js`
  - 保留现有数据库写入
  - 追加一段 Storage JSON 同步逻辑

- `apps/web/src/app/account/page.js`
  - 更新文案，说明 avatar/progress 在新 bucket

### 不改后端

- 不新增 `apps/api/app/...` 路由
- 不新增 `apps/api/app/...` service

原因：

- 当前需求不需要
- 这样最简单、最少回归风险

## 9. 测试怎么做

实现后测试流程会是：

1. 登录用户 A
2. 打开 `/account`
3. 上传 avatar，确认：
   - `profiles.avatar_path` 被更新
   - `avatars/{userA}/avatar.*` 存在
   - 页面能显示头像
4. 完成一次 focus pomodoro
5. 检查：
   - `pomodoro_sessions` 有新记录
   - `productivity_days` 有更新
   - `avatars/{userA}/progress.json` 被写入
   - `/account` 热力图能显示新增 progress
6. 登录用户 B
7. 验证用户 B 无法读取用户 A 的 avatar/progress

## 10. 风险和边界

- 如果 bucket 是 private，就不能继续用 `getPublicUrl()`，必须改 signed URL。
- 如果 `profiles` 表没有 `avatar_path`，需要继续兼容 `avatar_url`，避免老数据失效。
- 如果只把 progress 放到 Storage、不保留数据库，会影响现有 pomodoro 数据链路；所以最简单版本不建议这么做。
- 这版的“接口交流”核心不是前后端 HTTP API，而是前端和 Supabase 服务之间的调用。

## 11. 最终结论

最简单、最稳的做法是：

- 复用现有 bucket：`avatars`
- Avatar 改用这个 bucket 存储，并通过 signed URL 展示
- Progress 新增一份 `progress.json` 到这个 bucket
- `Account` 页面从 bucket 读取 progress
- 现有 `productivity_days` 保留，避免把现有番茄钟逻辑一起推翻

这套方案满足：

- 每个用户只有自己的 avatar
- 每个用户只有自己的 progress
- 改动面最小
- 不需要新增 FastAPI 接口
