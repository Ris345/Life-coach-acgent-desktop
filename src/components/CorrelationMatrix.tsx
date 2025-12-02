import { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Activity, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface Correlation {
    app: string;
    correlation: number;
    impact: string;
    usage_avg: string;
}

interface CorrelationMatrixProps {
    userId: string;
}

export function CorrelationMatrix({ userId }: CorrelationMatrixProps) {
    const [correlations, setCorrelations] = useState<Correlation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        fetch(`http://127.0.0.1:14200/api/correlations?user_id=${userId}`)
            .then(res => res.json())
            .then(data => {
                setCorrelations(data.correlations || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load correlations:", err);
                setLoading(false);
            });
    }, [userId]);

    const getImpactColor = (impact: string) => {
        switch (impact.toLowerCase()) {
            case 'critical': return 'text-red-500';
            case 'high negative': return 'text-orange-500';
            case 'high positive': return 'text-emerald-500';
            case 'positive': return 'text-green-400';
            default: return 'text-zinc-400';
        }
    };

    const getImpactIcon = (impact: string) => {
        if (impact.includes('Negative') || impact === 'Critical') return <AlertTriangle size={14} />;
        if (impact.includes('Positive')) return <CheckCircle size={14} />;
        return <HelpCircle size={14} />;
    };

    return (
        <GlassCard className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                        <Activity size={16} />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Correlation Engine</h3>
                </div>
                <span className="text-xs text-zinc-500">Last 7 Days</span>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                    Analyzing patterns...
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {correlations.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-8 rounded-full ${item.correlation > 0 ? 'bg-emerald-500' : 'bg-red-500'} opacity-50`} />
                                <div>
                                    <div className="font-medium text-white text-sm">{item.app}</div>
                                    <div className="text-xs text-zinc-500">Avg: {item.usage_avg}/day</div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={`flex items-center justify-end gap-1 text-xs font-bold ${getImpactColor(item.impact)}`}>
                                    {getImpactIcon(item.impact)}
                                    <span>{item.impact}</span>
                                </div>
                                <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                                    r = {item.correlation > 0 ? '+' : ''}{item.correlation}
                                </div>
                            </div>
                        </div>
                    ))}

                    {correlations.length === 0 && (
                        <div className="text-center text-zinc-500 text-sm py-8">
                            No significant correlations found yet.
                        </div>
                    )}
                </div>
            )}
        </GlassCard>
    );
}
