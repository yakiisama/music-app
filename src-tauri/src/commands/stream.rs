use crate::utils::ytdlp::ytdlp_cmd;
use tauri::AppHandle;

#[tauri::command]
pub async fn get_stream_url(app: AppHandle, video_id: String) -> Result<String, String> {
    let id = video_id.trim();
    if id.is_empty() {
        return Err("缺少视频 ID".into());
    }
    let url = format!("https://www.youtube.com/watch?v={id}");

    let output = ytdlp_cmd(&app)?
        .args(["-f", "bestaudio/best", "-g", "--no-warnings", url.as_str()])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(if err.trim().is_empty() {
            "无法获取播放地址".into()
        } else {
            err.trim().to_string()
        });
    }

    let text = String::from_utf8_lossy(&output.stdout);
    let line = text
        .lines()
        .map(|l| l.trim())
        .find(|l| !l.is_empty())
        .ok_or_else(|| "播放地址为空".to_string())?;

    Ok(line.to_string())
}
