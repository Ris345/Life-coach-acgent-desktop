import { useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { GlassCard } from '../GlassCard';
import { Clock, Activity, Zap } from 'lucide-react';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface MetricsGridProps {
    focusTime: number; // minutes
    distractionTime: number; // minutes
    appUsage: { name: string; duration: number; category: 'productive' | 'distracting' }[];
    contextSwitches: number;
}

export function MetricsGrid({ focusTime, distractionTime, appUsage, contextSwitches }: MetricsGridProps) {

    // 1. Focus Distribution (Doughnut)
    const focusData = useMemo(() => ({
        labels: ['Focus', 'Distraction'],
        datasets: [{
            data: [focusTime, distractionTime],
            backgroundColor: ['#10b981', '#ef4444'], // Emerald-500, Red-500
            borderWidth: 0,
            cutout: '80%',
        }]
    }), [focusTime, distractionTime]);

    // 2. App Usage (Horizontal Bar)
    const appData = useMemo(() => ({
        labels: appUsage.map(a => a.name),
        datasets: [{
            data: appUsage.map(a => a.duration),
            backgroundColor: appUsage.map(a => a.category === 'productive' ? '#3b82f6' : '#f59e0b'), // Blue vs Amber
            borderRadius: 4,
            barThickness: 12,
        }]
    }), [appUsage]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: Focus Distribution */}
            <GlassCard className="p-5 flex flex-col h-[240px]">
                <div className="flex items-center gap-2 mb-4">
                    <Clock size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Time Allocation</span>
                </div>
                <div className="flex-1 relative flex items-center justify-center">
                    <div className="w-32 h-32">
                        <Doughnut
                            data={focusData}
                            options={{
                                plugins: { tooltip: { enabled: false }, legend: { display: false } },
                                maintainAspectRatio: true,
                                cutout: '80%'
                            }}
                        />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-white">{Math.round((focusTime / (focusTime + distractionTime || 1)) * 100)}%</span>
                        <span className="text-[10px] text-zinc-500 uppercase">Focus</span>
                    </div>
                </div>
                <div className="flex justify-between text-xs text-zinc-500 mt-2 px-2">
                    <span>{Math.round(focusTime / 60)}h Focus</span>
                    <span>{Math.round(distractionTime / 60)}h Distraction</span>
                </div>
            </GlassCard>

            {/* Card 2: Top Apps */}
            <GlassCard className="p-5 flex flex-col h-[240px]">
                <div className="flex items-center gap-2 mb-4">
                    <Activity size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top Apps</span>
                </div>
                <div className="flex-1 w-full">
                    <Bar
                        data={appData}
                        options={{
                            indexAxis: 'y' as const,
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { display: false },
                                y: {
                                    grid: { display: false },
                                    ticks: { color: '#a1a1aa', font: { size: 11 } }
                                }
                            }
                        }}
                    />
                </div>
            </GlassCard>

            {/* Card 3: Context Switches (Gauge-like) */}
            <GlassCard className="p-5 flex flex-col h-[240px] relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4 relative z-10">
                    <Zap size={16} className="text-amber-500" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Fragmentation</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                    <div className="text-5xl font-bold text-white mb-2">{contextSwitches}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Switches Today</div>

                    <div className="w-full bg-zinc-800 h-2 rounded-full mt-6 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${contextSwitches < 30 ? 'bg-emerald-500' :
                                    contextSwitches < 60 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${Math.min(100, (contextSwitches / 100) * 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between w-full text-[10px] text-zinc-600 mt-1 font-mono">
                        <span>0</span>
                        <span>100 (Limit)</span>
                    </div>
                </div>

                {/* Background Decoration */}
                <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-10 ${contextSwitches < 30 ? 'bg-emerald-500' :
                        contextSwitches < 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
            </GlassCard>

        </div>
    );
}
