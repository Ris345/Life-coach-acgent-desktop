interface MetricsOverviewProps {
  currentGoal: string | null;
  focusTime: number; // in minutes
  activityCount: number;
}

export function MetricsOverview({ currentGoal, focusTime, activityCount }: MetricsOverviewProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div style={{
      background: '#252936',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      marginBottom: '1.5rem',
    }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
        Overview
      </h3>
      
      {currentGoal ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
            Current Goal
          </div>
          <div style={{
            padding: '0.75rem',
            background: '#1a1d29',
            borderRadius: '0.5rem',
            border: '1px solid #3a3d4a',
            fontSize: '0.95rem',
            color: '#fff',
          }}>
            {currentGoal}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '0.75rem',
          background: '#1a1d29',
          borderRadius: '0.5rem',
          border: '1px solid #3a3d4a',
          fontSize: '0.9rem',
          color: '#888',
          marginBottom: '1.5rem',
          fontStyle: 'italic',
        }}>
          No goal set yet
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{
          padding: '1rem',
          background: '#1a1d29',
          borderRadius: '0.5rem',
          border: '1px solid #3a3d4a',
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
            Focus Time
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#3b82f6' }}>
            {formatTime(focusTime)}
          </div>
        </div>
        
        <div style={{
          padding: '1rem',
          background: '#1a1d29',
          borderRadius: '0.5rem',
          border: '1px solid #3a3d4a',
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
            Activities
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
            {activityCount}
          </div>
        </div>
      </div>
    </div>
  );
}

