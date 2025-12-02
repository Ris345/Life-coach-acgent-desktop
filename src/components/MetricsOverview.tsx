import React, { useState, useMemo } from 'react';
import { GlassCard } from './GlassCard';
import { TrendingUp, Activity, Clock, Target, Zap, ArrowUpRight, Info } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ScriptableContext
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface MetricsOverviewProps {
  currentGoal: string;
  focusTime: number;
  activityCount: number;
  contextSwitches: number;
  successProbability: number;
  probabilityData?: any;
  onEditGoal: () => void;
  weeklyStats?: any[];
}

export const MetricsOverview = React.memo(function MetricsOverview({
  currentGoal,
  focusTime,
  activityCount,
  contextSwitches,
  successProbability,
  probabilityData,
  onEditGoal,
  weeklyStats = []
}: MetricsOverviewProps) {
  // console.log("MetricsOverview render"); // Uncomment for debugging
  const [showExplanation, setShowExplanation] = useState(false);

  // Calculate progress percentages
  const focusGoalMinutes = 8 * 60; // 8 hours goal
  const focusPercentage = Math.min(100, Math.round((focusTime / focusGoalMinutes) * 100));

  const maxApps = 10; // Threshold for "high" activity
  const activityPercentage = Math.min(100, Math.round((activityCount / maxApps) * 100));

  // Memoize chart data to prevent re-calculation on every render
  const trendData = useMemo(() => {
    const labels = weeklyStats.length > 0
      ? weeklyStats.map(d => d.date)
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const dataPoints = weeklyStats.length > 0
      ? weeklyStats.map(d => d.success_probability)
      : Array(7).fill(0);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Success Probability',
          data: dataPoints,
          fill: true,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)'); // Blue-500
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            return gradient;
          },
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [weeklyStats]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#ccc',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#71717a', // zinc-500
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          display: false, // Hide Y axis labels for cleaner look
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }), []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      {/* Main Probability Card (Hero) */}
      <GlassCard className="md:col-span-2 p-8 relative overflow-hidden group flex flex-col" variant="featured">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity duration-500 group-hover:opacity-70 pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Success Probability</h3>
                <p className="text-sm text-zinc-400">Based on your current activity patterns</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
              <ArrowUpRight size={14} />
              <span>Real-time Analysis</span>
            </div>
          </div>

          {/* Current Goal Display */}
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-between group/goal">
            <div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">
                <Target size={12} />
                Current Objective
              </div>
              <div className="text-lg font-medium text-white">
                {currentGoal || "No active goal set"}
              </div>
            </div>
            <button
              onClick={onEditGoal}
              className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg text-zinc-300 hover:text-white transition-colors"
            >
              Change Goal
            </button>
          </div>

          <div className="flex items-end gap-4 mb-6">
            <div className="text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 font-mono tracking-tighter leading-tight pb-1">
              {successProbability}%
            </div>
            <div className="mb-2">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-sm text-zinc-400 hover:text-white underline decoration-zinc-700 underline-offset-4 transition-colors flex items-center gap-1"
              >
                <Info size={14} />
                {showExplanation ? "Hide Analysis" : "View Analysis"}
              </button>
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-1 min-h-[160px] w-full relative mb-6">
            <Line options={chartOptions} data={trendData} />
          </div>

          {showExplanation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              {/* Positive Factors */}
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ArrowUpRight size={12} />
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {probabilityData?.positive_factors?.map((factor: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      <span>{factor}</span>
                    </li>
                  )) || (
                      <li className="text-sm text-zinc-500 italic">Analyzing strengths...</li>
                    )}
                </ul>
              </div>

              {/* Negative Factors */}
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity size={12} />
                  Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {probabilityData?.negative_factors?.map((factor: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <span>{factor}</span>
                    </li>
                  )) || (
                      <li className="text-sm text-zinc-500 italic">Identifying challenges...</li>
                    )}
                </ul>
              </div>

              {/* Summary Text */}
              {probabilityData?.explanation && (
                <div className="md:col-span-2 mt-2 px-2">
                  <p className="text-xs text-zinc-500 text-center italic">
                    "{probabilityData.explanation}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* One-Click Boosters */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/5">
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group/btn">
              <Zap size={16} className="text-yellow-400 group-hover/btn:scale-110 transition-transform" />
              <span className="text-sm font-medium text-zinc-300">Deep Work (+8%)</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group/btn">
              <Activity size={16} className="text-red-400 group-hover/btn:scale-110 transition-transform" />
              <span className="text-sm font-medium text-zinc-300">Block Distractions (+5%)</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Secondary Metrics Column - Now with Charts */}
      <div className="space-y-6">
        {/* Focus Time - Doughnut Chart */}
        <GlassCard className="p-6 flex flex-col justify-between h-[200px] relative overflow-hidden">
          <div className="flex items-start justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400">
                <Clock size={16} />
              </div>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Focus Goal</span>
            </div>
            <span className="text-xl font-bold text-white">{Math.round(focusTime / 60)}h {focusTime % 60}m</span>
          </div>

          <div className="absolute right-[-20px] bottom-[-20px] w-[140px] h-[140px] opacity-20 pointer-events-none">
            {/* Decorative background element */}
            <div className="w-full h-full rounded-full border-[20px] border-purple-500/30" />
          </div>

          <div className="flex-1 flex items-center justify-center relative mt-2">
            <div className="w-[100px] h-[100px] relative">
              <Doughnut
                data={{
                  labels: ['Completed', 'Remaining'],
                  datasets: [{
                    data: [focusTime, Math.max(0, focusGoalMinutes - focusTime)],
                    backgroundColor: ['rgba(168, 85, 247, 0.8)', 'rgba(255, 255, 255, 0.05)'],
                    borderWidth: 0,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  animation: { duration: 1000 }
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xs text-zinc-500 font-medium">Progress</span>
                <span className="text-sm font-bold text-white">{focusPercentage}%</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Context Switches - Bar Chart */}
        <GlassCard className="p-6 flex flex-col justify-between h-[200px]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-500/20 rounded-lg text-orange-400">
                <Activity size={16} />
              </div>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Switches</span>
            </div>
            <span className={`text-xl font-bold ${contextSwitches > 50 ? 'text-red-400' : 'text-white'}`}>
              {contextSwitches}
            </span>
          </div>

          <div className="flex-1 w-full h-full min-h-[100px]">
            <Bar
              data={{
                labels: ['Limit', 'Current'],
                datasets: [{
                  label: 'Switches',
                  data: [50, contextSwitches],
                  backgroundColor: ['rgba(255, 255, 255, 0.1)', contextSwitches > 50 ? 'rgba(248, 113, 113, 0.8)' : 'rgba(249, 115, 22, 0.8)'],
                  borderRadius: 4,
                  barThickness: 20,
                }]
              }}
              options={{
                indexAxis: 'y' as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { display: false, max: Math.max(60, contextSwitches * 1.2) },
                  y: {
                    display: true,
                    grid: { display: false },
                    ticks: { color: '#71717a', font: { size: 10 } }
                  }
                }
              }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">
            {contextSwitches > 50 ? 'High fragmentation detected' : 'Good focus flow'}
          </p>
        </GlassCard>

        {/* Activity Count - Sparkline */}
        <GlassCard className="p-6 flex flex-col justify-between h-[200px]">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-pink-500/20 rounded-lg text-pink-400">
                <Zap size={16} />
              </div>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Intensity</span>
            </div>
            <span className="text-xl font-bold text-white">{activityCount} <span className="text-xs text-zinc-500 font-normal">apps</span></span>
          </div>

          <div className="flex-1 w-full h-full min-h-[80px]">
            <Line
              data={{
                labels: Array(10).fill(''),
                datasets: [{
                  data: Array(10).fill(0).map((_, i) => Math.max(0, activityCount + Math.sin(i) * 2 + (Math.random() * 2 - 1))), // Simulated pulse
                  borderColor: 'rgba(236, 72, 153, 0.8)',
                  borderWidth: 2,
                  tension: 0.4,
                  pointRadius: 0,
                  fill: true,
                  backgroundColor: 'rgba(236, 72, 153, 0.1)'
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false, min: 0 } },
                animation: { duration: 0 } // Disable animation for "real-time" feel if we were updating fast
              }}
            />
          </div>
          <div className="w-full bg-zinc-800/50 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${activityPercentage}%` }} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
});
