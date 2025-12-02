import { useState, useEffect } from 'react';
import { Zap, AlertCircle, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function Overlay() {
    const [isVisible, setIsVisible] = useState(true);
    const [focusScore, setFocusScore] = useState(85);
    const [nudge, setNudge] = useState<string | null>(null);

    const [isConnected, setIsConnected] = useState(false);



    // Poll for active nudges
    useEffect(() => {
        const checkNudge = async () => {
            try {
                const res = await fetch('http://127.0.0.1:14200/api/nudge/active');
                if (res.ok) {
                    setIsConnected(true);
                    const data = await res.json();

                    if (data.nudge && data.nudge.nudge_needed) {
                        setNudge(data.nudge.message);
                    } else {
                        setNudge(null);
                    }
                } else {
                    setIsConnected(false);
                }
            } catch (e) {
                console.error("Failed to check nudge", e);
                setIsConnected(false);
            }
        };

        const interval = setInterval(checkNudge, 1000);
        return () => clearInterval(interval);
    }, []);

    // Close the overlay window
    const handleClose = async () => {
        try {
            const win = getCurrentWindow();
            await win.hide();
        } catch (e) {
            console.error("Failed to hide window", e);
        }
    };

    return (
        <div className={`h-screen w-screen flex items-center justify-center bg-transparent transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} data-tauri-drag-region>
            <div className="relative group">
                {/* Main Pill */}
                <div className="flex items-center gap-3 px-4 py-2 bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:border-white/20">
                    {/* Focus Indicator */}
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${focusScore > 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            <Zap size={14} fill="currentColor" />
                        </div>
                        <span className="text-sm font-bold text-white font-mono">{focusScore}%</span>
                    </div>



                    <div className="w-px h-4 bg-white/10" />

                    {/* Current Context / Nudge */}
                    <div className="text-xs font-medium text-zinc-300 max-w-[200px] truncate">
                        {nudge ? (
                            <span className="text-amber-400 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {nudge}
                            </span>
                        ) : (
                            "Deep Focus Mode"
                        )}
                    </div>

                    {/* Close Button (Visible on Hover) */}
                    <button
                        onClick={handleClose}
                        className="ml-2 p-1 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}
