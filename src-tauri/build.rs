use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn main() {
    let target = env::var("TARGET").expect("TARGET");
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    let bin_dir = manifest_dir.join("binaries");
    fs::create_dir_all(&bin_dir).expect("create binaries dir");

    ensure_yt_dlp(&bin_dir, &target);
    ensure_ffmpeg(&bin_dir, &target);

    tauri_build::build();
}

fn ytdlp_dest(bin_dir: &Path, target: &str) -> PathBuf {
    let base = format!("yt-dlp-{}", target);
    if target.contains("windows") {
        bin_dir.join(format!("{base}.exe"))
    } else {
        bin_dir.join(base)
    }
}

fn ffmpeg_dest(bin_dir: &Path, target: &str) -> PathBuf {
    let base = format!("ffmpeg-{}", target);
    if target.contains("windows") {
        bin_dir.join(format!("{base}.exe"))
    } else {
        bin_dir.join(base)
    }
}

fn ensure_yt_dlp(bin_dir: &Path, target: &str) {
    let dest = ytdlp_dest(bin_dir, target);
    if dest.exists() && !should_replace_ytdlp(&dest, target) {
        return;
    }
    let url = ytdlp_url(target);
    println!("cargo:warning=fetching yt-dlp ({target})");
    download(url, &dest);
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&dest).unwrap().permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&dest, perms).unwrap();
    }
}

fn ytdlp_url(target: &str) -> &'static str {
    match target {
        t if t.contains("windows") && t.contains("aarch64") => {
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_arm64.exe"
        }
        t if t.contains("windows") => {
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
        }
        t if t.contains("apple") => {
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
        }
        t if t.contains("linux") && t.contains("aarch64") => {
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64"
        }
        t if t.contains("linux") => {
            "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"
        }
        _ => panic!("unsupported TARGET for yt-dlp bundle: {target}"),
    }
}

fn should_replace_ytdlp(path: &Path, target: &str) -> bool {
    if target.contains("windows") {
        return false;
    }

    let Ok(bytes) = fs::read(path) else {
        return true;
    };

    // We accidentally used the generic `yt-dlp` script before, which needs Python.
    // If the sidecar starts with a shebang, redownload platform binary.
    bytes.starts_with(b"#!")
}

fn ffmpeg_url(target: &str) -> &'static str {
    match target {
        t if t.contains("windows") && t.contains("aarch64") => {
            "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64"
        }
        t if t.contains("windows") => {
            "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64"
        }
        t if t.contains("apple") && t.contains("aarch64") => {
            "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64"
        }
        t if t.contains("apple") && t.contains("x86_64") => {
            "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-x64"
        }
        t if t.contains("linux") && t.contains("aarch64") => {
            "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-arm64"
        }
        t if t.contains("linux") && t.contains("x86_64") => {
            "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64"
        }
        _ => panic!("unsupported TARGET for ffmpeg bundle: {target}"),
    }
}

fn ensure_ffmpeg(bin_dir: &Path, target: &str) {
    let dest = ffmpeg_dest(bin_dir, target);
    if dest.exists() {
        return;
    }
    let url = ffmpeg_url(target);
    println!("cargo:warning=fetching ffmpeg ({target})");
    download(url, &dest);

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&dest).unwrap().permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&dest, perms).unwrap();
    }
}

fn download(url: &str, dest: &Path) {
    let status = Command::new("curl")
        .arg("-L")
        .arg("--fail")
        .arg("--silent")
        .arg("--show-error")
        .arg("-o")
        .arg(dest.as_os_str())
        .arg(url)
        .status()
        .expect("failed to spawn curl");
    assert!(status.success(), "curl download failed for {url}");
}
