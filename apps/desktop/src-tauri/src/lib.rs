use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::process::Command;

// Response types for Tauri commands
#[derive(Debug, Serialize)]
struct MediaMetadata {
  duration: f64,
  width: u32,
  height: u32,
}

#[derive(Debug, Serialize)]
struct ThumbnailResult {
  base64: String,
}

#[derive(Debug, Serialize)]
struct VideoAnalysis {
  duration: f64,
  width: u32,
  height: u32,
  bitrate: u32,
}

// Read media metadata using ffprobe
#[tauri::command]
fn read_media_metadata(file_path: String) -> Result<MediaMetadata, String> {
  let output = Command::new("ffprobe")
    .args(&[
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      &file_path
    ])
    .output()
    .map_err(|e| format!("Failed to execute ffprobe: {}", e))?;

  let json: serde_json::Value = String::from_utf8(output.stdout)
    .map_err(|e| format!("Failed to parse ffprobe output: {}", e))
    .and_then(|s| serde_json::from_str(&s).map_err(|e| format!("Invalid JSON: {}", e)))?;

  let format = json.get("format").ok_or("No format data")?;
  let streams = json.get("streams").and_then(|s| s.get(0)).ok_or("No stream data")?;

  Ok(MediaMetadata {
    duration: format.get("duration").and_then(|d| d.as_str()).and_then(|d| d.parse().ok()).unwrap_or(0.0),
    width: streams.get("width").and_then(|w| w.as_u64()).unwrap_or(1920) as u32,
    height: streams.get("height").and_then(|h| h.as_u64()).unwrap_or(1080) as u32,
  })
}

// Generate thumbnail from video
#[tauri::command]
fn generate_thumbnail(file_path: String, timestamp: f64) -> Result<String, String> {
  let output = Command::new("ffmpeg")
    .args(&[
      "-ss", &timestamp.to_string(),
      "-i", &file_path,
      "-vframes", "1",
      "-f", "image2pipe",
      "-vcodec", "png",
      "-"
    ])
    .output()
    .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

  // Convert to base64
  let base64 = base64_encode(&output.stdout);
  Ok(base64)
}

// Export video using FFmpeg
#[tauri::command]
fn export_video(project_data: String, output_path: String) -> Result<String, String> {
  // In a real implementation, this would:
  // 1. Parse project_data for clips and timeline
  // 2. Generate FFmpeg filter_complex for transitions
  // 3. Execute FFmpeg with the correct parameters
  
  let status = Command::new("ffmpeg")
    .args(&["-y", "-i", "concat", &output_path])
    .status()
    .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

  if status.success() {
    Ok(output_path)
  } else {
    Err("Export failed".to_string())
  }
}

// Open file dialog
#[tauri::command]
async fn open_file_dialog() -> Result<Option<String>, String> {
  #[derive(Serialize)]
  struct FileDialogResponse {
    path: String,
  }

  // This would use tauri-plugin-dialog in a real implementation
  Ok(None)
}

fn base64_encode(data: &[u8]) -> String {
  use std::io::Write;
  let mut encoded = String::new();
  let mut encoder = base64::Engine::new(base64::engine::general_purpose::STANDARD);
  encoder.encode_vec(data, &mut encoded).map(|_| encoded).map_err(|_| "Encoding failed".to_string()).unwrap_or_default()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tracing_subscriber::fmt()
    .with_env_filter(
      tracing_subscriber::EnvFilter::from_default_env()
        .add_directive(tracing::Level::INFO.into()),
    )
    .init();

  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
      read_media_metadata,
      generate_thumbnail,
      export_video,
      open_file_dialog
    ])
    .setup(|app| {
      let window = app.get_webview_window("main").unwrap();
      window.set_title("Lumina Studio Desktop").unwrap();
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}