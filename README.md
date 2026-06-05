# Learning Assistant 学习助手

一款基于 AI 的桌面学习工具，使用费曼技巧、第一性原理和苏格拉底提问三种经典方法，帮助大学生深入理解知识。

## ✨ 功能

- **费曼技巧** — 用通俗语言解释概念，AI 检测理解盲区
- **第一性原理** — 拆解知识到基本真理，可视化拆解树
- **苏格拉底提问** — AI 通过追问引导你深挖问题本质
- **间隔复习** — SM-2 算法驱动的 3D 翻转卡片
- **专注模式** — 番茄钟，自定义时长
- **学习进度** — 统计图表、成就系统
- **知识库** — 支持 PDF/DOCX/MD/TXT 资料导入
- **多 AI 提供商** — Claude、OpenAI、Ollama 本地模型

## 📦 安装

### 方式一：安装包（推荐）

1. 下载 `Learning Assistant Setup x.x.x.exe`
2. 双击运行，按向导完成安装
3. 桌面双击图标启动

### 方式二：开发者启动

```bash
git clone https://github.com/At3ase/Sulight_AI-Learning-Companion.git
cd Sulight_AI-Learning-Companion
npm install
npm run dev
```

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron 42 |
| 前端 | React 18 + TypeScript + Tailwind CSS 3 |
| 构建 | Vite 8 |
| 状态管理 | Zustand |
| 数据库 | sql.js (SQLite/WASM) |
| AI | Claude / OpenAI / Ollama |

## 📖 文档

- [开发指南](CLAUDE.md)
- 更多文档见 `docs/` 目录

## 📄 许可

MIT License
