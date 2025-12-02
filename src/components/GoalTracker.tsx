import { Timeframe } from './GoalInput';
import { trackButtonClick } from '../utils/analytics';

interface GoalTrackerProps {
  timeframe: Timeframe;
  onTrackDay: (dayIndex: number) => void;
  trackedDays: Set<number>;
}

export function GoalTracker({ timeframe, onTrackDay, trackedDays }: GoalTrackerProps) {
  const getDaysForTimeframe = (): { label: string; date: Date }[] => {
    const days: { label: string; date: Date }[] = [];
    const today = new Date();

    if (timeframe === 'day') {
      days.push({
        label: 'Today',
        date: today,
      });
    } else if (timeframe === 'week') {
      // Get start of week (Sunday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.push({
          label: dayNames[i],
          date,
        });
      }
    } else if (timeframe === 'month') {
      // Get all days in current month
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        days.push({
          label: i.toString(),
          date,
        });
      }
    }

    return days;
  };

  const days = getDaysForTimeframe();
  const totalDays = days.length;
  const trackedCount = trackedDays.size;
  const progressPercentage = totalDays > 0 ? (trackedCount / totalDays) * 100 : 0;

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          Progress Tracker
        </h3>
        <div className="text-sm text-zinc-400 font-medium">
          {trackedCount} / {totalDays} days
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-zinc-500 text-right font-medium">
          {Math.round(progressPercentage)}% complete
        </div>
      </div>

      <div className={`grid gap-2 ${timeframe === 'month'
          ? 'grid-cols-7'
          : `grid-cols-${Math.min(totalDays, 7)}`
        }`}>
        {days.map((day, index) => {
          const isTracked = trackedDays.has(index);
          const isTodayDate = isToday(day.date);
          const isPastDate = isPast(day.date);

          return (
            <button
              key={index}
              onClick={() => {
                trackButtonClick('track_day', {
                  day_index: index,
                  is_tracked: isTracked,
                  timeframe: timeframe,
                });
                onTrackDay(index);
              }}
              disabled={isPastDate && !isTracked}
              className={`
                aspect-square p-2 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center relative group
                ${isTracked
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                  : isTodayDate
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 ring-2 ring-blue-400/30'
                    : isPastDate
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                }
                ${!(isPastDate && !isTracked) ? 'hover:scale-105' : ''}
              `}
              title={isTracked ? 'On track ✓' : isTodayDate ? 'Today' : isPastDate ? 'Missed' : 'Click to mark as on track'}
            >
              <div className={`text-sm font-medium ${timeframe === 'month' ? 'text-xs' : ''}`}>
                {day.label}
              </div>
              {isTracked && (
                <div className="text-[10px] mt-0.5 font-bold">✓</div>
              )}
            </button>
          );
        })}
      </div>

      {timeframe === 'month' && (
        <div className="mt-4 p-3 bg-zinc-950 rounded-lg text-xs text-zinc-500 flex gap-4 justify-center border border-zinc-800/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.4)]"></span> On track
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_5px_rgba(37,99,235,0.4)]"></span> Today
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700"></span> Missed
          </div>
        </div>
      )}
    </div>
  );
}

