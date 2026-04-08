# Music — YouTube 音乐播放器

跨平台桌面音乐应用，基于 Tauri 2 + React + TypeScript。  
通过内置 yt-dlp 实现 YouTube 搜索、在线播放和多品质下载。

## 运行

```bash
pnpm install
pnpm run tauri:dev       # 启动桌面应用（开发模式）
```

## 打包

```bash
pnpm run tauri:build     # 生成安装包
```

## 功能

- 搜索 YouTube 音乐
- 在线流式播放（零延迟）
- 多品质下载（FLAC / 320K MP3 / 128K MP3）
- 下载列表管理，点击可在 Finder 中查看
- 默认保存到 `~/Desktop/music/`

## 技术栈

- Tauri 2 (Rust) + React 19 + TypeScript
- Tailwind CSS 4 + Framer Motion
- Zustand 状态管理
- 内置 yt-dlp + ffmpeg（构建时自动下载）
