use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

/// 应用持久化配置，保存为 JSON 文件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub download_dir: String,
    pub default_quality: String,
    pub search_count: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        let dl = default_download_dir();
        Self {
            download_dir: dl.to_string_lossy().into_owned(),
            default_quality: "mp3_320".into(),
            search_count: 10,
        }
    }
}

fn default_download_dir() -> PathBuf {
    dirs::desktop_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_else(|| PathBuf::from(".")).join("Desktop"))
        .join("music")
}

fn config_path() -> PathBuf {
    let base = dirs::config_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_else(|| PathBuf::from(".")).join(".config"));
    base.join("yt-music-player").join("settings.json")
}

static SETTINGS: Mutex<Option<AppSettings>> = Mutex::new(None);

fn load_inner() -> AppSettings {
    let path = config_path();
    if path.exists() {
        if let Ok(data) = fs::read_to_string(&path) {
            if let Ok(s) = serde_json::from_str::<AppSettings>(&data) {
                return s;
            }
        }
    }
    AppSettings::default()
}

fn save_inner(s: &AppSettings) -> Result<(), String> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(s).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(())
}

/// 获取当前设置（缓存）
pub fn get_settings_cached() -> AppSettings {
    let mut guard = SETTINGS.lock().unwrap();
    if let Some(ref s) = *guard {
        return s.clone();
    }
    let s = load_inner();
    *guard = Some(s.clone());
    s
}

#[tauri::command]
pub fn get_settings() -> AppSettings {
    get_settings_cached()
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    save_inner(&settings)?;
    let mut guard = SETTINGS.lock().unwrap();
    *guard = Some(settings);
    Ok(())
}

#[tauri::command]
pub fn pick_folder() -> Result<Option<String>, String> {
    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("osascript")
            .args([
                "-e",
                "set theFolder to choose folder with prompt \"选择下载目录\"",
                "-e",
                "POSIX path of theFolder",
            ])
            .output()
            .map_err(|e| e.to_string())?;
        if output.status.success() {
            let p = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !p.is_empty() {
                return Ok(Some(p));
            }
        }
        return Ok(None);
    }

    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = '选择下载目录'; if ($f.ShowDialog() -eq 'OK') { $f.SelectedPath } else { '' }",
            ])
            .output()
            .map_err(|e| e.to_string())?;
        let p = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !p.is_empty() {
            return Ok(Some(p));
        }
        return Ok(None);
    }

    #[cfg(target_os = "linux")]
    {
        let output = std::process::Command::new("zenity")
            .args(["--file-selection", "--directory", "--title=选择下载目录"])
            .output()
            .map_err(|e| e.to_string())?;
        if output.status.success() {
            let p = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !p.is_empty() {
                return Ok(Some(p));
            }
        }
        return Ok(None);
    }

    #[allow(unreachable_code)]
    Ok(None)
}
