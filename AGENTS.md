# AGENTS.md — 给 AI / 协作者的仓库说明

本文件帮助自动化代理与人类快速理解 **Music**（YouTube 音乐桌面端）的架构与约定。

## 项目是什么

- **Tauri 2** 桌面壳 + **React 19 + TypeScript** 前端。
- 通过内置 **yt-dlp**、**ffmpeg**（`src-tauri/build.rs` 在构建时拉取到 `src-tauri/binaries/`，勿提交二进制）完成搜索、流式播放、下载。
- 包管理器：**pnpm**（版本以 `package.json` 的 `packageManager` 为准，勿与 CI 里再写一套冲突版本）。

## 常用命令

```bash
pnpm install
pnpm run tauri:dev    # 桌面开发（需本机 Rust 工具链）
pnpm run build        # 仅前端
pnpm run tauri:build  # 前端 + Tauri 打包
```

## 目录结构（改功能时优先看这里）

| 路径 | 说明 |
|------|------|
| `src/` | React UI：`App.tsx` 主导航与全局布局 |
| `src/components/` | 页面级组件（搜索栏、列表、播放器、设置、下载弹窗等） |
| `src/hooks/` | `useAudio`、`useSearch`、`useDownload`、`useSettings`、`useUpdater` |
| `src/stores/playerStore.ts` | Zustand 全局状态（tab、播放、下载任务、设置等） |
| `src/types.ts` | 前端与 invoke 对齐的 TS 类型 |
| `src-tauri/src/lib.rs` | Tauri 入口：注册插件与 `invoke_handler` |
| `src-tauri/src/commands/` | `search`、`stream`、`download`、`settings` 等命令 |
| `src-tauri/src/commands/settings.rs` | 持久化配置路径、默认下载目录等 |
| `src-tauri/tauri.conf.json` | 窗口、bundle、**updater** 公钥与 endpoints |
| `src-tauri/capabilities/` | 权限：`default.json` + `desktop.json`（updater / process） |
| `.github/workflows/release.yml` | 打 `v*` tag 触发 Release；**不要**在 `pnpm/action-setup` 里写与 `packageManager` 冲突的 `version` |

## 实现约定

- **少改无关文件**；风格与现有代码一致（Tailwind 4、无渐变、Framer Motion 适度动效）。
- 前后端字段名：Rust 侧 `serde(rename_all = "camelCase")` 与前端 `camelCase` 对齐。
- 新增 Tauri 命令：在 `commands/` 实现 → `commands/mod.rs` 声明 → `lib.rs` 的 `generate_handler!` 注册 → 前端 `invoke`。
- 新增需暴露给前端的系统能力：检查并更新 `src-tauri/capabilities/*.json`。
- **不要**将 `.keys/` 下的签名私钥提交进 Git。

## 发布与自动更新（摘要）

- `tauri.conf.json` 中 `bundle.createUpdaterArtifacts` 与 `plugins.updater` 已配置；CI 需 `TAURI_SIGNING_PRIVATE_KEY`（及可选密码）才能产出签名与 `latest.json`。
- 细节见 `README.md` 与官方 [Tauri Updater](https://v2.tauri.app/plugin/updater/) 文档。

## 语言

- 用户面向文案：**简体中文**。
- 代码标识符与注释：与现有文件保持一致（中文注释仅用于难懂逻辑）。
