import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Target, Calendar, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Goal {
    id: number;
    goal_text: string;
    timeframe: string;
    created_at: string;
    is_active: boolean;
    strategy?: string;
}

export function GoalLibrary() {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        fetchGoals();
    }, [user?.id]);

    const fetchGoals = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:14200/api/goals/history?user_id=${user?.id}`);
            const data = await res.json();
            if (data.goals) {
                setGoals(data.goals);
            }
        } catch (error) {
            console.error("Failed to fetch goals:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchGoal = async (goalId: number) => {
        if (!user?.id) return;
        try {
            const res = await fetch('http://127.0.0.1:14200/api/goals/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    goal_id: goalId
                })
            });

            if (res.ok) {
                // Refresh goals to update active status
                fetchGoals();
                // Optionally trigger a global refresh or notification
            }
        } catch (error) {
            console.error("Failed to switch goal:", error);
        }
    };

    if (isLoading) {
        return <div className="text-zinc-400">Loading goals...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Goal Library</h1>
                <p className="text-zinc-400">Manage your active objectives and view history.</p>
            </header>

            <div className="grid gap-4">
                {goals.map((goal) => (
                    <GlassCard
                        key={goal.id}
                        className={`p-6 transition-all duration-300 ${goal.is_active ? 'border-purple-500/30 bg-purple-500/5' : 'hover:bg-white/5'}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-lg ${goal.is_active ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                        <Target size={20} />
                                    </div>
                                    {goal.is_active && (
                                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/20">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <h3 className={`text-lg font-medium mb-2 ${goal.is_active ? 'text-white' : 'text-zinc-300'}`}>
                                    {goal.goal_text}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-zinc-500">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        <span>{new Date(goal.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        <span className="capitalize">{goal.timeframe}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {!goal.is_active && (
                                    <button
                                        onClick={() => handleSwitchGoal(goal.id)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-medium text-zinc-300 transition-colors group"
                                    >
                                        <span>Resume</span>
                                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}
                                {goal.is_active && (
                                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-400">
                                        <CheckCircle2 size={16} />
                                        <span>In Progress</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </GlassCard>
                ))}

                {goals.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                        No goals found. Start by creating one in the Dashboard.
                    </div>
                )}
            </div>
        </div>
    );
}
