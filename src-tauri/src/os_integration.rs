use std::process::Command;

pub fn get_browser_url(app_name: &str) -> Option<String> {
    let browser_script_name = if app_name.contains("Chrome") {
        "Google Chrome"
    } else if app_name.contains("Arc") {
        "Arc"
    } else if app_name.contains("Brave") {
        "Brave Browser"
    } else if app_name.contains("Safari") {
        "Safari"
    } else {
        return None;
    };

    let script = format!(
        r#"
        tell application "{}"
            if (count of windows) > 0 then
                get URL of active tab of front window
            else
                return ""
            end if
        end tell
        "#,
        browser_script_name
    );

    let output = Command::new("osascript")
        .args(&["-e", &script])
        .output()
        .ok()?;

    if output.status.success() {
        let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !url.is_empty() {
            return Some(url);
        }
    }

    None
}
