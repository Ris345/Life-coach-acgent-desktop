import React from 'react';
import { Line } from 'react-chartjs-2';
import '../../utils/chartSetup';

interface TrendChartProps {
    data: number[];
    labels: string[];
}

export function TrendChart({ data, labels }: TrendChartProps) {
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Success Probability',
                data,
                borderColor: '#10b981', // emerald-500
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                    return gradient;
                },
                borderWidth: 2,
                tension: 0.4, // Smooth curve
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: '#18181b', // zinc-900
                titleColor: '#fff',
                bodyColor: '#a1a1aa', // zinc-400
                borderColor: '#27272a', // zinc-800
                borderWidth: 1,
                padding: 10,
                displayColors: false,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    maxTicksLimit: 7,
                },
            },
            y: {
                min: 0,
                max: 100,
                grid: {
                    color: '#27272a', // zinc-800
                    borderDash: [4, 4],
                },
                ticks: {
                    stepSize: 25,
                },
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false,
        },
    };

    return (
        <div className="w-full h-64 bg-zinc-900/50 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-zinc-400">Success Probability Trend</h3>
                <span className="text-xs text-emerald-400 font-mono">+12% vs last week</span>
            </div>
            <div className="h-48">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
}
