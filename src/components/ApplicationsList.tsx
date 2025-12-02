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
    <div className="bg-zinc-900 p-6 rounded-xl mb-8 border border-zinc-800 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Installed Applications</h2>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 placeholder-zinc-600"
          />
          <button
            onClick={loadApplications}
            disabled={isLoading}
            className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">
          Loading applications...
        </div>
      ) : (
        <>
          <div className="mb-4 text-zinc-500 text-sm">
            Found {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          <div className="max-h-[600px] overflow-y-auto border border-zinc-800 rounded-lg bg-zinc-950 custom-scrollbar">
            {filteredApplications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                No applications found
              </div>
            ) : (
              <div className="grid gap-2 p-2">
                {filteredApplications.map((app, index) => (
                  <div
                    key={index}
                    className="p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-all flex justify-between items-center group"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="font-medium text-white mb-1 truncate">
                        {app.name}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono truncate group-hover:text-zinc-400 transition-colors">
                        {app.path}
                      </div>
                    </div>
                    {app.platform && (
                      <div className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-medium whitespace-nowrap">
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

