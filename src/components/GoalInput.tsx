import { useState } from 'react';

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
      onGoalSubmit(goal.trim(), timeframe);
      setGoal('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ marginBottom: '1rem' }}>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g., Study AWS for 1 hour daily, Build a React app, Write 500 words..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '1rem',
            background: '#1a1d29',
            border: '2px solid #3a3d4a',
            borderRadius: '0.5rem',
            color: '#ffffff',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#3a3d4a'}
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
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
          }}
        >
          Start Tracking →
        </button>
      </div>
    </form>
  );
}
