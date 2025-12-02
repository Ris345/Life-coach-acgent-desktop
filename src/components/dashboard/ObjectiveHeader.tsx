

import { useState, useEffect } from 'react';
import { Edit2, Check, Target, Activity } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { motion } from 'framer-motion';

interface ObjectiveHeaderProps {
    currentGoal: string;
    focusScore: number;
    onUpdateGoal: (newGoal: string) => void;
}

export function ObjectiveHeader({ currentGoal, focusScore, onUpdateGoal }: ObjectiveHeaderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempGoal, setTempGoal] = useState(currentGoal);

    useEffect(() => {
        setTempGoal(currentGoal);
    }, [currentGoal]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateGoal(tempGoal);
        setIsEditing(false);
    };

    return (
        <GlassCard className="mb-8 relative overflow-hidden" variant="featured">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="p-8 pb-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div className="flex-1 w-full max-w-4xl">
                    <div className="flex items-center gap-2 mb-3 text-purple-400">
                        <div className="p-1.5 bg-purple-500/10 rounded-lg">
                            <Target size={16} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest">Current Objective</span>
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="relative w-full">
                            <input
                                type="text"
                                value={tempGoal}
                                onChange={(e) => setTempGoal(e.target.value)}
                                className="w-full bg-transparent text-3xl md:text-4xl font-bold text-white border-b-2 border-purple-500/50 focus:border-purple-500 focus:outline-none pb-2 placeholder:text-zinc-700 transition-colors"
                                autoFocus
                                placeholder="What is your main focus?"
                            />
                            <button
                                type="submit"
                                className="absolute right-0 bottom-4 p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition-colors shadow-lg shadow-purple-500/20"
                            >
                                <Check size={20} />
                            </button>
                        </form>
                    ) : (
                        <div className="group flex items-baseline gap-4">
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                                {currentGoal || "Set a goal to begin..."}
                            </h1>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg"
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6 shrink-0">
                    {/* Focus Score Card */}
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={14} className="text-zinc-500" />
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Focus Score</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-5xl font-mono font-bold tracking-tighter ${focusScore >= 80 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' :
                                focusScore >= 50 ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]' :
                                    'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                                }`}>
                                {focusScore}
                            </span>
                            <span className="text-zinc-600 font-medium text-lg">/100</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${focusScore}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full ${focusScore >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                        focusScore >= 50 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                            'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        }`}
                />
            </div>
        </GlassCard>
    );
}
