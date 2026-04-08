#![cfg_attr(mobile, tauri::mobile_entry_point)]

mod commands;
mod types;
mod utils;

use commands::download::{download_track, list_downloaded_files, open_in_finder};
use commands::search::search_youtube;
use commands::settings::{get_settings, pick_folder, save_settings};
use commands::stream::get_stream_url;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            #[cfg(target_os = "macos")]
            {
                use cocoa::appkit::NSImage;
                use cocoa::base::{id, nil};
                use cocoa::foundation::NSData;
                use objc::{class, msg_send, sel, sel_impl};
                unsafe {
                    let icon_bytes = include_bytes!("../icons/icon.png");
                    let data = NSData::dataWithBytes_length_(
                        nil,
                        icon_bytes.as_ptr() as *const std::os::raw::c_void,
                        icon_bytes.len() as u64,
                    );
                    let ns_image = NSImage::initWithData_(NSImage::alloc(nil), data);
                    let ns_app: id = msg_send![class!(NSApplication), sharedApplication];
                    let _: () = msg_send![ns_app, setApplicationIconImage: ns_image];
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            search_youtube,
            get_stream_url,
            download_track,
            list_downloaded_files,
            open_in_finder,
            get_settings,
            save_settings,
            pick_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
