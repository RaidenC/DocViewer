import { useRealTime } from '../services/RealTimeService';

export default function ActivityFeed() {
  const { activityFeed, connectionStatus } = useRealTime();

  if (activityFeed.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-600 mb-2">Activity Feed</h3>
        <p className="text-sm text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">Activity Feed</h3>
        <span className={`text-xs px-2 py-1 rounded ${
          connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
        }`}>
          {connectionStatus}
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activityFeed.map((activity, index) => (
          <div key={index} className="flex items-start gap-2 text-sm p-2 bg-white rounded">
            <span className="text-gray-400">search</span>
            <div className="flex-1">
              <span className="font-medium">{activity.user}</span>
              <span className="text-gray-600"> searched </span>
              <span className="font-mono text-blue-600">"{activity.query}"</span>
              <span className="text-gray-400"> </span>
              <span className="text-green-600">{activity.results} results</span>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(activity.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}