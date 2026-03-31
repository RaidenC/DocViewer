import { useRealTime } from '../services/RealTimeService';

export default function LiveProgress() {
  const { progress, connectionStatus } = useRealTime();

  if (!progress || progress.isComplete) {
    return null;
  }

  const percentage = Math.round((progress.documentsGenerated / progress.totalDocuments) * 100);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-blue-800">Indexing in Progress</h3>
        <span className={`text-xs px-2 py-1 rounded ${
          connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {connectionStatus}
        </span>
      </div>

      <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-sm text-blue-600">
        <span>{progress.documentsGenerated.toLocaleString()} / {progress.totalDocuments.toLocaleString()}</span>
        <span>{percentage}%</span>
      </div>
    </div>
  );
}