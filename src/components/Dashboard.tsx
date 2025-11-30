import { useState, useEffect } from 'react';
import { GoalInput, Timeframe } from './GoalInput';
import { MetricsOverview } from './MetricsOverview';
import { GoalTracker } from './GoalTracker';
import { ApplicationsList } from './ApplicationsList';
import { UsageMetrics } from './UsageMetrics';
import { SmartNudgeToggle } from './SmartNudgeToggle';
import { trackPageView, trackButtonClick } from '../utils/analytics';

export function Dashboard() {
  const [currentGoal, setCurrentGoal] = useState<string | null>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>('week');
  const [trackedDays, setTrackedDays] = useState<Set<number>>(new Set());
  const [smartNudgeEnabled, setSmartNudgeEnabled] = useState<boolean>(false);
  const [contextSwitches, setContextSwitches] = useState(0);
  const [successProbability, setSuccessProbability] = useState<number | null>(null);
  const [probabilityExplanation, setProbabilityExplanation] = useState<string>('');

  // Mocked metrics data
  const [focusTime] = useState(145); // minutes
  const [activityCount] = useState(12);
  const [showAllApps, setShowAllApps] = useState(false);

  // Track page view when dashboard loads
  useEffect(() => {
    trackPageView('/dashboard');
  }, []);

  // Fetch context switches from backend
  useEffect(() => {
    const fetchContextSwitches = async () => {
      try {
        const response = await fetch('http://localhost:14200/api/metrics/applications');
        if (response.ok) {
          const data = await response.json();
          setContextSwitches(data.context_switches || 0);
        }
      } catch (error) {
        console.error('Failed to fetch context switches:', error);
      }
    };

    // Fetch immediately
    fetchContextSwitches();

    // Poll every 5 seconds for updates
    const interval = setInterval(fetchContextSwitches, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fetch success probability from backend
  useEffect(() => {
    const fetchSuccessProbability = async () => {
      try {
        // Get user from localStorage
        const authData = localStorage.getItem('auth_user');
        let userId = '';

        if (authData) {
          const user = JSON.parse(authData);
          userId = user.id || '';
        }

        const response = await fetch(
          `http://localhost:14200/api/probability/calculate?user_id=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          const prob = data.probability;
          setSuccessProbability(Math.round(prob.score * 100));
          setProbabilityExplanation(prob.explanation || '');
        }
      } catch (error) {
        console.error('Failed to fetch success probability:', error);
      }
    };

    // Fetch immediately
    fetchSuccessProbability();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchSuccessProbability, 30000);

    return () => clearInterval(interval);
  }, []);

  // Initialize user and load their goal on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Get user from localStorage (set during Google OAuth login)
        const authData = localStorage.getItem('auth_user');
        if (!authData) {
          console.log('No auth data found');
          return;
        }

        const user = JSON.parse(authData);
        const userId = user.id;

        if (userId) {
          console.log('Initializing user:', userId);

          // Set user in backend (loads historical metrics)
          await fetch('http://localhost:14200/api/user/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
          });

          // Load user's current goal from database
          const response = await fetch(
            `http://localhost:14200/api/goals/current?user_id=${userId}`
          );
          if (response.ok) {
            const data = await response.json();
            console.log('Goal data:', data);
            if (data.goal) {
              setCurrentGoal(data.goal.goal_text);
              setCurrentTimeframe(data.goal.timeframe as Timeframe);
              console.log('Loaded goal:', data.goal.goal_text);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize user:', error);
      }
    };

    initializeUser();
  }, []);

  // Load Smart Nudge settings
  useEffect(() => {
    const loadNudgeSettings = async () => {
      try {
        const authData = localStorage.getItem('auth_user');
        if (authData) {
          const user = JSON.parse(authData);
          const response = await fetch(
            `http://localhost:14200/api/nudge/settings?user_id=${user.id}`
          );
          if (response.ok) {
            const data = await response.json();
            setSmartNudgeEnabled(data.enabled);
          }
        }
      } catch (error) {
        console.error('Failed to load nudge settings:', error);
      }
    };

    loadNudgeSettings();
  }, []);

  // Check for nudges when Smart Nudge is enabled
  useEffect(() => {
    if (!smartNudgeEnabled) return;

    const checkNudge = async () => {
      try {
        const authData = localStorage.getItem('auth_user');
        if (!authData) return;

        const user = JSON.parse(authData);
        const response = await fetch(
          `http://localhost:14200/api/nudge/check?user_id=${user.id}`
        );

        if (response.ok) {
          const data = await response.json();
          const nudge = data.nudge;

          if (nudge.nudge_needed) {
            // Show desktop notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(nudge.title, {
                body: nudge.message,
                icon: '/icon.png'
              });
            } else if ('Notification' in window && Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification(nudge.title, {
                    body: nudge.message,
                    icon: '/icon.png'
                  });
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to check nudge:', error);
      }
    };

    // Check immediately
    checkNudge();

    // Poll every 5 minutes
    const interval = setInterval(checkNudge, 300000);

    return () => clearInterval(interval);
  }, [smartNudgeEnabled]);

  const handleSmartNudgeToggle = async (enabled: boolean) => {
    setSmartNudgeEnabled(enabled);

    try {
      const authData = localStorage.getItem('auth_user');
      if (authData) {
        const user = JSON.parse(authData);
        await fetch('http://localhost:14200/api/nudge/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            enabled: enabled
          })
        });
        console.log(`Smart Nudge ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Failed to update nudge settings:', error);
    }
  };

  const handleGoalSubmit = async (goal: string, timeframe: Timeframe) => {
    setCurrentGoal(goal);
    setCurrentTimeframe(timeframe);

    try {
      // Get user from localStorage
      const authData = localStorage.getItem('auth_user');
      if (authData) {
        const user = JSON.parse(authData);
        const userId = user.id;

        console.log('Saving goal for user:', userId);

        // Save goal to local database (also triggers LLM analysis)
        const response = await fetch('http://localhost:14200/api/goals/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            goal: goal,
            timeframe: timeframe
          })
        });

        if (response.ok) {
          console.log('Goal saved successfully');
        }
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
    }

    trackButtonClick('set_goal', { goal, timeframe });
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
      {/* Smart Nudge Toggle */}
      <div style={{ marginBottom: '2rem' }}>
        <SmartNudgeToggle
          enabled={smartNudgeEnabled}
          onToggle={handleSmartNudgeToggle}
        />
      </div>

      <GoalInput onGoalSubmit={handleGoalSubmit} />

      <MetricsOverview
        currentGoal={currentGoal}
        focusTime={focusTime}
        activityCount={activityCount}
        contextSwitches={contextSwitches}
        successProbability={successProbability}
        probabilityExplanation={probabilityExplanation}
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

