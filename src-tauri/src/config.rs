use serde_json::Value;
use std::fs;
use tauri::Manager;

pub fn get_api_url(app_handle: &tauri::AppHandle) -> String {
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let config_path = resource_dir.join("config.json");
        if let Ok(config_str) = fs::read_to_string(config_path) {
            if let Ok(config) = serde_json::from_str::<Value>(&config_str) {
                if let Some(api_url) = config["api_url"].as_str() {
                    return api_url.to_string();
                }
            }
        }
    }
    "http://localhost:8080".to_string()
}

pub fn get_ws_url(app_handle: &tauri::AppHandle) -> String {
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let config_path = resource_dir.join("config.json");
        if let Ok(config_str) = fs::read_to_string(config_path) {
            if let Ok(config) = serde_json::from_str::<Value>(&config_str) {
                if let Some(ws_url) = config["ws_url"].as_str() {
                    return ws_url.to_string();
                }
            }
        }
    }
    "ws://localhost:8080/ws/notificacoes".to_string()
}