use crate::commands::settings::get_settings_cached;
use crate::utils::ytdlp::ytdlp_cmd;
use regex::Regex;
use serde::Serialize;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Emitter;
use tauri_plugin_shell::process::CommandEvent;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub video_id: String,
    pub percent: Option<f64>,
    pub message: String,
    pub done: bool,
    pub error: Option<String>,
    pub save_path: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadedFile {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
}

fn current_download_dir() -> PathBuf {
    PathBuf::from(&get_settings_cached().download_dir)
}

#[tauri::command]
pub fn open_in_finder(path: String) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    let target = if p.is_file() {
        p.parent().unwrap_or(p)
    } else {
        p
    };
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn list_downloaded_files() -> Result<Vec<DownloadedFile>, String> {
    let dir = current_download_dir();
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut files = Vec::new();
    let entries = std::fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        if !matches!(ext.as_str(), "mp3" | "flac" | "m4a" | "opus" | "ogg" | "wav" | "webm" | "mp4" | "mkv" | "avi" | "mov") {
            continue;
        }
        let meta = std::fs::metadata(&path).map_err(|e| e.to_string())?;
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();
        files.push(DownloadedFile {
            name,
            path: path.to_string_lossy().into_owned(),
            size_bytes: meta.len(),
        });
    }
    files.sort_by(|a, b| b.name.cmp(&a.name));
    Ok(files)
}

#[tauri::command]
pub fn download_track(app: AppHandle, video_id: String, quality: String) -> Result<(), String> {
    let id = video_id.trim().to_string();
    if id.is_empty() {
        return Err("缺少视频 ID".into());
    }

    let q = quality.trim().to_string();
    let app_handle = app.clone();
    let app_err = app_handle.clone();

    std::thread::spawn(move || {
        let track_id = id.clone();
        let watch_id = id.clone();
        let track_id_for_err = id.clone();
        let app_inner = app_handle;
        let fut = async move {
            let out_dir = current_download_dir();
            std::fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;
            let save_path_str = out_dir.to_string_lossy().into_owned();

            let watch_url = format!("https://www.youtube.com/watch?v={}", watch_id);
            let mut args: Vec<String> = vec![
                watch_url,
                "-P".into(),
                save_path_str.clone(),
                "-o".into(),
                "%(title)s.%(ext)s".into(),
                "--newline".into(),
                "--no-colors".into(),
                "--no-warnings".into(),
                "--windows-filenames".into(),
            ];

            match q.as_str() {
                "flac" => {
                    args.extend_from_slice(&[
                        "-f".into(),
                        "bestaudio/best".into(),
                        "-x".into(),
                        "--audio-format".into(),
                        "flac".into(),
                    ]);
                }
                "mp3_320" => {
                    args.extend_from_slice(&[
                        "-f".into(),
                        "bestaudio/best".into(),
                        "-x".into(),
                        "--audio-format".into(),
                        "mp3".into(),
                        "--postprocessor-args".into(),
                        "ffmpeg:-b:a 320k".into(),
                    ]);
                }
                "mp3_128" => {
                    args.extend_from_slice(&[
                        "-f".into(),
                        "bestaudio/best".into(),
                        "-x".into(),
                        "--audio-format".into(),
                        "mp3".into(),
                        "--postprocessor-args".into(),
                        "ffmpeg:-b:a 128k".into(),
                    ]);
                }
                "mp4_1080" => {
                    args.extend_from_slice(&[
                        "-f".into(),
                        "bestvideo[height<=1080]+bestaudio/best[height<=1080]".into(),
                        "--merge-output-format".into(),
                        "mp4".into(),
                    ]);
                }
                "mp4_720" => {
                    args.extend_from_slice(&[
                        "-f".into(),
                        "bestvideo[height<=720]+bestaudio/best[height<=720]".into(),
                        "--merge-output-format".into(),
                        "mp4".into(),
                    ]);
                }
                "mp4_480" => {
                    args.extend_from_slice(&[
                        "-f".into(),
                        "bestvideo[height<=480]+bestaudio/best[height<=480]".into(),
                        "--merge-output-format".into(),
                        "mp4".into(),
                    ]);
                }
                _ => {
                    args.extend_from_slice(&[
                        "-f".into(),
                        "bestaudio/best".into(),
                        "-x".into(),
                        "--audio-format".into(),
                        "mp3".into(),
                        "--postprocessor-args".into(),
                        "ffmpeg:-b:a 128k".into(),
                    ]);
                }
            }

            let cmd = ytdlp_cmd(&app_inner)?;
            let arg_refs: Vec<&str> = args.iter().map(String::as_str).collect();
            let (mut rx, _child) = cmd.args(arg_refs).spawn().map_err(|e| e.to_string())?;

            let re = Regex::new(r"(?P<p>\d+(?:\.\d+)?)%").map_err(|e| e.to_string())?;

            while let Some(event) = rx.recv().await {
                match event {
                    CommandEvent::Stderr(data) | CommandEvent::Stdout(data) => {
                        let line = String::from_utf8_lossy(&data).to_string();
                        let mut percent = None;
                        if let Some(caps) = re.captures(&line) {
                            if let Ok(p) = caps["p"].parse::<f64>() {
                                percent = Some(p);
                            }
                        }
                        let _ = app_inner.emit(
                            "download-progress",
                            DownloadProgress {
                                video_id: track_id.clone(),
                                percent,
                                message: line,
                                done: false,
                                error: None,
                                save_path: Some(save_path_str.clone()),
                            },
                        );
                    }
                    CommandEvent::Error(err) => {
                        let _ = app_inner.emit(
                            "download-progress",
                            DownloadProgress {
                                video_id: track_id.clone(),
                                percent: None,
                                message: err.clone(),
                                done: true,
                                error: Some(err),
                                save_path: Some(save_path_str.clone()),
                            },
                        );
                    }
                    CommandEvent::Terminated(payload) => {
                        if payload.code.unwrap_or(1) != 0 {
                            return Err("下载失败（yt-dlp 退出码非 0）".to_string());
                        }
                    }
                    _ => {}
                };
            }

            let _ = app_inner.emit(
                "download-progress",
                DownloadProgress {
                    video_id: track_id.clone(),
                    percent: Some(100.0),
                    message: "完成".into(),
                    done: true,
                    error: None,
                    save_path: Some(save_path_str),
                },
            );

            Ok::<(), String>(())
        };

        if let Err(e) = tauri::async_runtime::block_on(fut) {
            let _ = app_err.emit(
                "download-progress",
                DownloadProgress {
                    video_id: track_id_for_err.clone(),
                    percent: None,
                    message: e.clone(),
                    done: true,
                    error: Some(e),
                    save_path: None,
                },
            );
        }
    });

    Ok(())
}
