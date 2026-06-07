<p align="center">
  <h1 align="center">📚 Sulight AI-Learning Companion</h1>
  <p align="center">Learning Assistant 学习助手</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-42-47848F?logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/version-1.1.0-orange" alt="Version" />
</p>

<p align="center">
  一款基于 AI 的桌面学习工具，使用费曼技巧、第一性原理和苏格拉底提问三种经典方法，帮助大学生深入理解知识。
</p>

---

## ✨ 功能

### 🧠 三种 AI 学习模式

| 模式 | 描述 | AI 导师 |
|------|------|---------|
| **费曼技巧** | 用通俗语言向 AI 解释概念，AI 实时检测理解盲区和术语滥用 | 小费 🎓 |
| **第一性原理** | 将复杂概念层层拆解到基本真理，可视化拆解树状图 | 原理 🔺 |
| **苏格拉底提问** | AI 通过 7 种提问类型（澄清/假设检验/证据评估/含义探索/视角转换/结果推演/溯源追问）引导深度思考 | 苏格 ❓ |

### 📋 其他功能

- **📊 知识库** — 支持 PDF / DOCX / MD / TXT 资料导入，按学科-主题-材料三级组织
- **🃏 间隔复习** — SM-2 算法驱动的 3D 翻转卡片，在学习会话后自动生成复习卡片
- **⏱ 专注模式** — 全屏番茄钟，自定义专注/休息时长，浏览器通知 + 音效提醒
- **📈 学习进度** — Recharts 可视化图表（理解力趋势、学习分布、每日时长），成就徽章系统，周报
- **🎓 课程管理** — 按课程组织学习内容，追踪各科目掌握进度
- **🚀 首次引导** — 新手引导向导，帮助快速配置和了解功能
- **⌨ 全局快捷键** — `Ctrl+1/2/3` 切换学习模式，`Ctrl+Shift+F` 专注模式，`Ctrl+R` 复习队列
- **🔧 组件管理** — 仪表盘右上角「+」自由添加学习连续、今日统计、番茄钟等组件
- **🌓 深色模式** — 自动适配系统主题，可手动切换
- **📤 数据导出** — Markdown 笔记 / Anki CSV / JSON 完整备份

### 🤖 多 AI 提供商

- **Claude** (Anthropic) — 推荐，深度推理能力强
- **OpenAI** (GPT 系列)
- **DeepSeek** — 高性价比，中文能力强
- **通义千问 (Qwen)** — 阿里云，qwen-turbo/plus/max
- **Kimi (月之暗面)** — 长上下文，128k tokens
- **智谱 GLM** — 清华系，glm-4-flash/glm-4
- **豆包 (火山引擎)** — 字节跳动
- **Ollama** — 本地模型，隐私零泄露
- 统一「自定义 API」卡片，下拉选择预设即可配置
- 支持流式输出、连接测试、API Key AES-256-GCM 加密存储

---

## 📸 界面预览

> 💡 运行应用 `npm run dev` 后可截取以下界面截图：
> - Dashboard 首页 — 学习模式卡片 + 学习概览 + 每日复习 + 可添加组件
> - Feynman 对话界面 — 与"小费"对话
> - First Principles 拆解树 — 双栏布局，右侧实时拆解树
> - Socratic 问答 — 7 种问题类型彩色标签
> - Focus Mode — 全屏番茄钟 + SVG 环形进度
> - Progress 分析 — Area/Pie/Bar 图表 + 成就墙
> - Review 翻转卡片 — 3D 翻转动画 + SM-2 评级

---

## 📦 安装

### 方式一：安装包（推荐）

1. 前往 [Releases](https://github.com/At3ase/Sulight_AI-Learning-Companion/releases) 页面
2. 下载 `Learning Assistant-1.1.0-win.zip`
3. 解压后运行 `Learning Assistant.exe`

### 方式二：开发者启动

```bash
git clone https://github.com/At3ase/Sulight_AI-Learning-Companion.git
cd Sulight_AI-Learning-Companion
npm install
npm run dev
```

---

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron 42 |
| 前端 | React 18 + TypeScript 5.9 + Tailwind CSS 3 |
| 构建 | Vite 8 |
| 状态管理 | Zustand 5 |
| 路由 | React Router 6 (HashRouter) |
| UI 组件 | Radix UI (Dialog/DropdownMenu/Select/Tabs/Tooltip) |
| 图表 | Recharts 3 |
| 图标 | Lucide React |
| 数据库 | sql.js (SQLite → WASM，零原生依赖) |
| 加密 | AES-256-GCM (API Key 存储) |
| 文件解析 | pdf-parse + mammoth (DOCX) |
| AI SDK | @anthropic-ai/sdk + openai |
| Markdown | react-markdown + marked + turndown |

---

## 🏗 架构

```
Electron Shell
├── Main Process (electron/)
│   ├── main.ts              # 入口：创建窗口、初始化 DB、注册 IPC
│   ├── preload.ts           # contextBridge → window.electronAPI
│   ├── ipc/                 # IPC 处理器 (database/settings/app/ai/file)
│   └── services/
│       ├── ai/              # AI 流式调用、多提供商管理、难度适配
│       ├── database/        # sql.js 连接 + SQL 迁移
│       ├── review/          # SM-2 间隔重复调度器 + AI 卡片生成器
│       ├── file-parser/     # PDF/DOCX/MD/TXT 解析导入
│       └── credential-store # AES-256-GCM 加密存储
│
└── Renderer Process (src/)
    ├── App.tsx              # 根组件 + HashRouter + 全局快捷键 + 首次引导
    ├── components/          # 完整 UI 组件
    │   ├── layout/          # AppLayout, Sidebar, NavigationMenu
    │   ├── dashboard/       # 首页(快速开始/学习概览/每日复习/组件管理/额外组件)
    │   ├── learning-modes/  # 费曼/第一性原理/苏格拉底(含共享组件)
    │   ├── review/          # 3D 翻转卡片 + SM-2 复习队列
    │   ├── focus/           # 全屏番茄钟
    │   ├── progress/        # 数据洞察 + 成就系统 + 导出
    │   ├── knowledge/       # 知识库管理
    │   ├── courses/         # 课程管理
    │   ├── settings/        # AI 配置 + 外观设置
    │   └── onboarding/      # 首次引导向导
    ├── stores/              # Zustand 状态管理 (7 个 store)
    ├── prompts/             # AI 人格提示词
    ├── hooks/               # 自定义 Hooks (情绪检测)
    └── utils/               # 上下文窗口管理
```

---

## ⌨ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+1` | 费曼技巧 |
| `Ctrl+2` | 第一性原理 |
| `Ctrl+3` | 苏格拉底对话 |
| `Ctrl+Shift+F` | 专注模式 |
| `Ctrl+R` | 复习队列 |
| `Ctrl+D` | 返回首页 |
| `Ctrl+,` | 设置 |
| `Esc` | 退出专注模式 |

---

## 🔧 开发

```bash
npm run dev           # 启动 Vite 开发服务器 + Electron
npm run build         # TypeScript 检查 + Vite 生产构建
npm run electron:build # 生产构建 + electron-builder 打包
npx vitest            # 运行测试
```

---

## 📖 文档

- [开发指南](CLAUDE.md) — 面向 AI 编程助手的项目文档
- 更多文档见 `docs/` 目录

---

## 📄 许可

MIT License © 2026 ZHUOYE
