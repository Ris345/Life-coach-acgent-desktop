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
    <div style={{
      background: '#252936',
      padding: '1.5rem',
      borderRadius: '0.75rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>
          Progress Tracker
        </h3>
        <div style={{ fontSize: '0.9rem', color: '#888' }}>
          {trackedCount} / {totalDays} days
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          width: '100%',
          height: '8px',
          background: '#1a1d29',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: '#10b981',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.85rem',
          color: '#888',
          textAlign: 'right',
        }}>
          {Math.round(progressPercentage)}% complete
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: timeframe === 'month' 
          ? 'repeat(7, 1fr)' 
          : `repeat(${Math.min(totalDays, 7)}, 1fr)`,
        gap: '0.5rem',
      }}>
        {days.map((day, index) => {
          const isTracked = trackedDays.has(index);
          const isTodayDate = isToday(day.date);
          const isPastDate = isPast(day.date);
          
          return (
            <button
              key={index}
              onClick={() => {
                // Track day tracking click
                trackButtonClick('track_day', {
                  day_index: index,
                  is_tracked: isTracked,
                  timeframe: timeframe,
                });
                onTrackDay(index);
              }}
              disabled={isPastDate && !isTracked}
              style={{
                aspectRatio: '1',
                padding: '0.5rem',
                background: isTracked 
                  ? '#10b981' 
                  : isTodayDate 
                    ? '#3b82f6' 
                    : isPastDate
                      ? '#1a1d29'
                      : '#2a2d3a',
                border: isTodayDate ? '2px solid #3b82f6' : '1px solid #3a3d4a',
                borderRadius: '0.5rem',
                color: isTracked || isTodayDate ? '#fff' : '#888',
                cursor: isPastDate && !isTracked ? 'not-allowed' : 'pointer',
                fontSize: timeframe === 'month' ? '0.85rem' : '0.9rem',
                fontWeight: isTodayDate ? '600' : '400',
                transition: 'all 0.2s',
                opacity: isPastDate && !isTracked ? 0.5 : 1,
              }}
              onMouseOver={(e) => {
                if (!(isPastDate && !isTracked)) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.opacity = isPastDate && !isTracked ? 0.5 : 1;
              }}
              title={isTracked ? 'On track ✓' : isTodayDate ? 'Today' : isPastDate ? 'Missed' : 'Click to mark as on track'}
            >
              <div>{day.label}</div>
              {isTracked && <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>✓</div>}
            </button>
          );
        })}
      </div>

      {timeframe === 'month' && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#1a1d29',
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
          color: '#888',
        }}>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ color: '#10b981' }}>■</span> On track
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ color: '#3b82f6' }}>■</span> Today
          </div>
          <div>
            <span style={{ color: '#888' }}>■</span> Missed / Not tracked
          </div>
        </div>
      )}
    </div>
  );
}

