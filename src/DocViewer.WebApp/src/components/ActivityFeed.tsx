import { useRealTime } from '../services/RealTimeService';

export default function ActivityFeed() {
  const { activityFeed, connectionStatus } = useRealTime();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-700">Live Activity</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connectionStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs font-medium text-slate-500">
            {connectionStatus === 'Connected' ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {activityFeed.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No recent activity</p>
          <p className="text-xs text-slate-400 mt-1">Searches will appear here in real-time</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {activityFeed.map((activity, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 text-sm p-3 bg-white rounded-lg border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-200 ${
                index === 0 ? 'animate-in slide-in-from-left-2 fade-in' : ''
              }`}
            >
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-medium text-slate-700 truncate">{activity.user}</span>
                  <span className="text-slate-500">searched</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-sm text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={activity.query}>
                    "{activity.query}"
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className={`text-sm font-semibold ${activity.results > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                    {activity.results} {activity.results === 1 ? 'result' : 'results'}
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {formatTime(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}

      {activityFeed.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-400">{activityFeed.length} event{activityFeed.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}