use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContributionDay {
    date: String,
    #[serde(rename = "contributionCount")]
    contribution_count: i32,
}

#[derive(Debug, Serialize)]
pub struct FetchResult {
    ok: bool,
    data: Option<Vec<ContributionDay>>,
    error: Option<String>,
}

/// Fetch GitHub contributions with filesystem caching
#[tauri::command]
pub async fn fetch_contributions(
    username: String,
    token: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<FetchResult, String> {
    // Try to load from cache first
    if let Ok(cached_data) = load_from_cache(&username, &app_handle).await {
        return Ok(FetchResult {
            ok: true,
            data: Some(cached_data),
            error: None,
        });
    }

    // Fetch from GitHub API
    match fetch_from_github(&username, token.as_deref()).await {
        Ok(days) => {
            // Save to cache
            let _ = save_to_cache(&username, &days, &app_handle).await;
            
            Ok(FetchResult {
                ok: true,
                data: Some(days),
                error: None,
            })
        }
        Err(e) => Ok(FetchResult {
            ok: false,
            data: None,
            error: Some(e),
        }),
    }
}

/// Fetch data from GitHub GraphQL API
async fn fetch_from_github(
    username: &str,
    token: Option<&str>,
) -> Result<Vec<ContributionDay>, String> {
    let query = r#"
        query($login: String!) {
            user(login: $login) {
                contributionsCollection {
                    contributionCalendar {
                        weeks {
                            contributionDays {
                                date
                                contributionCount
                            }
                        }
                    }
                }
            }
        }
    "#;

    let client = reqwest::Client::new();
    let mut request = client
        .post("https://api.github.com/graphql")
        .header("Content-Type", "application/json")
        .header("User-Agent", "github-widget");

    // Add authorization if token provided
    if let Some(t) = token {
        request = request.header("Authorization", format!("Bearer {}", t));
    }

    let body = serde_json::json!({
        "query": query,
        "variables": {
            "login": username
        }
    });

    let response = request
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API error: {}", response.status()));
    }

    let result: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("JSON parse error: {}", e))?;

    // Check for GraphQL errors
    if let Some(errors) = result.get("errors") {
        return Err(format!("GraphQL error: {}", errors));
    }

    // Extract and flatten contribution days
    let weeks = result["data"]["user"]["contributionsCollection"]["contributionCalendar"]["weeks"]
        .as_array()
        .ok_or("Invalid response structure")?;

    let mut days = Vec::new();
    for week in weeks {
        if let Some(contribution_days) = week["contributionDays"].as_array() {
            for day in contribution_days {
                days.push(ContributionDay {
                    date: day["date"].as_str().unwrap_or("").to_string(),
                    contribution_count: day["contributionCount"].as_i64().unwrap_or(0) as i32,
                });
            }
        }
    }

    Ok(days)
}

/// Load contributions from cache file
async fn load_from_cache(
    username: &str,
    app_handle: &tauri::AppHandle,
) -> Result<Vec<ContributionDay>, String> {
    let cache_path = get_cache_path(username, app_handle)?;

    if !cache_path.exists() {
        return Err("Cache file not found".to_string());
    }

    // Check if cache is older than 5 minutes
    let metadata = fs::metadata(&cache_path).map_err(|e| e.to_string())?;
    if let Ok(modified) = metadata.modified() {
        if let Ok(elapsed) = modified.elapsed() {
            if elapsed.as_secs() > 300 {
                // Cache expired (5 minutes)
                return Err("Cache expired".to_string());
            }
        }
    }

    let content = fs::read_to_string(&cache_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

/// Save contributions to cache file
async fn save_to_cache(
    username: &str,
    days: &[ContributionDay],
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let cache_path = get_cache_path(username, app_handle)?;

    // Ensure cache directory exists
    if let Some(parent) = cache_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let json = serde_json::to_string_pretty(&days).map_err(|e| e.to_string())?;
    fs::write(&cache_path, json).map_err(|e| e.to_string())?;

    Ok(())
}

/// Get cache file path for a specific username
fn get_cache_path(username: &str, app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    Ok(app_data_dir.join("cache").join(format!("{}_contributions.json", username)))
}

/// Clear all cached data
#[tauri::command]
pub async fn clear_cache(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let cache_dir = app_data_dir.join("cache");

    if cache_dir.exists() {
        fs::remove_dir_all(&cache_dir).map_err(|e| e.to_string())?;
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }

    Ok("Cache cleared successfully".to_string())
}

const SERVICE_NAME: &str = "gitpulse";
const USER_KEY: &str = "github_token";

#[tauri::command]
pub async fn save_github_token(token: String) -> Result<(), String> {
    crate::auth::save_token(SERVICE_NAME, USER_KEY, &token)
}

#[tauri::command]
pub async fn get_github_token() -> Result<String, String> {
    crate::auth::get_token(SERVICE_NAME, USER_KEY)
}

#[tauri::command]
pub async fn delete_github_token() -> Result<(), String> {
    crate::auth::delete_token(SERVICE_NAME, USER_KEY)
}
