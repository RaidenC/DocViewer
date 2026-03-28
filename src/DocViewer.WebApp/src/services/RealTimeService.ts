import { HubConnectionBuilder, HubConnectionState, LogLevel, HubConnection, HttpTransportType } from '@microsoft/signalr';
import { useEffect, useState, useRef } from 'react';

export interface IndexingProgress {
  documentsGenerated: number;
  totalDocuments: number;
  isComplete: boolean;
}

export interface SearchActivity {
  user: string;
  query: string;
  results: number;
  timestamp: string;
}

// Use local API URL for development/CI, tai-portal gateway for production
const HUB_URL = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5155/hubs/documents';

export function useRealTime() {
  const connectionRef = useRef<HubConnection | null>(null);
  const [progress, setProgress] = useState<IndexingProgress | null>(null);
  const [activityFeed, setActivityFeed] = useState<SearchActivity[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<HubConnectionState>(HubConnectionState.Disconnected);

  useEffect(() => {
    const hubConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
        skipNegotiation: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connectionRef.current = hubConnection;

    // Listen for indexing progress
    hubConnection.on('IndexingProgress', (data: IndexingProgress) => {
      setProgress(data);
    });

    // Listen for search activity
    hubConnection.on('SearchPerformed', (data: SearchActivity) => {
      setActivityFeed(prev => [data, ...prev].slice(0, 50)); // Keep last 50
    });

    hubConnection.onreconnecting(() => setConnectionStatus(HubConnectionState.Reconnecting));
    hubConnection.onreconnected(() => setConnectionStatus(HubConnectionState.Connected));
    hubConnection.onclose(() => setConnectionStatus(HubConnectionState.Disconnected));

    hubConnection.start()
      .then(() => setConnectionStatus(HubConnectionState.Connected))
      .catch(err => console.error('SignalR connection failed:', err));

    return () => {
      hubConnection.stop();
    };
  }, []);

  const broadcastSearch = async (query: string, results: number) => {
    if (connectionRef.current?.state === HubConnectionState.Connected) {
      await connectionRef.current.invoke('BroadcastSearch', query, results);
    }
  };

  return {
    connectionStatus,
    progress,
    activityFeed,
    broadcastSearch
  };
}