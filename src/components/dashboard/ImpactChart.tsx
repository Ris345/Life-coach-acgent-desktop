import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface ImpactData {
    app: string;
    correlation: number;
    impact: string;
    usage_avg: string;
}

interface ImpactChartProps {
    data: ImpactData[];
}

export function ImpactChart({ data }: ImpactChartProps) {
    const chartData = {
        labels: data.map(d => d.app),
        datasets: [
            {
                label: 'Focus Impact (Correlation)',
                data: data.map(d => d.correlation),
                backgroundColor: data.map(d => d.correlation > 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'), // Green / Red
                borderColor: data.map(d => d.correlation > 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'),
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const options = {
        indexAxis: 'y' as const, // Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'App Impact on Focus Score',
                color: '#a1a1aa', // zinc-400
                font: {
                    size: 14,
                    weight: 'normal' as const,
                }
            },
            tooltip: {
                callbacks: {
                    afterLabel: function (context: any) {
                        const item = data[context.dataIndex];
                        return `Avg Usage: ${item.usage_avg} | Impact: ${item.impact}`;
                    }
                }
            }
        },
        scales: {
            x: {
                min: -1,
                max: 1,
                grid: {
                    color: '#27272a', // zinc-800
                },
                ticks: {
                    color: '#71717a', // zinc-500
                }
            },
            y: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#e4e4e7', // zinc-200
                }
            }
        }
    };

    if (data.length === 0) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-[300px] flex items-center justify-center">
                <div className="text-center text-zinc-500">
                    <p className="mb-2">Not enough data for correlation analysis.</p>
                    <p className="text-xs">Need at least 2 days of activity history.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-[300px]">
            <div className="h-full w-full">
                <Bar options={options} data={chartData} />
            </div>
        </div>
    );
}
