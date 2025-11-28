import { useState, useEffect } from 'react';
import { GoalInput, Timeframe } from './GoalInput';
import { MetricsOverview } from './MetricsOverview';
import { GoalTracker } from './GoalTracker';
import { ApplicationsList } from './ApplicationsList';
import { UsageMetrics } from './UsageMetrics';
import { trackPageView, trackButtonClick } from '../utils/analytics';

export function Dashboard() {
  const [currentGoal, setCurrentGoal] = useState<string | null>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>('week');
  const [trackedDays, setTrackedDays] = useState<Set<number>>(new Set());

  // Mocked metrics data
  const [focusTime] = useState(145); // minutes
  const [activityCount] = useState(12);
  const [showAllApps, setShowAllApps] = useState(false);

  // Track page view when dashboard loads
  useEffect(() => {
    trackPageView('/dashboard');
  }, []);

  const handleGoalSubmit = (goal: string, timeframe: Timeframe) => {
    setCurrentGoal(goal);
    setCurrentTimeframe(timeframe);
    // Reset tracked days when a new goal is set
    setTrackedDays(new Set());

    // Track goal creation
    trackButtonClick('goal_submit', {
      timeframe: timeframe,
      goal_length: goal.length,
    });
  };

  const handleTrackDay = (dayIndex: number) => {
    setTrackedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <GoalInput onGoalSubmit={handleGoalSubmit} />

      <MetricsOverview
        currentGoal={currentGoal}
        focusTime={focusTime}
        activityCount={activityCount}
      />

      <UsageMetrics />

      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <button
          onClick={() => setShowAllApps(!showAllApps)}
          style={{
            background: 'transparent',
            border: '1px solid #444',
            color: '#888',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {showAllApps ? 'Hide All Applications' : 'Show All Installed Applications'}
        </button>
      </div>

      {showAllApps && <ApplicationsList />}

      {currentGoal && (
        <GoalTracker
          timeframe={currentTimeframe}
          onTrackDay={handleTrackDay}
          trackedDays={trackedDays}
        />
      )}

      {!currentGoal && (
        <div style={{
          background: '#252936',
          padding: '2rem',
          borderRadius: '0.75rem',
          textAlign: 'center',
          color: '#888',
        }}>
          <p>Set a goal above to start tracking your progress!</p>
        </div>
      )}
    </div>
  );
}

