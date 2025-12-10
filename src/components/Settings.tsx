import { useState, useEffect } from 'react';
import { User, Bell, Shield, Smartphone, HardDrive, Cpu, Activity, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from './GlassCard';

export function Settings() {
    const { user, signOut } = useAuth();
    const [activeNudge, setActiveNudge] = useState<string | null>(null);
    const [systemMetrics, setSystemMetrics] = useState<any>(null);

    useEffect(() => {
        // Poll for active nudge status
        const interval = setInterval(async () => {
            try {
                const res = await fetch('http://127.0.0.1:14200/api/nudge/active');
                const data = await res.json();
                setActiveNudge(data.nudge);

                const metricsRes = await fetch('http://127.0.0.1:14200/metrics');
                const metricsData = await metricsRes.json();
                setSystemMetrics(metricsData.metrics);
            } catch (e) {
                console.error("Failed to fetch settings status", e);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-zinc-400">Manage your account and preferences.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Section */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{user?.name || 'User'}</h2>
                            <p className="text-zinc-400">{user?.email}</p>
                            <span className="inline-block mt-2 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20 font-mono">
                                PRO PLAN
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </GlassCard>

                {/* Smart Nudge Diagnostics */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">System Status</h3>
                            <p className="text-sm text-zinc-400">Backend connectivity & Diagnostics</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-zinc-950/50 rounded-lg border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-zinc-400">Smart Nudge Status</span>
                                <span className={`w-2 h-2 rounded-full ${activeNudge ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_10px_currentColor]`} />
                            </div>
                            <p className="text-sm text-white font-mono">
                                {activeNudge ? `⚠️ Active Intervention: ${activeNudge}` : "✅ Monitoring (Passive)"}
                            </p>
                        </div>

                        {systemMetrics && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-zinc-950/30 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2 mb-1 text-zinc-500 text-xs uppercase font-bold">
                                        <Cpu size={12} /> CPU
                                    </div>
                                    <div className="text-xl font-mono text-white">{systemMetrics.cpu_percent}%</div>
                                </div>
                                <div className="p-3 bg-zinc-950/30 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2 mb-1 text-zinc-500 text-xs uppercase font-bold">
                                        <HardDrive size={12} /> RAM
                                    </div>
                                    <div className="text-xl font-mono text-white">{systemMetrics.memory_percent}%</div>
                                </div>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Preferences */}
                <GlassCard className="p-6 md:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-6">Preferences</h3>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Notifications</p>
                                    <p className="text-sm text-zinc-400">Receive alerts for detailed reports</p>
                                </div>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Privacy Mode</p>
                                    <p className="text-sm text-zinc-400">Blur sensitive titles in screenshots</p>
                                </div>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-700 transition-colors">
                                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
