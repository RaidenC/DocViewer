import { useState } from 'react';

interface BenchmarkResult {
  name: string;
  query: string;
  timeMs: number;
  documentsReturned: number;
  improvement?: string;
}

interface BenchmarkData {
  totalDocuments: number;
  tests: BenchmarkResult[];
}

export default function BenchmarkPanel() {
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    try {
      const response = await fetch('/api/benchmark/generate?count=1000000', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setProgress(data.documentsGenerated);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleRunBenchmark = async () => {
    setRunning(true);
    try {
      const response = await fetch('/api/benchmark/run');
      if (response.ok) {
        const data = await response.json();
        setBenchmarkData(data);
      }
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Performance Benchmark</h2>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? `Generating... ${progress.toLocaleString()}` : 'Generate 1M Documents'}
        </button>

        <button
          onClick={handleRunBenchmark}
          disabled={running}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {running ? 'Running Benchmark...' : 'Run Benchmark'}
        </button>
      </div>

      {benchmarkData && (
        <div>
          <h3 className="font-semibold mb-2">Total Documents: {benchmarkData.totalDocuments.toLocaleString()}</h3>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Test</th>
                <th className="border p-2 text-right">Time (ms)</th>
                <th className="border p-2 text-right">Docs</th>
                <th className="border p-2 text-right">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData.tests.map((test, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border p-2">{test.name}</td>
                  <td className="border p-2 text-right font-mono">{test.timeMs}</td>
                  <td className="border p-2 text-right">{test.documentsReturned.toLocaleString()}</td>
                  <td className="border p-2 text-right">
                    {test.improvement ? (
                      <span className="text-green-600 font-semibold">{test.improvement}</span>
                    ) : (
                      <span className="text-gray-400">baseline</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}