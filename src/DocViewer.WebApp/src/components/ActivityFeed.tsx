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
        <div className="inline-flex items-center">
          <span className="text-indigo-600 text-xs">⚡</span>
          <span className="font-semibold text-slate-700 text-sm ml-1">Live Activity</span>
        </div>
        <div className="inline-flex items-center">
          <span className={`w-2 h-2 rounded-full ${connectionStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs font-medium text-slate-500 ml-1">
            {connectionStatus === 'Connected' ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {activityFeed.length === 0 ? (
        <div className="text-center py-4">
          <span className="text-2xl text-slate-300 block mb-2">📭</span>
          <p className="text-xs text-slate-500">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {activityFeed.map((activity, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 text-xs p-1.5 bg-white rounded border border-slate-100 ${
                index === 0 ? 'animate-in slide-in-from-left-2 fade-in' : ''
              }`}
            >
              <span className="text-slate-400 text-sm">🔍</span>
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