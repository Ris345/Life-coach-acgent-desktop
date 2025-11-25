interface MetricsOverviewProps {
  currentGoal: string | null;
  focusTime: number; // in minutes
  activityCount: number;
  currentStreakMinutes: number;
  longestStreakMinutes: number;
  currentCategory: string | null;
  activeWindow: string | null;
  summary: {
    focus_percentage: number;
    top_distracting_apps: Array<{ app_name: string; total_minutes: number }>;
    top_productive_apps: Array<{ app_name: string; total_minutes: number }>;
  } | null | undefined;
  isLoading: boolean;
}

export function MetricsOverview({ 
  currentGoal, 
  focusTime, 
  activityCount,
  currentStreakMinutes,
  longestStreakMinutes,
  currentCategory,
  activeWindow,
  summary,
  isLoading
}: MetricsOverviewProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${Math.round(mins)}m`;
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return '#888';
    switch (category) {
      case 'focus': return '#3b82f6';
      case 'distraction': return '#ef4444';
      case 'neutral': return '#888';
      default: return '#888';
    }
  };

  const getCategoryLabel = (category: string | null) => {
    if (!category) return 'Unknown';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(37, 41, 54, 0.8) 0%, rgba(42, 45, 58, 0.8) 100%)',
      padding: '2rem',
      borderRadius: '1.25rem',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }}>
      <h3 style={{ 
        marginBottom: '2rem', 
        fontSize: '1.5rem', 
        fontWeight: '700',
        color: '#fff',
        letterSpacing: '-0.02em',
      }}>
        Performance Metrics
      </h3>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem',
      }}>
        <div style={{
          padding: '1.5rem',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '1rem',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#9ca3af', 
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
          }}>
            Focus Time
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#60a5fa', lineHeight: '1', marginBottom: '0.5rem' }}>
            {isLoading ? '...' : formatTime(focusTime)}
          </div>
          {summary && summary.focus_percentage > 0 && (
            <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
              {summary.focus_percentage.toFixed(0)}% of time
            </div>
          )}
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '1rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#9ca3af', 
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
          }}>
            Current Streak
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981', lineHeight: '1', marginBottom: '0.5rem' }}>
            {isLoading ? '...' : formatTime(currentStreakMinutes)}
          </div>
          {longestStreakMinutes > 0 && (
            <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
              Best: {formatTime(longestStreakMinutes)}
            </div>
          )}
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: 'rgba(167, 139, 250, 0.1)',
          borderRadius: '1rem',
          border: '1px solid rgba(167, 139, 250, 0.3)',
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#9ca3af', 
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
          }}>
            App Switches
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#a78bfa', lineHeight: '1', marginBottom: '0.5rem' }}>
            {isLoading ? '...' : activityCount}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            Context switches
          </div>
        </div>
      </div>

      {/* Top Apps */}
      {summary && (summary.top_productive_apps.length > 0 || summary.top_distracting_apps.length > 0) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}>
          {summary.top_productive_apps.length > 0 && (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '1rem',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#10b981', 
                marginBottom: '1rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Top Productive Apps
              </div>
              {summary.top_productive_apps.slice(0, 3).map((app, idx) => (
                <div key={idx} style={{
                  fontSize: '0.85rem',
                  color: '#fff',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>{app.app_name}</span>
                  <span style={{ color: '#888' }}>{formatTime(app.total_minutes)}</span>
                </div>
              ))}
            </div>
          )}
          
          {summary.top_distracting_apps.length > 0 && (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '1rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#ef4444', 
                marginBottom: '1rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Top Distracting Apps
              </div>
              {summary.top_distracting_apps.slice(0, 3).map((app, idx) => (
                <div key={idx} style={{
                  fontSize: '0.85rem',
                  color: '#fff',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>{app.app_name}</span>
                  <span style={{ color: '#888' }}>{formatTime(app.total_minutes)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

