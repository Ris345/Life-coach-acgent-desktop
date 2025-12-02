import { useState, useEffect } from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { TabListModal } from './TabListModal';

interface AppMetric {
    name: string;
    launches: number;
    total_time: number;
    average_session: number;
}

type ViewMode = 'time' | 'correlation';

export function UsageMetrics() {
    const [metrics, setMetrics] = useState<AppMetric[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('time');
    const [selectedApp, setSelectedApp] = useState<string | null>(null);

    useEffect(() => {
        loadMetrics();

        // Poll for updates every 2 seconds for real-time feel
        const interval = setInterval(loadMetrics, 2000);

        return () => clearInterval(interval);
    }, []);

    const loadMetrics = async () => {
        setError(null); // Clear previous errors
        try {
            const response = await fetch('http://127.0.0.1:14200/api/metrics/applications');
            if (response.ok) {
                const data = await response.json();
                setMetrics(data.metrics || []);
            } else {
                const errorText = await response.text();
                throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText} - ${errorText}`);
            }
        } catch (error) {
            console.error('Failed to load metrics:', error);
            if (metrics.length === 0) { // Only set error state if no data was loaded previously
                setError(error instanceof Error ? error.message : 'Failed to load metrics');
            }
        } finally {
            setIsLoading(false);
        }
    }

    // Chart Data Preparation
    const chartData = metrics
        // Show ALL apps, even with 0 usage, sorted by time then name
        .sort((a, b) => {
            if (b.total_time !== a.total_time) return b.total_time - a.total_time;
            return a.name.localeCompare(b.name);
        })
        .map(app => ({
            name: app.name,
            launches: app.launches,
            // Use float for better precision with small values
            timeMinutes: parseFloat((app.total_time / 60).toFixed(2)),
            avgSessionMinutes: Math.round(app.average_session / 60),
            totalTime: app.total_time
        }));

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];

    // Calculate height for scrollable container based on number of items
    const chartHeight = Math.max(500, chartData.length * 40);

    const handleManualRefresh = async () => {
        setIsLoading(true);
        await loadMetrics();
        setIsLoading(false);
    };

    const handleBarClick = (data: any) => {
        if (data && data.name === 'Google Chrome') {
            setSelectedApp(data.name);
        }
    };

    // Custom tick to make labels clickable
    const CustomizedAxisTick = (props: any) => {
        const { x, y, payload } = props;
        const isChrome = payload.value === 'Google Chrome';

        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill={isChrome ? '#4ade80' : '#9ca3af'}
                    fontSize={12}
                    onClick={() => isChrome && setSelectedApp('Google Chrome')}
                    style={{ cursor: isChrome ? 'pointer' : 'default', fontWeight: isChrome ? 700 : 400 }}
                >
                    {payload.value.length > 20 ? `${payload.value.substring(0, 20)}...` : payload.value}
                </text>
            </g>
        );
    };

    return (
        <div className="bg-zinc-900 p-6 rounded-xl mb-8 border border-zinc-800 shadow-lg">
            <TabListModal
                isOpen={!!selectedApp}
                onClose={() => setSelectedApp(null)}
                appName={selectedApp || ''}
            />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-white mb-1">Application Metrics</h2>
                    <p className="text-sm text-zinc-400">Real-time usage tracking ({metrics.length} apps)</p>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                        <button
                            onClick={() => setViewMode('time')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'time'
                                ? 'bg-zinc-800 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            Time
                        </button>
                        <button
                            onClick={() => setViewMode('correlation')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'correlation'
                                ? 'bg-zinc-800 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            Correlation
                        </button>
                    </div>

                    <button
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        className={`px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {isLoading ? '...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            {/* Content Area */}
            <div className="h-[500px] w-full relative overflow-y-auto overflow-x-hidden custom-scrollbar">
                {isLoading && metrics.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 bg-zinc-900/80 z-10 backdrop-blur-sm">
                        Loading metrics...
                    </div>
                ) : null}

                {metrics.length === 0 && !isLoading ? (
                    <div className="flex items-center justify-center h-full text-zinc-500">
                        No usage data available.
                    </div>
                ) : (
                    <>
                        {/* Bar Chart View (Time Spent) - Horizontal & Scrollable */}
                        {viewMode === 'time' && (
                            <div style={{ height: `${chartHeight}px`, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        layout="vertical"
                                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            stroke="#60a5fa"
                                            label={{ value: 'Time (min)', position: 'top', fill: '#60a5fa' }}
                                            tick={{ fill: '#71717a' }}
                                        />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            stroke="#71717a"
                                            width={150}
                                            tick={<CustomizedAxisTick />}
                                            interval={0}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '0.5rem', color: '#f4f4f5' }}
                                            itemStyle={{ color: '#f4f4f5' }}
                                            cursor={{ fill: '#27272a', opacity: 0.4 }}
                                            formatter={(value: any) => [`${value} min`, 'Total Time']}
                                        />
                                        <Bar
                                            dataKey="timeMinutes"
                                            name="Total Time"
                                            radius={[0, 4, 4, 0]}
                                            barSize={20}
                                            onClick={handleBarClick}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.name === 'Google Chrome' ? '#4ade80' : COLORS[index % COLORS.length]}
                                                    style={{ cursor: entry.name === 'Google Chrome' ? 'pointer' : 'default' }}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Composed Chart View (Time vs Launches) */}
                        {viewMode === 'correlation' && (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#71717a"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 12, fill: '#71717a' }}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        stroke="#60a5fa"
                                        label={{ value: 'Time (min)', angle: -90, position: 'insideLeft', fill: '#60a5fa' }}
                                        tick={{ fill: '#71717a' }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke="#4ade80"
                                        label={{ value: 'Launches', angle: 90, position: 'insideRight', fill: '#4ade80' }}
                                        tick={{ fill: '#71717a' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '0.5rem', color: '#f4f4f5' }}
                                        itemStyle={{ color: '#f4f4f5' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Bar yAxisId="left" dataKey="timeMinutes" name="Total Time (min)" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="launches" name="Launches" stroke="#4ade80" strokeWidth={2} dot={{ r: 4 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
