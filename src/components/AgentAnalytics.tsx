

import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Zap, Shield, Activity, Clock, AlertTriangle, CheckCircle2, ChevronRight, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AppMetric {
    name: string;
    launches: number;
    total_time: number;
    average_session: number;
}

interface ChromeTab {
    url: string;
    title: string;
    total_time: number;
    visits: number;
}

interface NudgeEvent {
    id: number;
    timestamp: string;
    nudge_level: number;
    distractor_url: string;
    action: string;
}

export function AgentAnalytics() {
    const { user } = useAuth();
    const [apps, setApps] = useState<AppMetric[]>([]);
    const [events, setEvents] = useState<NudgeEvent[]>([]); // Still mock/placeholder for now if no endpoint
    const [stats, setStats] = useState({
        total_interventions: 0,
        saved_time_minutes: 0,
        focus_score: 85
    });

    // Drill-down state
    const [selectedApp, setSelectedApp] = useState<string | null>(null);
    const [chromeTabs, setChromeTabs] = useState<ChromeTab[]>([]);
    const [isLoadingTabs, setIsLoadingTabs] = useState(false);

    useEffect(() => {
        fetchMetrics();
        // Poll every 5 seconds
        const interval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchMetrics = async () => {
        try {
            const res = await fetch('http://127.0.0.1:14200/api/metrics/applications');
            const data = await res.json();
            if (data.metrics) {
                setApps(data.metrics);
            }
            // If backend provides stats, update them here
            // setStats(data.stats);
        } catch (e) {
            console.error("Failed to fetch metrics", e);
        }
    };

    const handleAppClick = async (appName: string) => {
        if (appName === "Google Chrome") {
            setSelectedApp(appName);
            setIsLoadingTabs(true);
            try {
                const res = await fetch('http://127.0.0.1:14200/api/chrome/tabs');
                const data = await res.json();
                if (data.tabs) {
                    setChromeTabs(data.tabs);
                }
            } catch (e) {
                console.error("Failed to fetch tabs", e);
            } finally {
                setIsLoadingTabs(false);
            }
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hours}h ${remainingMins}m`;
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
                <p className="text-zinc-400">Deep dive into your productivity patterns.</p>
            </header>

            {/* Key Stats (Placeholder/Mock for now) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-500/20 text-purple-400">
                        <Shield size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{stats.total_interventions}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider">Distractions Blocked</div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{formatTime(apps.reduce((acc, app) => acc + app.total_time, 0))}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider">Total Screen Time</div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-500/20 text-green-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{stats.focus_score}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider">Focus Score</div>
                    </div>
                </GlassCard>
            </div>

            {/* Application Usage List */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-6">Application Usage</h3>
                <div className="space-y-2">
                    {apps.map((app) => (
                        <div
                            key={app.name}
                            onClick={() => handleAppClick(app.name)}
                            className={`flex items-center justify-between p-3 rounded-lg border border-white/5 transition-colors ${app.name === 'Google Chrome'
                                ? 'bg-zinc-800/50 hover:bg-zinc-800 cursor-pointer group'
                                : 'bg-zinc-900/30'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                                    {app.name[0]}
                                </div>
                                <div>
                                    <div className="font-medium text-white flex items-center gap-2">
                                        {app.name}
                                        {app.name === 'Google Chrome' && <ChevronRight size={14} className="text-zinc-500 group-hover:text-white transition-colors" />}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {app.launches} launches
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-white">{formatTime(app.total_time)}</div>
                                <div className="text-xs text-zinc-500">Avg: {formatTime(app.average_session)}</div>
                            </div>
                        </div>
                    ))}
                    {apps.length === 0 && (
                        <div className="text-center py-8 text-zinc-500">
                            No activity recorded yet.
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Modal for Chrome Tabs */}
            {selectedApp === 'Google Chrome' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <GlassCard className="w-full max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden shadow-2xl border-zinc-700">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                Google Chrome - Active Tabs
                            </h3>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/80">
                            {isLoadingTabs ? (
                                <div className="text-center py-8 text-zinc-400">Loading tabs...</div>
                            ) : (
                                <div className="space-y-2">
                                    {chromeTabs.map((tab, idx) => (
                                        <div key={idx} className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg flex items-start justify-between gap-4 group hover:bg-zinc-900 transition-colors">
                                            <div className="min-w-0">
                                                <div className="font-medium text-white truncate break-all pr-4">
                                                    {tab.title || "Untitled"}
                                                </div>
                                                <div className="text-xs text-zinc-500 truncate font-mono">
                                                    {tab.url}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <div className="font-mono text-emerald-400 text-sm">{formatTime(tab.total_time)}</div>
                                                <a
                                                    href={tab.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Open <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                    {chromeTabs.length === 0 && (
                                        <div className="text-center py-12 text-zinc-500">
                                            No tracking data for tabs found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
