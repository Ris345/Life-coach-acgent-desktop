import platform
import subprocess
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Service for sending native system notifications.
    Currently supports macOS via AppleScript.
    """
    
    def __init__(self):
        self.platform = platform.system()

    def send_notification(self, title: str, message: str, sound: str = "default"):
        """
        Send a native notification.
        
        Args:
            title: Notification title
            message: Notification body
            sound: Sound name (default, ping, glass, etc.)
        """
        if self.platform == "Darwin":
            self._send_macos_notification(title, message, sound)
        else:
            logger.warning(f"Notifications not supported on {self.platform}")

    def _send_macos_notification(self, title: str, message: str, sound: str):
        """Send macOS notification using osascript."""
        try:
            # Escape quotes to prevent script errors
            safe_title = title.replace('"', '\\"')
            safe_message = message.replace('"', '\\"')
            
            script = f'display notification "{safe_message}" with title "{safe_title}" sound name "{sound}"'
            
            subprocess.run(
                ['osascript', '-e', script],
                capture_output=True,
                text=True,
                timeout=5
            )
        except Exception as e:
            logger.error(f"Failed to send macOS notification: {e}")

_notification_service = NotificationService()

def get_notification_service():
    return _notification_service
