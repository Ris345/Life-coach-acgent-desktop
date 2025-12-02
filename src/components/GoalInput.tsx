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
    <div className="bg-zinc-900 p-6 rounded-xl mb-6 border border-zinc-800 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold text-white">
        Set Your Goal
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What do you want to achieve?"
            className="w-full min-h-[80px] p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y placeholder-zinc-600"
          />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2 items-center">
            <label className="text-sm text-zinc-400">Timeframe:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Set Goal
          </button>
        </div>
      </form>
    </div>
  );
}

