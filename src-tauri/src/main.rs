// Prevents additional console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use std::path::PathBuf;
use std::sync::Arc;
use std::io::{BufRead, BufReader};
use tauri::Manager;

// State to hold the Python process handle
struct PythonProcess {
    child: Option<std::process::Child>,
}

impl PythonProcess {
    fn new() -> Self {
        Self { child: None }
    }

    fn start(&mut self, python_path: String, backend_path: PathBuf) -> Result<(), String> {
        // Kill existing process if any
        self.kill();

        println!("Starting Python backend at: {:?}", backend_path);
        println!("Using Python: {}", python_path);

        // Spawn the Python process
        let mut child = Command::new(&python_path)
            .arg(backend_path.to_str().ok_or("Invalid backend path")?)
            .current_dir(backend_path.parent().ok_or("Invalid backend directory")?)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn Python process: {}", e))?;

        println!("Python backend process started with PID: {:?}", child.id());

        // Spawn threads to read stdout and stderr for debugging
        if let Some(stdout) = child.stdout.take() {
            let reader = BufReader::new(stdout);
            std::thread::spawn(move || {
                for line in reader.lines() {
                    if let Ok(line) = line {
                        println!("[Python stdout] {}", line);
                    }
                }
            });
        }

        if let Some(stderr) = child.stderr.take() {
            let reader = BufReader::new(stderr);
            std::thread::spawn(move || {
                for line in reader.lines() {
                    if let Ok(line) = line {
                        eprintln!("[Python stderr] {}", line);
                    }
                }
            });
        }

        self.child = Some(child);
        Ok(())
    }

    fn kill(&mut self) {
        if let Some(mut child) = self.child.take() {
            println!("Killing Python backend process...");
            let _ = child.kill();
            let _ = child.wait();
            println!("Python backend process terminated");
        }
    }
}

impl Drop for PythonProcess {
    fn drop(&mut self) {
        self.kill();
    }
}

// Tauri command to open URL in external browser
#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    // Use system command to open URL in default browser
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", "", &url])
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    
    Ok(())
}

// Tauri command to get system stats (Active Window)
#[tauri::command]
fn get_system_stats() -> Result<String, String> {
    match active_win_pos_rs::get_active_window() {
        Ok(window) => {
            // Return JSON string with app name and title
            // We sanitize quotes to prevent JSON breakage (basic)
            let app_name = window.app_name.replace("\"", "\\\"");
            let title = window.title.replace("\"", "\\\"");
            Ok(format!(r#"{{"app_name": "{}", "title": "{}"}}"#, app_name, title))
        },
        Err(_) => {
            // If we can't get the window, return Unknown
            Ok(r#"{"app_name": "Unknown", "title": ""}"#.to_string())
        }
    }
}

// Tauri command to check backend health
#[tauri::command]
async fn check_backend_health() -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client
        .get("http://127.0.0.1:14200/health")
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
        .map_err(|e| format!("Backend not responding: {}", e))?;

    let status = response.status();
    if status.is_success() {
        let body = response.text().await.map_err(|e| format!("Failed to read response: {}", e))?;
        Ok(body)
    } else {
        Err(format!("Backend returned error status: {}", status))
    }
}

fn find_python_executable() -> Result<String, String> {
    // 1. Check for local venv first (development/production bundle)
    let mut venv_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    venv_path.push("..");
    venv_path.push("python-backend");
    venv_path.push("venv");
    
    #[cfg(target_os = "windows")]
    venv_path.push("Scripts");
    #[cfg(not(target_os = "windows"))]
    venv_path.push("bin");
    
    #[cfg(target_os = "windows")]
    venv_path.push("python.exe");
    #[cfg(not(target_os = "windows"))]
    venv_path.push("python3");

    if venv_path.exists() {
        return Ok(venv_path.to_string_lossy().to_string());
    }

    // 2. Fallback to system python
    let candidates = ["python3", "python", "py"];
    
    for cmd in &candidates {
        if Command::new(cmd)
            .arg("--version")
            .output()
            .is_ok()
        {
            return Ok(cmd.to_string());
        }
    }
    
    Err("Python executable not found. Please ensure Python 3.10+ is installed.".to_string())
}

mod tray;
mod os_integration;

fn main() {
    // Find Python executable
    let python_exe = find_python_executable().expect("Python not found");
    println!("Found Python executable: {}", python_exe);

    // Get the backend path
    let mut backend_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    backend_path.push("..");
    backend_path.push("python-backend");
    backend_path.push("main.py");

    // Verify the backend file exists
    if !backend_path.exists() {
        eprintln!("ERROR: Python backend not found at: {:?}", backend_path);
        eprintln!("Please ensure python-backend/main.py exists");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_notification::init())
        .setup(move |app| {
            // Initialize System Tray
            tray::create_tray(app.handle())?;

            // Debug: Log window creation
            println!("Tauri app setup - creating window");
            
            // Get the main window and verify it's loading correctly
            if let Some(window) = app.get_webview_window("main") {
                println!("✅ Main window found");
                
                // Show window
                let _ = window.show();
                
                // Log window URL after a brief delay
                std::thread::spawn({
                    let window = window.clone();
                    move || {
                        std::thread::sleep(std::time::Duration::from_millis(1000));
                        let check_url_script = r#"
                            console.log('Window URL:', window.location.href);
                        "#;
                        let _ = window.eval(check_url_script);
                    }
                });
            } else {
                println!("⚠️ Warning: Main window not found during setup");
            }
            
            // Create Python process state
            let mut python_process = PythonProcess::new();
            
            // Start the Python backend
            if let Err(e) = python_process.start(python_exe.clone(), backend_path.clone()) {
                eprintln!("Failed to start Python backend: {}", e);
            } else {
                println!("Python backend started successfully");
            }

            // Store the process in app state
            app.manage(Arc::new(std::sync::Mutex::new(python_process)));

            // Start Tracking Loop
            std::thread::spawn(|| {
                // Wait for Python to start
                std::thread::sleep(std::time::Duration::from_secs(5));
                
                loop {
                    if let Ok(window) = active_win_pos_rs::get_active_window() {
                        // Get URL if browser
                        let url = os_integration::get_browser_url(&window.app_name);

                        let payload = serde_json::json!({
                            "app_name": window.app_name,
                            "window_title": window.title,
                            "url": url 
                        });
                        
                        // Debug log
                        println!("Pushing activity: App={}, URL={:?}", window.app_name, url);

                        // Use curl as fallback since reqwest is timing out
                        let json_str = serde_json::to_string(&payload).unwrap_or_default();
                        
                        let _ = std::process::Command::new("curl")
                            .args(&[
                                "-X", "POST",
                                "-H", "Content-Type: application/json",
                                "-d", &json_str,
                                "http://127.0.0.1:14200/api/activity/update",
                                "--max-time", "1"
                            ])
                            .output(); // Ignore output, fire and forget
                    }
                    std::thread::sleep(std::time::Duration::from_secs(1));
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Hide window instead of closing
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![check_backend_health, open_url, get_system_stats])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

