use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncPair {
    pub id: String,
    pub name: String,
    pub source: String,
    pub target: String,
    pub selected: bool,
    #[serde(default)]
    pub recursive: bool,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Config {
    #[serde(default)]
    pub pairs: Vec<SyncPair>,
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("无法获取配置目录: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("创建配置目录失败: {e}"))?;
    Ok(dir.join("config.json"))
}

pub fn load_config(app: &AppHandle) -> Result<Config, String> {
    let path = config_path(app)?;
    if !path.exists() {
        return Ok(Config::default());
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("读取配置失败: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("解析配置失败: {e}"))
}

pub fn save_config(app: &AppHandle, config: &Config) -> Result<(), String> {
    let path = config_path(app)?;
    let raw = serde_json::to_string_pretty(config).map_err(|e| format!("序列化配置失败: {e}"))?;
    fs::write(&path, raw).map_err(|e| format!("写入配置失败: {e}"))
}
