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
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-700 text-sm">Live Activity</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connectionStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs font-medium text-slate-500">
            {connectionStatus === 'Connected' ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {activityFeed.length === 0 ? (
        <div className="text-center py-4">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-xs text-slate-500">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {activityFeed.map((activity, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 text-xs p-1.5 bg-white rounded border border-slate-100 ${
                index === 0 ? 'animate-in slide-in-from-left-2 fade-in' : ''
              }`}
            >
              <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-slate-700 truncate">{activity.user}</span>
                  <span className="text-slate-500">searched</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded truncate max-w-[60px]" title={activity.query}>
                    "{activity.query}"
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className={`font-semibold ${activity.results > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                    {activity.results}
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
        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-400">{activityFeed.length} events</span>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      )}
    </div>
  );
}