import { HubConnectionBuilder, HubConnectionState, LogLevel, HubConnection, HttpTransportType } from '@microsoft/signalr';
import { useEffect, useState } from 'react';

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

// Track if connection already exists to prevent duplicate connections in StrictMode
let globalConnection: HubConnection | null = null;
let isSubscribed = false;

export function useRealTime() {
  const [progress, setProgress] = useState<IndexingProgress | null>(null);
  const [activityFeed, setActivityFeed] = useState<SearchActivity[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<HubConnectionState>(HubConnectionState.Disconnected);

  useEffect(() => {
    // Reuse existing connection if already established
    if (globalConnection && !isSubscribed) {
      isSubscribed = true;

      // Listen for events on existing connection
      globalConnection.on('IndexingProgress', (data: IndexingProgress) => {
        setProgress(data);
      });
      globalConnection.on('SearchPerformed', (data: SearchActivity) => {
        setActivityFeed(prev => [data, ...prev].slice(0, 50));
      });

      globalConnection.onreconnecting(() => setConnectionStatus(HubConnectionState.Reconnecting));
      globalConnection.onreconnected(() => setConnectionStatus(HubConnectionState.Connected));
      globalConnection.onclose(() => setConnectionStatus(HubConnectionState.Disconnected));

      return () => {
        isSubscribed = false;
      };
    }

    if (globalConnection) {
      return; // Already connecting/connected
    }

    const hubConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
        skipNegotiation: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    globalConnection = hubConnection;

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
      // Don't disconnect on cleanup - keep the shared connection
    };
  }, []);

  const broadcastSearch = async (query: string, results: number) => {
    if (globalConnection?.state === HubConnectionState.Connected) {
      await globalConnection.invoke('BroadcastSearch', query, results);
    }
  };

  return {
    connectionStatus,
    progress,
    activityFeed,
    broadcastSearch
  };
}