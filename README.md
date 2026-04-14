# Mirror H5 项目

基于 React 18 + Vite + TailwindCSS 的移动端 H5 应用，配合 Mirror MVP 技术方案。

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev
# → http://localhost:5173

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
mirror-h5/
├── api/                          # Vercel Serverless Functions
│   └── conflict/
│       ├── upload.js             # POST /api/conflict/upload
│       ├── status.js             # GET  /api/conflict/status
│       ├── shadowbox.js          # POST /api/conflict/shadowbox
│       ├── share.js              # POST /api/conflict/share
│       └── echo.js               # POST /api/conflict/echo
├── src/
│   ├── components/
│   │   ├── StatusSphere/         # 状态球 Canvas 动画
│   │   ├── ShadowBox/            # 影子对练弹窗组件
│   │   └── ParticleBG.jsx        # 全局粒子背景
│   ├── pages/
│   │   ├── HomePage.jsx          # 首页：冲突入口
│   │   ├── ReportPage.jsx        # 报告页：四大标签页
│   │   └── SharePage.jsx         # 匿名分享展示页
│   ├── api/
│   │   └── index.js              # API 调用封装
│   ├── App.jsx                   # 路由配置
│   └── index.css                 # 全局样式 + Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

## 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 冲突记录入口，语音/文字上传 |
| `/conflict/:taskId` | 报告页 | 核心分析报告，四大标签页 |
| `/share/:shareId` | 分享页 | 匿名报告展示（脱敏版） |

## 四大标签页

1. **学者解构** — 逻辑漏洞评分、本我偏差、期望落差、真相洁癖度、行为模式
2. **逻辑军械库** — 场景回溯、三种话术、清晰度对比、影子对练入口
3. **中立裁判** — 逻辑镜像、性格深挖、逻辑定损、终极提问
4. **智者抽离** — 觉知文案 + 坍缩动画

## 状态球动画（Canvas）

| 状态 | 颜色 | 动画 |
|------|------|------|
| ANXIOUS | 红色 | 球体抖动 + 脉冲 |
| TRANSITION | 红→青 | 旋转虚线光环 |
| COLLAPSING | 青色缩小 | 半径渐缩至0 |
| TRANSPARENT | 透明空心 | 双环呼吸 |

## 部署到 Vercel

```bash
# 1. 在 vercel.com 创建项目
# 2. 连接 GitHub 仓库（自动检测 Vercel 项目）
# 3. 添加环境变量（.env.example 中的变量）
# 4. Deploy
```

Vercel 自动识别 `api/` 目录为 Serverless Functions，无需额外配置。

## 与微信机器人（qclaw）联动

微信机器人（qclaw）接收用户语音/文字后：
1. 调用 `POST /api/conflict/upload`，获得 `task_id`
2. 秒回"即时护盾"消息
3. 用户点击 H5 链接 → 轮询 `GET /api/conflict/status?task_id=xxx`
4. 拿到结果后展示完整报告

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | React 18 + Vite |
| 样式 | TailwindCSS + 自定义 CSS |
| 动画 | Canvas API（状态球） |
| 路由 | React Router v6 |
| 后端 | Vercel Serverless Functions |
| 部署 | Vercel（前端+函数一体化） |

## 后续开发建议

- 接入真实的 Supabase 数据库（建表 SQL 参见技术方案文档）
- 接入 OpenAI Whisper API 实现语音转文字
- 接入 OpenAI GPT-3.5-turbo 实现学者分析 Prompt
- 接入 html2canvas + jsPDF 实现报告导出
- 微信机器人 webhook 接入 qclaw（指向 `/api/conflict/upload`）
