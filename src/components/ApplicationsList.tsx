import { useState, useEffect } from 'react';
import { getInstalledApplications, Application } from '../utils/applications';

export function ApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setIsLoading(true);
      setError(null);
      const apps = await getInstalledApplications();
      setApplications(apps);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredApplications = applications.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      background: '#252936',
      padding: '2rem',
      borderRadius: '0.75rem',
      marginBottom: '2rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Installed Applications</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              background: '#1a1d29',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              width: '250px',
            }}
          />
          <button
            onClick={loadApplications}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#ff4444',
          color: '#fff',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
          Loading applications...
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', color: '#888', fontSize: '0.9rem' }}>
            Found {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
          
          <div style={{
            maxHeight: '600px',
            overflowY: 'auto',
            border: '1px solid #444',
            borderRadius: '0.5rem',
            background: '#1a1d29',
          }}>
            {filteredApplications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                No applications found
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem', padding: '0.5rem' }}>
                {filteredApplications.map((app, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '1rem',
                      background: '#252936',
                      borderRadius: '0.5rem',
                      border: '1px solid #333',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                        {app.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#888', fontFamily: 'monospace' }}>
                        {app.path}
                      </div>
                    </div>
                    {app.platform && (
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        background: '#3b82f6',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#fff',
                      }}>
                        {app.platform}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

