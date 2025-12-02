import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NudgeToast, Nudge } from './NudgeToast';
import { LevelUpModal } from './LevelUpModal';
import { LiveFeed } from './LiveFeed';
import { ObjectiveHeader } from './dashboard/ObjectiveHeader';
import { TrendChart } from './dashboard/TrendChart';
import { MetricsGrid } from './dashboard/MetricsGrid';
import { StrategyDisplay } from './StrategyDisplay';
import { DebugPanel } from './dashboard/DebugPanel';
import { ImpactLeaderboard } from './dashboard/ImpactLeaderboard';

import { useGoalAnalysis } from '../hooks/useGoalAnalysis';
import { useGoalSessionStore } from '../stores/useGoalSessionStore';

interface UserMetrics {
  focus_time_minutes: number;
  distracted_time_minutes: number;
  success_probability: number;
  context_switches: number;
  applications_used: Record<string, number>;
  weekly_stats: any[];
}

export function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [currentGoal, setCurrentGoal] = useState<string>('');
  const [currentStrategy, setCurrentStrategy] = useState<string | null>(null);
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [correlations, setCorrelations] = useState<any[]>([]);
  const prevLevelRef = useRef(0);

  const { runAnalysis } = useGoalAnalysis();
  const { strategy: newStrategy, parsedGoal: newParsedGoal } = useGoalSessionStore();

  // Sync store updates to local state
  useEffect(() => {
    if (newStrategy) setCurrentStrategy(newStrategy);
    if (newParsedGoal) setCurrentGoal(newParsedGoal.goal);
  }, [newStrategy, newParsedGoal]);

  // Load initial data
  useEffect(() => {
    if (!user?.id) return;

    // Initialize user in backend (DataCollector)
    fetch('http://127.0.0.1:14200/api/user/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email,
        name: user.name || user.email?.split('@')[0]
      })
    }).catch(err => console.error("Failed to set user:", err));

    fetch(`http://127.0.0.1:14200/api/goals/current?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.goal) {
          setCurrentGoal(data.goal.goal_text || data.goal.goal || '');
          if (data.goal.strategy) setCurrentStrategy(data.goal.strategy);
        }
      })
      .catch(err => console.error("Failed to load goal:", err));
  }, [user?.id]);

  // Poll for metrics
  useEffect(() => {
    if (!user?.id) return;

    const fetchMetrics = async () => {
      try {
        const [probRes, switchRes, weeklyRes, gameRes, corrRes] = await Promise.all([
          fetch(`http://127.0.0.1:14200/api/probability/calculate?user_id=${user.id}`),
          fetch(`http://127.0.0.1:14200/api/metrics/applications`),
          fetch(`http://127.0.0.1:14200/api/analytics/weekly?user_id=${user.id}`),
          fetch(`http://127.0.0.1:14200/api/gamification/stats?user_id=${user.id}`),
          fetch(`http://127.0.0.1:14200/api/correlations?user_id=${user.id}`)
        ]);

        const probData = await probRes.json();
        const switchData = await switchRes.json();
        const weeklyData = await weeklyRes.json();
        const gameData = await gameRes.json();
        const corrData = await corrRes.json();

        const todayStats = weeklyData.stats ? weeklyData.stats[weeklyData.stats.length - 1] : null;

        // Handle Level Up
        const newLevel = gameData.stats?.level || 1;
        if (prevLevelRef.current === 0) {
          prevLevelRef.current = newLevel;
        } else if (newLevel > prevLevelRef.current) {
          setCurrentLevel(newLevel);
          setShowLevelUp(true);
          prevLevelRef.current = newLevel;
        }

        setMetrics({
          focus_time_minutes: todayStats ? todayStats.focus_minutes : 0,
          distracted_time_minutes: todayStats ? todayStats.distraction_minutes : 0,
          success_probability: probData.probability?.score ? Math.round(probData.probability.score * 100) : 0,
          context_switches: switchData.context_switches || 0,
          // Map array of metrics to dictionary for compatibility
          applications_used: switchData.metrics ?
            switchData.metrics.reduce((acc: any, app: any) => {
              acc[app.name] = app.total_time;
              return acc;
            }, {}) : {},
          weekly_stats: weeklyData.stats || [],
        });

        setCorrelations(corrData.correlations || []);

      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleUpdateGoal = async (newGoal: string) => {
    if (!user?.id) return;
    // Trigger the AI Analysis flow
    runAnalysis(newGoal, user.id);
  };

  // Prepare chart data
  const trendData = metrics?.weekly_stats.map(d => d.success_probability || 0) || [];
  const trendLabels = metrics?.weekly_stats.map(d => d.date) || [];



  return (
    <div className="space-y-8">
      <DebugPanel />
      <NudgeToast nudge={activeNudge} onDismiss={() => setActiveNudge(null)} />
      {showLevelUp && <LevelUpModal level={currentLevel} onClose={() => setShowLevelUp(false)} />}

      <div className="grid grid-cols-12 gap-8 h-full">
        {/* LEFT COLUMN: Charts & Data (9 cols) */}
        <div className="col-span-12 lg:col-span-9 space-y-8 pb-8">

          {/* 1. Header Section */}
          <ObjectiveHeader
            currentGoal={currentGoal}
            focusScore={metrics?.success_probability || 0}
            onUpdateGoal={handleUpdateGoal}
          />

          {/* 2. Primary Trend Chart */}
          <TrendChart data={trendData} labels={trendLabels} />

          {/* 3. Metrics Grid */}
          <MetricsGrid
            focusTime={metrics?.focus_time_minutes || 0}
            distractionTime={metrics?.distracted_time_minutes || 0}
            appUsage={Object.entries(metrics?.applications_used || {})
              .map(([name, duration]) => ({
                name,
                duration,
                category: (['VS Code', 'Terminal', 'Xcode', 'Figma', 'Notion'].some(app => name.includes(app))
                  ? 'productive'
                  : 'distracting') as 'productive' | 'distracting'
              }))
              .sort((a, b) => b.duration - a.duration)
              .slice(0, 5)
            }
            contextSwitches={metrics?.context_switches || 0}
          />

          {/* 4. Focus Impact Chart */}
          <ImpactLeaderboard data={correlations} />
        </div>

        {/* RIGHT COLUMN: Live Feed (3 cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col">
          <LiveFeed />
        </div>

        {/* 5. Strategy / Roadmap (Full Width) */}
        <div className="col-span-12">
          {currentStrategy && <StrategyDisplay strategyJson={currentStrategy} />}
        </div>
      </div>
    </div>
  );
}
