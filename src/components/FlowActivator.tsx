import { useState, useEffect } from 'react';
import { Play, Square, Zap, CheckCircle, Shield, Clock, TrendingUp } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface FlowActivatorProps {
    currentGoal: string;
    onStateChange?: (isActive: boolean) => void;
}

export function FlowActivator({ currentGoal, onStateChange }: FlowActivatorProps) {
    const [status, setStatus] = useState<'ready' | 'activating' | 'active'>('ready');
    const [duration, setDuration] = useState(0);
    const [xpGained, setXpGained] = useState(0);
    const [actions, setActions] = useState<string[]>([]);

    // Timer for active flow
    useEffect(() => {
        let interval: any;
        if (status === 'active') {
            interval = setInterval(() => {
                setDuration(d => {
                    const newDuration = d + 1;
                    setXpGained(newDuration * 10); // 10 XP per minute
                    return newDuration;
                });
            }, 60000); // Update every minute
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleEngage = async () => {
        setStatus('activating');
        setActions([]);

        try {
            const res = await fetch('http://127.0.0.1:14200/api/flow/enter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal: currentGoal })
            });

            const data = await res.json();

            if (data.actions) {
                setActions(data.actions);
            }

            // Simulate animation delay for effect
            setTimeout(() => {
                setStatus('active');
                if (onStateChange) onStateChange(true);
            }, 1500);

        } catch (e) {
            console.error("Failed to engage flow:", e);
            setStatus('ready');
        }
    };

    const handleExit = async () => {
        try {
            await fetch('http://127.0.0.1:14200/api/flow/exit', { method: 'POST' });
            setStatus('ready');
            setDuration(0);
            setXpGained(0);
            if (onStateChange) onStateChange(false);
        } catch (e) {
            console.error("Failed to exit flow:", e);
        }
    };

    if (status === 'active') {
        return (
            <GlassCard className="relative overflow-hidden border-emerald-500/30 bg-emerald-900/10">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 animate-pulse" />

                <div className="relative z-10 flex items-center justify-between p-2">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400 animate-pulse">
                            <Shield size={24} />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                Flow State Active
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                    +10 XP/min
                                </span>
                            </h3>

                            <div className="flex items-center gap-4 text-sm font-mono">
                                <div className="flex items-center gap-1.5 text-zinc-400">
                                    <Clock size={14} />
                                    <span>{duration}m</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-purple-400">
                                    <TrendingUp size={14} />
                                    <span>+{xpGained} XP Gained</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleExit}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                    >
                        <Square size={16} fill="currentColor" />
                        <span className="font-bold text-sm">End Session</span>
                    </button>
                </div>

                {/* Active Guard Indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500/60 uppercase tracking-wider font-bold">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    AI Guard Active: Blocking Distractions
                </div>
            </GlassCard>
        );
    }

    if (status === 'activating') {
        return (
            <GlassCard className="border-blue-500/30">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                        <Zap size={48} className="text-blue-400 animate-bounce" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Optimizing Environment...</h3>
                    <div className="space-y-1 text-center">
                        {actions.map((action, i) => (
                            <div key={i} className="text-sm text-zinc-400 animate-fade-in flex items-center gap-2 justify-center">
                                <CheckCircle size={12} className="text-emerald-500" />
                                {action}
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="group hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Zap size={20} className="text-yellow-400" />
                        <h3 className="text-lg font-bold text-white">Ready to Flow?</h3>
                    </div>
                    <p className="text-sm text-zinc-400 max-w-md">
                        I'll clear distractions, open your tools, and guard your focus.
                    </p>
                </div>

                <button
                    onClick={handleEngage}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105 active:scale-95"
                >
                    <Play size={18} fill="currentColor" />
                    <span>Initiate Flow</span>
                </button>
            </div>
        </GlassCard>
    );
}
