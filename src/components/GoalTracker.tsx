import { useEffect } from 'react';
import { Timeframe } from './GoalInput';

interface GoalTrackerProps {
  timeframe: Timeframe;
  onTrackDay: (dayIndex: number) => void;
  trackedDays: Set<number>;
  dailyComplete?: boolean;
  weeklyProgress?: number;
}

export function GoalTracker({ timeframe, onTrackDay, trackedDays, dailyComplete = false, weeklyProgress = 0 }: GoalTrackerProps) {
  const today = new Date();
  const currentDayIndex = today.getDay();
  
  // Auto-mark day as complete when daily goal is achieved
  // Only auto-mark if we're tracking a week (not day or month)
  useEffect(() => {
    if (dailyComplete && timeframe === 'week' && !trackedDays.has(currentDayIndex)) {
      // Small delay to show the completion state first
      const timer = setTimeout(() => {
        onTrackDay(currentDayIndex);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [dailyComplete, currentDayIndex, trackedDays, onTrackDay, timeframe]);
  
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
  
  // Calculate tracked count
  // For week: use weeklyProgress if available, otherwise trackedDays
  // For day/month: use trackedDays
  let trackedCount: number;
  if (timeframe === 'week' && weeklyProgress > 0) {
    trackedCount = weeklyProgress;
  } else {
    trackedCount = trackedDays.size;
  }
  
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
      background: 'linear-gradient(135deg, rgba(37, 41, 54, 0.8) 0%, rgba(42, 45, 58, 0.8) 100%)',
      padding: '2rem',
      borderRadius: '1.25rem',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      height: 'fit-content',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
      }}>
        <div>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '0.25rem',
            letterSpacing: '-0.02em',
          }}>
            Progress Tracker
          </h3>
          <p style={{
            fontSize: '0.85rem',
            color: '#9ca3af',
            margin: 0,
          }}>
            {timeframe === 'week' ? 'This week' : timeframe === 'month' ? 'This month' : 'Today'}
          </p>
        </div>
        <div style={{
          padding: '0.75rem 1.25rem',
          background: progressPercentage >= 100 
            ? 'rgba(16, 185, 129, 0.1)' 
            : progressPercentage >= 50 
              ? 'rgba(59, 130, 246, 0.1)' 
              : 'rgba(156, 163, 175, 0.1)',
          borderRadius: '0.75rem',
          border: `1px solid ${progressPercentage >= 100 
            ? 'rgba(16, 185, 129, 0.3)' 
            : progressPercentage >= 50 
              ? 'rgba(59, 130, 246, 0.3)' 
              : 'rgba(156, 163, 175, 0.3)'}`,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: progressPercentage >= 100 
              ? '#10b981' 
              : progressPercentage >= 50 
                ? '#60a5fa' 
                : '#9ca3af',
            lineHeight: '1',
            marginBottom: '0.25rem',
          }}>
            {trackedCount}
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
          }}>
            of {totalDays} days
          </div>
        </div>
      </div>

      {/* Progress Bar - More Prominent */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <div style={{ 
            fontSize: '0.85rem', 
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
          }}>
            {timeframe === 'week' ? 'Weekly Progress' : timeframe === 'month' ? 'Monthly Progress' : 'Daily Progress'}
          </div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: progressPercentage >= 100 ? '#10b981' : progressPercentage >= 50 ? '#60a5fa' : '#9ca3af',
          }}>
            {Math.round(progressPercentage)}%
          </div>
        </div>
        <div style={{
          width: '100%',
          height: '16px',
          background: 'rgba(26, 29, 41, 0.5)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: progressPercentage >= 100 
              ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
              : progressPercentage >= 50 
                ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                : 'linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: '8px',
            boxShadow: progressPercentage > 0 
              ? `0 0 12px ${progressPercentage >= 100 
                  ? 'rgba(16, 185, 129, 0.4)' 
                  : progressPercentage >= 50 
                    ? 'rgba(59, 130, 246, 0.4)' 
                    : 'rgba(156, 163, 175, 0.2)'}` 
              : 'none',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {progressPercentage > 0 && progressPercentage < 100 && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite',
              }} />
            )}
          </div>
        </div>
        {dailyComplete && isToday(days[currentDayIndex]?.date) && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.9rem',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '600',
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>✓</span>
            <span>Today's goal completed</span>
          </div>
        )}
      </div>

      {/* Days Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: timeframe === 'month' 
          ? 'repeat(7, 1fr)' 
          : `repeat(${Math.min(totalDays, 7)}, 1fr)`,
        gap: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        {days.map((day, index) => {
          const isTracked = trackedDays.has(index);
          const isTodayDate = isToday(day.date);
          const isPastDate = isPast(day.date);
          
          // Show as complete if:
          // 1. Manually tracked, OR
          // 2. Today and daily goal is complete
          const showAsComplete = isTracked || (isTodayDate && dailyComplete);
          
          return (
            <button
              key={index}
              onClick={() => onTrackDay(index)}
              disabled={isPastDate && !isTracked}
              style={{
                aspectRatio: '1',
                padding: timeframe === 'month' ? '0.5rem' : '1rem',
                background: showAsComplete || isTracked
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : isTodayDate
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)'
                    : isPastDate
                      ? 'rgba(26, 29, 41, 0.5)'
                      : 'rgba(42, 45, 58, 0.5)',
                border: isTodayDate 
                  ? '2px solid #60a5fa' 
                  : (showAsComplete || isTracked)
                    ? '2px solid #10b981'
                    : '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.75rem',
                color: (showAsComplete || isTracked || isTodayDate) ? '#fff' : '#9ca3af',
                cursor: isPastDate && !isTracked ? 'not-allowed' : 'pointer',
                fontSize: timeframe === 'month' ? '0.75rem' : '0.9rem',
                fontWeight: (isTodayDate || isTracked || showAsComplete) ? '700' : '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isPastDate && !isTracked ? 0.5 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: (showAsComplete || isTracked || isTodayDate)
                  ? `0 4px 12px ${showAsComplete || isTracked 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : 'rgba(59, 130, 246, 0.3)'}`
                  : 'none',
                backdropFilter: 'blur(10px)',
              }}
              onMouseOver={(e) => {
                if (!(isPastDate && !isTracked)) {
                  e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                  e.currentTarget.style.boxShadow = showAsComplete || isTracked
                    ? '0 6px 20px rgba(16, 185, 129, 0.4)'
                    : isTodayDate
                      ? '0 6px 20px rgba(59, 130, 246, 0.4)'
                      : '0 4px 12px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = (showAsComplete || isTracked || isTodayDate)
                  ? `0 4px 12px ${showAsComplete || isTracked 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : 'rgba(59, 130, 246, 0.3)'}`
                  : 'none';
              }}
              title={
                showAsComplete 
                  ? 'Goal completed today' 
                  : isTracked 
                    ? 'On track' 
                    : isTodayDate 
                      ? dailyComplete 
                        ? 'Goal completed'
                        : 'Today - Work in progress'
                      : isPastDate 
                        ? 'Missed' 
                        : 'Upcoming'
              }
            >
              <div style={{
                fontSize: timeframe === 'month' ? '0.75rem' : '0.85rem',
                fontWeight: '500',
                marginBottom: (showAsComplete || isTracked) ? '0.25rem' : '0',
              }}>
                {day.label}
              </div>
              {(showAsComplete || isTracked) && (
                <div style={{
                  fontSize: '0.75rem',
                  lineHeight: '1',
                  marginTop: '0.25rem',
                  fontWeight: '700',
                  color: '#fff',
                }}>
                  DONE
                </div>
              )}
              {isTodayDate && !showAsComplete && !isTracked && (
                <div style={{
                  position: 'absolute',
                  bottom: '0.25rem',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend - Show for all timeframes */}
      <div style={{
        padding: '1rem',
        background: 'rgba(26, 29, 41, 0.5)',
        borderRadius: '0.75rem',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.25rem',
        fontSize: '0.8rem',
        color: '#9ca3af',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '0.375rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '2px solid #10b981',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
          }} />
          <span style={{ fontWeight: '500' }}>Completed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '0.375rem',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '2px solid #60a5fa',
            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
          }} />
          <span style={{ fontWeight: '500' }}>Today</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '0.375rem',
            background: 'rgba(42, 45, 58, 0.5)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }} />
          <span style={{ fontWeight: '500' }}>Upcoming</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '0.375rem',
            background: 'rgba(26, 29, 41, 0.5)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            opacity: 0.5,
          }} />
          <span style={{ fontWeight: '500' }}>Missed</span>
        </div>
      </div>
      
      {/* Progress Insight */}
      {progressPercentage > 0 && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: progressPercentage >= 100
            ? 'rgba(16, 185, 129, 0.1)'
            : progressPercentage >= 50
              ? 'rgba(59, 130, 246, 0.1)'
              : 'rgba(167, 139, 250, 0.1)',
          borderRadius: '0.75rem',
          border: `1px solid ${progressPercentage >= 100
            ? 'rgba(16, 185, 129, 0.3)'
            : progressPercentage >= 50
              ? 'rgba(59, 130, 246, 0.3)'
              : 'rgba(167, 139, 250, 0.3)'}`,
        }}>
          <div style={{
            fontSize: '0.85rem',
            color: progressPercentage >= 100
              ? '#10b981'
              : progressPercentage >= 50
                ? '#60a5fa'
                : '#a78bfa',
            fontWeight: '600',
            marginBottom: '0.25rem',
          }}>
            {progressPercentage >= 100 
              ? 'Perfect Week' 
              : progressPercentage >= 75
                ? 'Almost There'
                : progressPercentage >= 50
                  ? 'Halfway There'
                  : 'Keep Going'}
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#9ca3af',
            lineHeight: '1.5',
          }}>
            {progressPercentage >= 100
              ? `You've completed all ${totalDays} days! Amazing consistency!`
              : progressPercentage >= 50
                ? `You're ${Math.round(100 - progressPercentage)}% away from completing your ${timeframe === 'week' ? 'week' : timeframe === 'month' ? 'month' : 'day'}.`
                : `You've completed ${trackedCount} of ${totalDays} days. ${totalDays - trackedCount} more to go!`}
          </div>
        </div>
      )}
    </div>
  );
}

