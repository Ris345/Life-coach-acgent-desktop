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
    // Try common Python executable names
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
        .setup(move |app| {
            // Debug: Log window creation
            println!("Tauri app setup - creating window");
            
            // Get the main window and verify it's loading correctly
            if let Some(window) = app.get_webview_window("main") {
                println!("✅ Main window found");
                println!("Window URL should be: http://127.0.0.1:3000");
                
                // Show window
                let _ = window.show();
                
                // Log window URL after a brief delay
                std::thread::spawn({
                    let window = window.clone();
                    move || {
                        std::thread::sleep(std::time::Duration::from_millis(1000));
                        let check_url_script = r#"
                            console.log('Window URL:', window.location.href);
                            console.log('Document ready:', document.readyState);
                            console.log('Root element:', !!document.getElementById('root'));
                        "#;
                        let _ = window.eval(check_url_script);
                    }
                });
                
                // Monitor content loading - JavaScript side handles reload logic
                std::thread::spawn({
                    let window = window.clone();
                    move || {
                        // Wait for initial page load
                        std::thread::sleep(std::time::Duration::from_millis(4000));
                        
                        // Check if React content loaded and log status
                        // The JavaScript in index.html handles the actual reload logic
                        let check_script = r#"
                            (function() {
                                console.log('=== Tauri Window Content Check ===');
                                const root = document.getElementById('root');
                                if (!root) {
                                    console.error('❌ Root element not found!');
                                    return;
                                }
                                
                                const hasReactContent = root.children.length > 0 && 
                                    !root.children[0].classList.contains('loading');
                                
                                if (!hasReactContent && document.readyState === 'complete') {
                                    console.warn('⚠️ No React content after 4 seconds');
                                    console.log('JavaScript will handle reload if needed');
                                } else if (hasReactContent) {
                                    console.log('✅ React content loaded');
                                } else {
                                    console.log('⏳ Still loading...');
                                }
                            })();
                        "#;
                        
                        // Execute the check script (eval returns Result<()>)
                        if let Err(e) = window.eval(check_script) {
                            println!("⚠️ Error executing content check: {:?}", e);
                        } else {
                            println!("✅ Content check script executed");
                        }
                    }
                });
            } else {
                println!("⚠️ Warning: Main window not found during setup");
                // List all windows for debugging
                for window in app.webview_windows().values() {
                    println!("Found window: {}", window.label());
                }
            }
            
            // Create Python process state
            let mut python_process = PythonProcess::new();
            
            // Start the Python backend
            if let Err(e) = python_process.start(python_exe.clone(), backend_path.clone()) {
                eprintln!("Failed to start Python backend: {}", e);
                // Continue anyway - the app can still run, backend might be started manually
            } else {
                println!("Python backend started successfully");
            }

            // Store the process in app state
            app.manage(Arc::new(std::sync::Mutex::new(python_process)));

            Ok(())
        })
        .on_window_event(|window, event| {
            // Kill Python process when the window is closed
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Some(process_state) = window.try_state::<Arc<std::sync::Mutex<PythonProcess>>>() {
                    if let Ok(mut process) = process_state.lock() {
                        process.kill();
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![check_backend_health, open_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

