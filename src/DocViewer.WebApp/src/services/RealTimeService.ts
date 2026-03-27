import { HubConnectionBuilder, HubConnectionState, LogLevel, HubConnection } from '@microsoft/signalr';
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

const HUB_URL = 'http://localhost:5217/hubs/documents';

export function useRealTime() {
  const connectionRef = useRef<HubConnection | null>(null);
  const [progress, setProgress] = useState<IndexingProgress | null>(null);
  const [activityFeed, setActivityFeed] = useState<SearchActivity[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<HubConnectionState>(HubConnectionState.Disconnected);

  useEffect(() => {
    const hubConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
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