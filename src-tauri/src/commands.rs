use tauri::AppHandle;
use uuid::Uuid;

use crate::config::{load_config, save_config, SyncPair};
use crate::sync::{sync_pair, SyncResult};

#[tauri::command]
pub fn list_pairs(app: AppHandle) -> Result<Vec<SyncPair>, String> {
    Ok(load_config(&app)?.pairs)
}

#[tauri::command]
pub fn add_pair(
    app: AppHandle,
    name: String,
    source: String,
    target: String,
    recursive: bool,
) -> Result<SyncPair, String> {
    let mut config = load_config(&app)?;
    let pair = SyncPair {
        id: Uuid::new_v4().to_string(),
        name,
        source,
        target,
        selected: true,
        recursive,
    };
    config.pairs.push(pair.clone());
    save_config(&app, &config)?;
    Ok(pair)
}

#[tauri::command]
pub fn update_pair(app: AppHandle, pair: SyncPair) -> Result<(), String> {
    let mut config = load_config(&app)?;
    if let Some(existing) = config.pairs.iter_mut().find(|p| p.id == pair.id) {
        *existing = pair;
    } else {
        return Err("目录对不存在".to_string());
    }
    save_config(&app, &config)
}

#[tauri::command]
pub fn delete_pair(app: AppHandle, id: String) -> Result<(), String> {
    let mut config = load_config(&app)?;
    config.pairs.retain(|p| p.id != id);
    save_config(&app, &config)
}

#[tauri::command]
pub fn sync_pairs(app: AppHandle, pair_ids: Vec<String>) -> Result<Vec<SyncResult>, String> {
    let config = load_config(&app)?;
    let mut results = Vec::new();
    for id in pair_ids {
        if let Some(pair) = config.pairs.iter().find(|p| p.id == id) {
            results.push(sync_pair(&app, pair));
        }
    }
    Ok(results)
}
