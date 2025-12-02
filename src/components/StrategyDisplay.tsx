import { useState } from 'react';
import { Map, ChevronRight, CheckCircle2, Clock, ArrowUpRight, Calendar, Layers } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
    task: string;
    type: string;
    estimated_minutes: number;
}

interface DayPlan {
    day: number;
    focus: string;
    tasks: Task[];
}

interface WeekPlan {
    week: number;
    theme: string;
    days: DayPlan[];
}

interface Resource {
    title: string;
    url: string;
    type: string;
    description: string;
}

interface Strategy {
    weekly_plan: WeekPlan[];
    overview: string;
    resources?: Resource[];
}

interface StrategyDisplayProps {
    strategyJson: string | null;
}

export function StrategyDisplay({ strategyJson }: StrategyDisplayProps) {
    const [expandedWeek, setExpandedWeek] = useState<number>(1);

    if (!strategyJson) return null;

    let strategy: Strategy;
    try {
        strategy = JSON.parse(strategyJson);
    } catch (e) {
        console.error("Failed to parse strategy JSON", e);
        return null;
    }

    if (!strategy.weekly_plan || strategy.weekly_plan.length === 0) return null;

    return (
        <GlassCard className="p-6 overflow-hidden" variant="subtle">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <Map size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Execution Roadmap</h3>
                        <p className="text-xs text-zinc-500 font-medium">AI-Generated Strategy</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                    <Calendar size={12} className="text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-400">
                        {strategy.weekly_plan.length} WEEKS
                    </span>
                </div>
            </div>

            {/* Overview */}
            <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/5 text-sm text-zinc-300 leading-relaxed">
                {strategy.overview}
            </div>

            {/* Timeline */}
            <div className="space-y-4 relative">
                {/* Vertical Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-zinc-800/50 z-0" />

                {strategy.weekly_plan.map((week) => {
                    const isExpanded = expandedWeek === week.week;
                    return (
                        <div key={week.week} className="relative z-10">
                            {/* Week Header */}
                            <button
                                onClick={() => setExpandedWeek(isExpanded ? -1 : week.week)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 border ${isExpanded
                                        ? 'bg-zinc-900/80 border-blue-500/30 shadow-lg shadow-black/20'
                                        : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/60 hover:border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono transition-all duration-300 shadow-inner
                                        ${isExpanded
                                            ? 'bg-blue-500 text-white shadow-blue-600/20 scale-110'
                                            : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-300'}
                                    `}>
                                        {week.week}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Week {week.week}</div>
                                        <div className={`font-medium transition-colors ${isExpanded ? 'text-white' : 'text-zinc-400'}`}>
                                            {week.theme}
                                        </div>
                                    </div>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-blue-500/10 text-blue-400 rotate-90' : 'bg-white/5 text-zinc-600'
                                    }`}>
                                    <ChevronRight size={16} />
                                </div>
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="ml-[27px] pl-8 border-l-2 border-blue-500/20 py-6 space-y-8">
                                            {week.days && week.days.map((day) => (
                                                <div key={day.day} className="relative">
                                                    {/* Day Marker */}
                                                    <div className="absolute -left-[39px] top-2 w-3 h-3 rounded-full bg-zinc-900 border-2 border-blue-500 z-10" />

                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Day {day.day}</span>
                                                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                                            {day.focus}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2.5">
                                                        {day.tasks && day.tasks.map((task, idx) => (
                                                            <div key={idx} className="flex items-start gap-3 group/task p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                                <CheckCircle2 size={16} className="mt-0.5 text-zinc-700 group-hover/task:text-emerald-500 transition-colors" />
                                                                <div className="flex-1">
                                                                    <div className="text-sm text-zinc-300 group-hover/task:text-white transition-colors">
                                                                        {task.task}
                                                                    </div>
                                                                    {task.estimated_minutes > 0 && (
                                                                        <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-mono mt-1">
                                                                            <Clock size={10} />
                                                                            {task.estimated_minutes}m
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Resources - Compact Grid */}
            {strategy.resources && strategy.resources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <Layers size={14} className="text-zinc-500" />
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Resources</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {strategy.resources.map((resource, idx) => (
                            <a
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className={`mt-1 p-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${resource.type === 'video' ? 'bg-red-500/10 text-red-400' :
                                        resource.type === 'tool' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-purple-500/10 text-purple-400'
                                    }`}>
                                    {resource.type.slice(0, 3)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="text-sm font-medium text-zinc-300 group-hover:text-white truncate">
                                            {resource.title}
                                        </div>
                                        <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                    <div className="text-xs text-zinc-500 line-clamp-1">
                                        {resource.description}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </GlassCard>
    );
}
