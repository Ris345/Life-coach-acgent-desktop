import { useState, useEffect } from 'react';
import { Settings, CheckCircle, ArrowRight } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { GlassCard } from './GlassCard';

interface PermissionRequestProps {
    onComplete: () => void;
}

export function PermissionRequest({ onComplete }: PermissionRequestProps) {
    const [status, setStatus] = useState<'checking' | 'granted' | 'denied'>('checking');
    const [isPolling, setIsPolling] = useState(true);

    const checkPermission = async () => {
        try {
            // In a real Tauri app, this would call a Rust command
            // For now, we'll simulate or use the backend endpoint if available
            // Using the backend endpoint we added to DataCollector
            const res = await fetch('http://127.0.0.1:14200/activity');
            const data = await res.json();

            // If we get a valid active window that isn't "Unknown" (and not just because it's empty),
            // we can assume we have permissions. 
            // Ideally, the backend should return a specific permission flag.
            // Let's assume the backend 'activity' endpoint returns "Unknown" if no permission.

            if (data.active_window && data.active_window !== "Unknown") {
                setStatus('granted');
                setIsPolling(false);
                setTimeout(onComplete, 1500); // Auto advance after success
            } else {
                setStatus('denied');
            }
        } catch (e) {
            console.error("Permission check failed", e);
            setStatus('denied');
        }
    };

    useEffect(() => {
        if (!isPolling) return;

        const interval = setInterval(checkPermission, 2000);
        checkPermission();

        return () => clearInterval(interval);
    }, [isPolling]);

    const openSystemSettings = async () => {
        try {
            // macOS Accessibility Settings URL
            await invoke('open_url', {
                url: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
            });
        } catch (e) {
            console.error("Failed to open settings:", e);
            alert("Please open System Settings -> Privacy & Security -> Accessibility manually.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <GlassCard className="max-w-md w-full p-8 text-center animate-fade-in-up">
                <div className="flex justify-center mb-6">
                    <div className={`p-4 rounded-full ${status === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {status === 'granted' ? (
                            <CheckCircle className="w-12 h-12" />
                        ) : (
                            <Settings className="w-12 h-12 animate-spin-slow" />
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">
                    {status === 'granted' ? "Permission Granted!" : "Enable Accessibility"}
                </h2>

                <p className="text-zinc-400 mb-8">
                    {status === 'granted'
                        ? "Great! LifeOS can now see your active apps to help you stay focused."
                        : "To function as a life coach, LifeOS needs to know which app you're using. Please enable Accessibility permissions."
                    }
                </p>

                {status !== 'granted' && (
                    <div className="space-y-4">
                        <button
                            onClick={openSystemSettings}
                            className="w-full px-4 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                        >
                            Open System Settings <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="text-xs text-zinc-500 bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                            <p>System Settings &gt; Privacy & Security &gt; Accessibility</p>
                        </div>
                    </div>
                )}

                {status === 'granted' && (
                    <button
                        onClick={onComplete}
                        className="w-full px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors"
                    >
                        Continue
                    </button>
                )}
            </GlassCard>
        </div>
    );
}
