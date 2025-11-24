import { useState } from 'react';
import { GoalInput, Timeframe } from './GoalInput';
import { MetricsOverview } from './MetricsOverview';
import { GoalTracker } from './GoalTracker';

export function Dashboard() {
  const [currentGoal, setCurrentGoal] = useState<string | null>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>('week');
  const [trackedDays, setTrackedDays] = useState<Set<number>>(new Set());
  
  // Mocked metrics data
  const [focusTime] = useState(145); // minutes
  const [activityCount] = useState(12);

  const handleGoalSubmit = (goal: string, timeframe: Timeframe) => {
    setCurrentGoal(goal);
    setCurrentTimeframe(timeframe);
    // Reset tracked days when a new goal is set
    setTrackedDays(new Set());
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

