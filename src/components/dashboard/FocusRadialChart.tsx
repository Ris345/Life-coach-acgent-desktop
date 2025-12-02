import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import '../../utils/chartSetup';

interface FocusRadialChartProps {
    score: number;
    label?: string;
}

export function FocusRadialChart({ score, label = 'Focus Score' }: FocusRadialChartProps) {
    const data = {
        labels: ['Score', 'Remaining'],
        datasets: [
            {
                data: [score, 100 - score],
                backgroundColor: [
                    score >= 80 ? '#10b981' : score >= 50 ? '#3b82f6' : '#f59e0b', // emerald, blue, amber
                    '#27272a', // zinc-800
                ],
                borderWidth: 0,
                cutout: '85%',
                circumference: 360,
                rotation: 0,
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
                enabled: false,
            },
        },
        animation: {
            animateScale: true,
            animateRotate: true,
        },
    };

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0">
                <Doughnut data={data} options={options} />
            </div>
            <div className="flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white">{score}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
            </div>
        </div>
    );
}
