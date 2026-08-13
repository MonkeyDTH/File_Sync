use serde::Serialize;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};
use walkdir::WalkDir;

use crate::config::SyncPair;

#[derive(Debug, Clone, Serialize)]
pub struct SyncProgress {
    pub pair_id: String,
    pub current_file: String,
    pub done: usize,
    pub total: usize,
}

#[derive(Debug, Default, Serialize)]
pub struct SyncResult {
    pub pair_id: String,
    pub copied: u32,
    pub deleted: u32,
    pub skipped: u32,
    pub errors: Vec<String>,
    pub duration_ms: u64,
}

/// 对单个目录对执行镜像同步：输出目录最终与输入目录内容一致。
pub fn sync_pair(app: &AppHandle, pair: &SyncPair) -> SyncResult {
    let start = std::time::Instant::now();
    let mut result = SyncResult {
        pair_id: pair.id.clone(),
        ..Default::default()
    };

    let source = Path::new(&pair.source);
    let target = Path::new(&pair.target);

    if !source.is_dir() {
        result.errors.push(format!("输入目录不存在: {}", pair.source));
        result.duration_ms = start.elapsed().as_millis() as u64;
        return result;
    }
    if source == target || target.starts_with(source) || source.starts_with(target) {
        result
            .errors
            .push("输入目录与输出目录存在包含关系，已跳过以防误删".to_string());
        result.duration_ms = start.elapsed().as_millis() as u64;
        return result;
    }
    if let Err(e) = fs::create_dir_all(target) {
        result.errors.push(format!("创建输出目录失败: {e}"));
        result.duration_ms = start.elapsed().as_millis() as u64;
        return result;
    }

    // 收集所有源文件的相对路径
    let source_entries: Vec<PathBuf> = WalkDir::new(source)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.path().strip_prefix(source).ok().map(|p| p.to_path_buf()))
        .collect();

    let source_set: HashSet<PathBuf> = source_entries.iter().cloned().collect();
    let total = source_entries.len();

    for (i, rel) in source_entries.iter().enumerate() {
        let src_file = source.join(rel);
        let dst_file = target.join(rel);

        let _ = app.emit(
            "sync-progress",
            SyncProgress {
                pair_id: pair.id.clone(),
                current_file: rel.to_string_lossy().to_string(),
                done: i + 1,
                total,
            },
        );

        if let Some(parent) = dst_file.parent() {
            if let Err(e) = fs::create_dir_all(parent) {
                result
                    .errors
                    .push(format!("创建目录失败 {}: {e}", parent.display()));
                continue;
            }
        }

        match needs_copy(&src_file, &dst_file) {
            Ok(true) => match fs::copy(&src_file, &dst_file) {
                Ok(_) => result.copied += 1,
                Err(e) => result
                    .errors
                    .push(format!("复制失败 {}: {e}", rel.display())),
            },
            Ok(false) => result.skipped += 1,
            Err(e) => result
                .errors
                .push(format!("比较文件失败 {}: {e}", rel.display())),
        }
    }

    // 镜像清理：删除输出目录中源目录没有的文件
    let target_files: Vec<PathBuf> = WalkDir::new(target)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.path().strip_prefix(target).ok().map(|p| p.to_path_buf()))
        .collect();

    for rel in target_files {
        if source_set.contains(&rel) {
            continue;
        }
        let victim = target.join(&rel);
        // 安全校验：确保待删除路径确实位于 target 目录树内
        if !victim.starts_with(target) {
            continue;
        }
        match fs::remove_file(&victim) {
            Ok(_) => result.deleted += 1,
            Err(e) => result
                .errors
                .push(format!("删除失败 {}: {e}", rel.display())),
        }
    }

    // 自底向上清理空目录（不删除 target 根目录本身）
    let mut dirs: Vec<PathBuf> = WalkDir::new(target)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_dir())
        .map(|e| e.path().to_path_buf())
        .filter(|p| p != target)
        .collect();
    dirs.sort_by_key(|p| std::cmp::Reverse(p.components().count()));
    for dir in dirs {
        if fs::read_dir(&dir).map(|mut r| r.next().is_none()).unwrap_or(false) {
            let _ = fs::remove_dir(&dir);
        }
    }

    result.duration_ms = start.elapsed().as_millis() as u64;
    result
}

fn needs_copy(src: &Path, dst: &Path) -> std::io::Result<bool> {
    if !dst.exists() {
        return Ok(true);
    }
    let src_meta = fs::metadata(src)?;
    let dst_meta = fs::metadata(dst)?;
    if src_meta.len() != dst_meta.len() {
        return Ok(true);
    }
    let src_mtime = src_meta.modified()?;
    let dst_mtime = dst_meta.modified()?;
    Ok(src_mtime > dst_mtime)
}
