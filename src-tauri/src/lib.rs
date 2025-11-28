// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod auth;



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::fetch_contributions,
            commands::clear_cache,
            commands::save_github_token,
            commands::get_github_token,
            commands::delete_github_token
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
