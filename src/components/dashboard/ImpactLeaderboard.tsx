import { motion } from 'framer-motion';
import { GlassCard } from '../GlassCard';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ImpactData {
    app: string;
    correlation: number; // -1 to 1
    impact_label: string;
}

interface ImpactLeaderboardProps {
    data: ImpactData[];
}

export function ImpactLeaderboard({ data }: ImpactLeaderboardProps) {
    // Sort by absolute correlation to show most impactful first
    // Limit to 4 items to fit in compact card
    const sortedData = [...data].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 4);

    return (
        <GlassCard className="h-[240px] flex flex-col p-5" variant="featured">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <h3 className="text-base font-bold text-white">Focus Impact</h3>
                    <p className="text-[10px] text-zinc-400">Top apps affecting your flow</p>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-500 font-mono">
                    7 DAYS
                </div>
            </div>

            <div className="space-y-3 flex-1 overflow-hidden">
                {sortedData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm">
                        <p>Not enough data yet.</p>
                        <p className="text-xs opacity-50">Keep tracking to see insights.</p>
                    </div>
                ) : (
                    sortedData.map((item, index) => (
                        <ImpactItem key={item.app} item={item} index={index} />
                    ))
                )}
            </div>
        </GlassCard>
    );
}

function ImpactItem({ item, index }: { item: ImpactData; index: number }) {
    const isPositive = item.correlation > 0;
    const intensity = Math.abs(item.correlation);
    const percentage = Math.round(intensity * 100);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
        >
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-300">{item.app}</span>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${isPositive ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                    {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {percentage}%
                </div>
            </div>

            {/* Progress Bar Background */}
            <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                {/* Animated Bar - Less Bright */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 + index * 0.1 }}
                    className={`h-full rounded-full ${isPositive
                        ? 'bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                        : 'bg-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                        }`}
                />
            </div>
        </motion.div>
    );
}
