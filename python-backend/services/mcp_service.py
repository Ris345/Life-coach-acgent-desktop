"""
MCP Service - Client for the Machine Control Protocol Server.
Handles communication with the standalone MCP server process.
"""

import subprocess
import json
import os
import sys
import threading
from typing import Dict, Any, Optional
from pathlib import Path

class MCPService:
    def __init__(self):
        self.server_process: Optional[subprocess.Popen] = None
        self.lock = threading.Lock()
        self._request_id = 1
        
        # Path to mcp_server.py
        backend_dir = Path(__file__).parent.parent
        self.server_script = backend_dir / "mcp_server.py"

    def start(self):
        """Start the MCP server subprocess."""
        if self.server_process and self.server_process.poll() is None:
            return  # Already running

        try:
            # Start process with pipes for stdin/stdout
            self.server_process = subprocess.Popen(
                [sys.executable, str(self.server_script)],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=sys.stderr, # Pass stderr through for logging
                text=True,
                bufsize=1 # Line buffered
            )
            print("🚀 MCP Client connected to Server")
        except Exception as e:
            print(f"❌ Failed to start MCP Server: {e}")

    def stop(self):
        """Stop the MCP server."""
        if self.server_process:
            self.server_process.terminate()
            self.server_process = None

    def _send_request(self, method: str, params: Dict[str, Any] = {}) -> Any:
        """Send JSON-RPC request and wait for response."""
        if not self.server_process or self.server_process.poll() is not None:
            self.start()

        with self.lock:
            req_id = self._request_id
            self._request_id += 1
            
            request = {
                "jsonrpc": "2.0",
                "method": method,
                "params": params,
                "id": req_id
            }
            
            try:
                # Write request
                json_req = json.dumps(request)
                self.server_process.stdin.write(json_req + "\n")
                self.server_process.stdin.flush()
                
                # Read response
                response_line = self.server_process.stdout.readline()
                if not response_line:
                    return None
                    
                response = json.loads(response_line)
                
                if "error" in response:
                    raise Exception(response["error"].get("message", "Unknown RPC error"))
                    
                return response.get("result")
                
            except Exception as e:
                 print(f"MCP RPC Error ({method}): {e}")
                 return None

    # ==================== WRAPPER METHODS ====================

    def send_notification(self, title: str, message: str) -> bool:
        return self._send_request("send_notification", {"title": title, "message": message})

    def close_chrome_tab(self, url_part: str) -> bool:
        return self._send_request("close_chrome_tab", {"url_part": url_part})

    def open_url(self, url: str) -> bool:
        return self._send_request("open_url", {"url": url})

# Global singleton
_mcp_service: Optional[MCPService] = None

def get_mcp_service() -> MCPService:
    global _mcp_service
    if _mcp_service is None:
        _mcp_service = MCPService()
    return _mcp_service
