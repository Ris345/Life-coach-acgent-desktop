import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Zap, Shield, Activity, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NudgeEvent {
    id: number;
    timestamp: string;
    nudge_level: number;
    distractor_url: string;
    action: string;
}

export function AgentAnalytics() {
    const { user } = useAuth();
    const [events, setEvents] = useState<NudgeEvent[]>([]);
    const [stats, setStats] = useState({
        total_interventions: 0,
        saved_time_minutes: 0,
        focus_score: 85
    });

    // Mock data for now - in real implementation, fetch from backend
    useEffect(() => {
        // Simulate fetching data
        setEvents([
            { id: 1, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), nudge_level: 1, distractor_url: 'twitter.com', action: 'notify' },
            { id: 2, timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), nudge_level: 2, distractor_url: 'youtube.com', action: 'warn' },
            { id: 3, timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), nudge_level: 3, distractor_url: 'reddit.com', action: 'intervene' },
        ]);

        setStats({
            total_interventions: 12,
            saved_time_minutes: 45,
            focus_score: 92
        });
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Agent Command Center</h1>
                <p className="text-zinc-400">Monitor your AI assistant's background activity and interventions.</p>
            </header>

            {/* Key Stats */}
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
                        <div className="text-2xl font-bold text-white">{stats.saved_time_minutes}m</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider">Time Saved</div>
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

            {/* Activity Log */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Zap size={18} className="text-yellow-400" />
                    Agent Activity Log
                </h3>

                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                    {events.map((event, index) => (
                        <div key={event.id} className="relative flex gap-4">
                            <div className={`
                                relative z-10 w-10 h-10 rounded-full border-4 border-black flex items-center justify-center shrink-0
                                ${event.nudge_level === 3 ? 'bg-red-500/20 text-red-400' :
                                    event.nudge_level === 2 ? 'bg-orange-500/20 text-orange-400' :
                                        'bg-blue-500/20 text-blue-400'}
                            `}>
                                {event.nudge_level === 3 ? <AlertTriangle size={16} /> :
                                    event.nudge_level === 2 ? <Shield size={16} /> :
                                        <CheckCircle2 size={16} />}
                            </div>

                            <div className="flex-1 pt-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium ${event.nudge_level === 3 ? 'text-red-400' :
                                            event.nudge_level === 2 ? 'text-orange-400' :
                                                'text-blue-400'
                                        }`}>
                                        {event.nudge_level === 3 ? 'AI Intervention' :
                                            event.nudge_level === 2 ? 'Firm Warning' :
                                                'Gentle Nudge'}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-zinc-300 text-sm">
                                    {event.nudge_level === 3
                                        ? `Closed ${event.distractor_url} and redirected to productive work.`
                                        : `Detected distraction on ${event.distractor_url}.`}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
