interface MetricsOverviewProps {
  currentGoal: string | null;
  focusTime: number; // in minutes
  activityCount: number;
  contextSwitches: number;
  successProbability: number | null;
  probabilityExplanation: string;
}

export function MetricsOverview({ currentGoal, focusTime, activityCount, contextSwitches, successProbability, probabilityExplanation }: MetricsOverviewProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProbabilityColor = (prob: number | null) => {
    if (prob === null) return '#888';
    if (prob < 30) return '#ef4444'; // red
    if (prob < 60) return '#f59e0b'; // orange
    return '#10b981'; // green
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

      {/* Success Probability - Large Prominent Card */}
      {successProbability !== null && (
        <div style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, #1a1d29 0%, #252936 100%)',
          borderRadius: '1rem',
          border: `2px solid ${getProbabilityColor(successProbability)}`,
          marginBottom: '1.5rem',
          textAlign: 'center',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Success Probability
          </div>
          <div style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            color: getProbabilityColor(successProbability),
            marginBottom: '0.5rem',
            lineHeight: 1
          }}>
            {successProbability}%
          </div>
          <div style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', fontWeight: '500' }}>
            {currentGoal ? `Chance to ${currentGoal.toLowerCase()}` : 'Chance to achieve your goal'}
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: '#aaa',
            fontStyle: 'italic',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.5
          }}>
            Based on your browsing activity and behavior patterns
          </div>
          {probabilityExplanation && (
            <details style={{ marginTop: '1rem', textAlign: 'left' }}>
              <summary style={{
                cursor: 'pointer',
                color: '#888',
                fontSize: '0.85rem',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                background: '#1a1d29',
                userSelect: 'none'
              }}>
                View detailed explanation
              </summary>
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                background: '#1a1d29',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                color: '#ccc',
                lineHeight: 1.6
              }}>
                {probabilityExplanation}
              </div>
            </details>
          )}
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

        <div style={{
          padding: '1rem',
          background: '#1a1d29',
          borderRadius: '0.5rem',
          border: '1px solid #3a3d4a',
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
            Context Switches
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f59e0b' }}>
            {contextSwitches}
          </div>
        </div>
      </div>
    </div>
  );
}
