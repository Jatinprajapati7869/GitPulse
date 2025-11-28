// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod auth;



/// Initializes and runs the Tauri application with registered plugins and exposed commands.
///
/// This function builds the Tauri application, registers the opener and filesystem plugins,
/// exposes the application's command handlers to the frontend, and starts the application
/// event loop. It will panic if the application fails to run.
///
/// # Examples
///
/// ```no_run
/// fn main() {
///     run();
/// }
/// ```
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