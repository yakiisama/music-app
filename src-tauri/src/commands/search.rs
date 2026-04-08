use crate::commands::settings::get_settings_cached;
use crate::types::Track;
use crate::utils::ytdlp::ytdlp_cmd;
use serde_json::Value;
use tauri::AppHandle;

#[tauri::command]
pub async fn search_youtube(app: AppHandle, query: String) -> Result<Vec<Track>, String> {
    let q = query.trim();
    if q.is_empty() {
        return Ok(vec![]);
    }

    let count = get_settings_cached().search_count.max(1).min(50);
    let term = format!("ytsearch{count}:{q}");
    let output = ytdlp_cmd(&app)?
        .args([
            term.as_str(),
            "-J",
            "--flat-playlist",
            "--skip-download",
            "--no-warnings",
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(if err.trim().is_empty() {
            "yt-dlp 搜索失败".into()
        } else {
            err.trim().to_string()
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let v: Value = serde_json::from_str(stdout.trim()).map_err(|e| e.to_string())?;

    let mut out = Vec::new();

    if let Some(entries) = v.get("entries").and_then(|e| e.as_array()) {
        for e in entries {
            if let Some(t) = entry_to_track(e) {
                out.push(t);
            }
        }
    } else if let Some(t) = entry_to_track(&v) {
        out.push(t);
    }

    Ok(out)
}

fn entry_to_track(e: &Value) -> Option<Track> {
    let id = e.get("id")?.as_str()?.to_string();
    let title = e
        .get("title")
        .and_then(|t| t.as_str())
        .unwrap_or("Untitled")
        .to_string();

    let duration_sec = e
        .get("duration")
        .and_then(|d| d.as_f64())
        .map(|d| d.round() as u64);

    let thumbnail = pick_thumb(e);
    let uploader = e
        .get("uploader")
        .or_else(|| e.get("channel"))
        .and_then(|u| u.as_str())
        .map(|s| s.to_string());

    Some(Track {
        id,
        title,
        duration_sec,
        thumbnail,
        uploader,
    })
}

fn pick_thumb(e: &Value) -> Option<String> {
    if let Some(s) = e.get("thumbnail").and_then(|t| t.as_str()) {
        return Some(s.to_string());
    }
    let thumbs = e.get("thumbnails")?.as_array()?;
    thumbs
        .iter()
        .filter_map(|t| t.get("url").and_then(|u| u.as_str()))
        .last()
        .map(|s| s.to_string())
}
