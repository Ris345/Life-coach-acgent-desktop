import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { sendNotification } from '@tauri-apps/plugin-notification';

export function DebugPanel() {
    const [systemStats, setSystemStats] = useState<any>(null);
    const [error, setError] = useState<string>('');

    const checkSystemStats = async () => {
        try {
            const stats = await invoke('get_system_stats');
            setSystemStats(JSON.parse(stats as string));
            setError('');
        } catch (err) {
            setError(String(err));
        }
    };

    const testNotification = async () => {
        try {
            await sendNotification({
                title: 'LifeOS Test',
                body: 'This is a native notification from Tauri!',
            });
        } catch (err) {
            setError('Notification failed: ' + String(err));
        }
    };

    useEffect(() => {
        const interval = setInterval(checkSystemStats, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg mb-8">
            <h3 className="text-sm font-bold text-zinc-400 mb-4">🛠️ SYSTEM DEBUG</h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Window Detection */}
                <div className="p-3 bg-black/20 rounded border border-white/5">
                    <div className="text-xs text-zinc-500 mb-1">ACTIVE WINDOW</div>
                    <div className="font-mono text-emerald-400">
                        {systemStats ? systemStats.app_name : 'Loading...'}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                        {systemStats ? systemStats.title : '...'}
                    </div>
                </div>

                {/* Notification Test */}
                <div className="p-3 bg-black/20 rounded border border-white/5 flex flex-col justify-center">
                    <button
                        onClick={testNotification}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors"
                    >
                        TEST NOTIFICATION
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded">
                    {error}
                </div>
            )}
        </div>
    );
}
