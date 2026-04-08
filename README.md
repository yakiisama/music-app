# Music — YouTube 音乐播放器

```sh
xattr -dr com.apple.quarantine "/Applications/Music.app"
```

跨平台桌面音乐应用，基于 Tauri 2 + React + TypeScript。  
通过内置 yt-dlp 实现 YouTube 搜索、在线播放和多品质下载。

## 运行

```bash
pnpm install
pnpm run tauri:dev       # 启动桌面应用（开发模式）
```

## 打包

```bash
pnpm run tauri:build     # 生成安装包（需配置签名环境变量才会生成更新用签名，见下）
```

修改依赖后请 **`pnpm install` 并提交 `pnpm-lock.yaml`** 再推送到 GitHub，否则 Release Actions 可能仍安装旧版 `@tauri-apps/plugin-*`，与 Rust 侧版本不一致导致构建失败。

## 自动更新

正式安装包启动后会静默检查 GitHub Releases 上的 `latest.json`；若有新版本会提示「下载并安装」。也可在 **设置 → 应用更新** 里手动检查。

发布带自动更新的版本需要：

1. 在仓库 **Settings → Secrets and variables → Actions** 中添加 **`TAURI_SIGNING_PRIVATE_KEY`**，值为 minisign 私钥文件的**完整文本**（与 `tauri.conf.json` 里 `plugins.updater.pubkey` 对应的一对密钥）。若生成密钥时设置了密码，再添加 **`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`**。
2. 本地生成密钥示例：`pnpm exec tauri signer generate -w .keys/tauri.key`（勿提交私钥；仓库已 `.gitignore` 忽略 `.keys/`）。将生成的 `.pub` 内容填入 `tauri.conf.json` 的 `pubkey` 字段。
3. 推送 `v*` 标签会触发 [`.github/workflows/release.yml`](.github/workflows/release.yml)，使用 `tauri-apps/tauri-action` 构建并上传安装包及 **`latest.json`**（供应用内更新拉取）。

## 功能

- 搜索 YouTube 音乐
- 在线流式播放（零延迟）
- 多品质下载（音频 FLAC / MP3，视频 MP4 多档）
- 下载列表管理，点击可在 Finder 中查看
- 默认保存到 `~/Desktop/music/`
- 应用内检查更新并下载安装（正式包）

## 技术栈

- Tauri 2 (Rust) + React 19 + TypeScript
- Tailwind CSS 4 + Framer Motion
- Zustand 状态管理
- 内置 yt-dlp + ffmpeg（构建时自动下载）
