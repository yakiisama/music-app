use tauri::AppHandle;
use tauri_plugin_shell::process::Command;
use tauri_plugin_shell::ShellExt;

pub fn ytdlp_cmd(app: &AppHandle) -> Result<Command, String> {
    app.shell().sidecar("yt-dlp").map_err(|e| e.to_string())
}
