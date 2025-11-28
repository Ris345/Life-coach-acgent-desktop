import { useState } from 'react';
import { trackButtonClick } from '../utils/analytics';

export type Timeframe = 'day' | 'week' | 'month';

interface GoalInputProps {
  onGoalSubmit: (goal: string, timeframe: Timeframe) => void;
}

export function GoalInput({ onGoalSubmit }: GoalInputProps) {
  const [goal, setGoal] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('week');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim()) {
      // Track button click
      trackButtonClick('set_goal_button', {
        timeframe: timeframe,
      });
      
      onGoalSubmit(goal.trim(), timeframe);
      setGoal('');
    }
  };

  return (
    <div style={{
      background: '#252936',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      marginBottom: '1.5rem',
    }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
        Set Your Goal
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What do you want to achieve?"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.75rem',
              background: '#1a1d29',
              border: '1px solid #3a3d4a',
              borderRadius: '0.5rem',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Timeframe:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
              style={{
                padding: '0.5rem 0.75rem',
                background: '#1a1d29',
                border: '1px solid #3a3d4a',
                borderRadius: '0.5rem',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <button
            type="submit"
            style={{
              padding: '0.5rem 1.5rem',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            Set Goal
          </button>
        </div>
      </form>
    </div>
  );
}

