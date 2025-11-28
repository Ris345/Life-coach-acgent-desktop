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
        // Refresh metrics every 1 second for real-time updates
        const interval = setInterval(loadMetrics, 1000);
        return () => clearInterval(interval);
    }, []);

    async function loadMetrics() {
        try {
            setError(null);
            const response = await fetch('http://127.0.0.1:14200/api/metrics/applications');
            const data = await response.json();
            setMetrics(data.metrics || []);
        } catch (err) {
            console.error('Failed to load metrics:', err);
            if (metrics.length === 0) {
                setError(err instanceof Error ? err.message : 'Failed to load metrics');
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
        <div style={{
            background: '#1f2937', // Darker background for "Datadog" feel
            padding: '1.5rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem',
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
            <TabListModal
                isOpen={!!selectedApp}
                onClose={() => setSelectedApp(null)}
                appName={selectedApp || ''}
            />

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
            }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600, color: '#f3f4f6' }}>Application Metrics</h2>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af' }}>Real-time usage tracking ({metrics.length} apps)</p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#111827', borderRadius: '0.375rem', padding: '0.25rem', border: '1px solid #374151' }}>
                        <button
                            onClick={() => setViewMode('time')}
                            style={{
                                padding: '0.375rem 0.75rem',
                                background: viewMode === 'time' ? '#374151' : 'transparent',
                                color: viewMode === 'time' ? '#fff' : '#9ca3af',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                        >
                            Time
                        </button>
                        <button
                            onClick={() => setViewMode('correlation')}
                            style={{
                                padding: '0.375rem 0.75rem',
                                background: viewMode === 'correlation' ? '#374151' : 'transparent',
                                color: viewMode === 'correlation' ? '#fff' : '#9ca3af',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                        >
                            Correlation
                        </button>
                    </div>

                    <button
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        style={{
                            padding: '0.375rem 0.75rem',
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'background 0.2s'
                        }}
                    >
                        {isLoading ? '...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{
                    background: '#7f1d1d',
                    color: '#fecaca',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    marginBottom: '1rem',
                    border: '1px solid #991b1b',
                    fontSize: '0.875rem'
                }}>
                    {error}
                </div>
            )}

            {/* Content Area */}
            <div style={{ height: '500px', width: '100%', position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
                {isLoading && metrics.length === 0 ? (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#9ca3af', background: 'rgba(31, 41, 55, 0.8)', zIndex: 10
                    }}>
                        Loading metrics...
                    </div>
                ) : null}

                {metrics.length === 0 && !isLoading ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
                        color: '#9ca3af'
                    }}>
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
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            stroke="#60a5fa"
                                            label={{ value: 'Time (min)', position: 'top', fill: '#60a5fa' }}
                                        />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            stroke="#9ca3af"
                                            width={150}
                                            tick={<CustomizedAxisTick />}
                                            interval={0}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.375rem', color: '#f3f4f6' }}
                                            itemStyle={{ color: '#f3f4f6' }}
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#9ca3af"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        stroke="#60a5fa"
                                        label={{ value: 'Time (min)', angle: -90, position: 'insideLeft', fill: '#60a5fa' }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke="#4ade80"
                                        label={{ value: 'Launches', angle: 90, position: 'insideRight', fill: '#4ade80' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.375rem', color: '#f3f4f6' }}
                                        itemStyle={{ color: '#f3f4f6' }}
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
