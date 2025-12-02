import { useEffect, useState, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { Terminal, Zap, Bell, Shield, Radio } from 'lucide-react';

interface LogEvent {
    id: string;
    type: 'system' | 'focus' | 'nudge' | 'app';
    message: string;
    timestamp: Date;
}

export function LiveFeed() {
    const [logs, setLogs] = useState<LogEvent[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('http://127.0.0.1:14200/api/activity/logs');
                const data = await res.json();
                if (data.logs) {
                    setLogs(data.logs.map((log: any) => ({
                        ...log,
                        timestamp: new Date(log.timestamp)
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch logs:", error);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 1000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'system': return <Terminal size={12} className="text-zinc-500" />;
            case 'focus': return <Zap size={12} className="text-yellow-500" />;
            case 'nudge': return <Bell size={12} className="text-red-500" />;
            case 'app': return <Radio size={12} className="text-blue-500" />;
            default: return <Terminal size={12} />;
        }
    };

    return (
        <GlassCard className="h-[1000px] flex flex-col overflow-hidden" variant="subtle">
            <div className="flex items-center justify-between p-4 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <Shield size={14} className="text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Live Feed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">ONLINE</span>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-1 p-2 custom-scrollbar font-mono text-xs"
            >
                {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors animate-fade-in">
                        <span className="mt-0.5 opacity-70 shrink-0">{getIcon(log.type)}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-zinc-300 truncate">{log.message}</div>
                            <div className="text-zinc-600 text-[10px]">{log.timestamp.toLocaleTimeString()}</div>
                        </div>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
}
