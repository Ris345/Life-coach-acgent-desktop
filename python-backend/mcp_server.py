"""
MCP Server - Machine Control Protocol
Provides a JSON-RPC interface for controlling the desktop environment.
Can be used by agents to perform actions like closing apps or sending notifications.
"""

import sys
import json
import subprocess
import platform
import logging
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]  # Log to stderr so stdout is clean for RPC
)
logger = logging.getLogger("MCPServer")

class MCPServer:
    def __init__(self):
        self.tools = {
            "send_notification": self.send_notification,
            "close_chrome_tab": self.close_chrome_tab,
            "open_url": self.open_url,
            "eval_applescript": self.eval_applescript
        }

    def run(self):
        """
        Main loop to read JSON-RPC requests from stdin and write to stdout.
        """
        logger.info("MCP Server started")
        
        for line in sys.stdin:
            try:
                line = line.strip()
                if not line:
                    continue
                    
                request = json.loads(line)
                response = self.handle_request(request)
                
                # Send response back
                print(json.dumps(response))
                sys.stdout.flush()
                
            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
            except Exception as e:
                logger.error(f"Error processing request: {e}")

    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a single JSON-RPC request."""
        # Check if it's a tool call (MCP format can vary, implementing simple RPC here)
        # Expected format: {"method": "tool_name", "params": {...}, "id": 1}
        
        method = request.get("method")
        params = request.get("params", {})
        req_id = request.get("id")
        
        if method not in self.tools:
            return {
                "jsonrpc": "2.0",
                "error": {"code": -32601, "message": "Method not found"},
                "id": req_id
            }
            
        try:
            result = self.tools[method](**params)
            return {
                "jsonrpc": "2.0",
                "result": result,
                "id": req_id
            }
        except Exception as e:
            logger.error(f"Tool execution error: {e}")
            return {
                "jsonrpc": "2.0",
                "error": {"code": -32000, "message": str(e)},
                "id": req_id
            }

    # ==================== TOOLS ====================

    def send_notification(self, title: str, message: str) -> bool:
        """Send a native OS notification."""
        logger.info(f"Sending notification: {title} - {message}")
        if platform.system() == "Darwin":
            script = f'display notification "{message}" with title "{title}" sound name "default"'
            return self._run_applescript(script)
        return False

    def close_chrome_tab(self, url_part: str) -> bool:
        """Close any Chrome tab containing the URL fragment."""
        logger.info(f"Closing Chrome tab with URL: {url_part}")
        if platform.system() == "Darwin":
            script = f'''
            tell application "Google Chrome"
                set windowList to every window
                repeat with w in windowList
                    set tabList to every tab of w
                    repeat with t in tabList
                        if URL of t contains "{url_part}" then
                            close t
                            return true
                        end if
                    end repeat
                end repeat
            end tell
            return false
            '''
            # parse string result from applescript 'true'/'false'
            return self._run_applescript(script)
        return False

    def open_url(self, url: str) -> bool:
        """Open a URL in the default browser."""
        logger.info(f"Opening URL: {url}")
        if platform.system() == "Darwin":
            subprocess.run(["open", url])
            return True
        return False
        
    def eval_applescript(self, script: str) -> str:
        """Evaluate raw AppleScript (Use with caution)."""
        if platform.system() == "Darwin":
            result = subprocess.run(
                ['osascript', '-e', script],
                capture_output=True,
                text=True
            )
            return result.stdout.strip()
        return "Not supported on this OS"

    def _run_applescript(self, script: str) -> bool:
        """Helper to run simple AppleScript boolean commands."""
        try:
            result = subprocess.run(
                ['osascript', '-e', script],
                capture_output=True,
                text=True,
                timeout=5
            )
            # If command simply runs without error, we consider it success unless it returns 'false'
            output = result.stdout.strip()
            return result.returncode == 0 and output != "false"
        except Exception as e:
            logger.error(f"AppleScript error: {e}")
            return False

if __name__ == "__main__":
    server = MCPServer()
    server.run()
