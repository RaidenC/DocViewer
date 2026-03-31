# Real-Time Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time features to DocViewer using SignalR (Phase 1). Auth integration with tai-portal will be implemented later (feature flag).

**Architecture:** React app connects to tai-portal's existing NotificationHub at `/hubs/notifications`. DocViewer broadcasts indexing progress and receives search activity updates.

**Tech Stack:** React 19, SignalR (microsoft/signalr), .NET 10

---

## File Structure

| Component | File | Responsibility |
|-----------|------|-----------------|
| Backend | `src/DocViewer.Api/Hubs/DocumentHub.cs` | SignalR hub for DocViewer events |
| Backend | `src/DocViewer.Api/Program.cs` | Register SignalR and CORS |
| Backend | `src/DocViewer.Infrastructure/Services/DataGenerator.cs` | Broadcast progress via SignalR |
| Frontend | `src/DocViewer.WebApp/src/services/RealTimeService.ts` | SignalR client wrapper |
| Frontend | `src/DocViewer.WebApp/src/components/ActivityFeed.tsx` | Show search activity |
| Frontend | `src/DocViewer.WebApp/src/components/LiveProgress.tsx` | Show indexing progress |

---

## Task 1: Add SignalR Hub to DocViewer API

**Files:**
- Create: `src/DocViewer.Api/Hubs/DocumentHub.cs`
- Modify: `src/DocViewer.Api/Program.cs`

- [ ] **Step 1: Create DocumentHub**

Create `src/DocViewer.Api/Hubs/DocumentHub.cs`:

```csharp
using Microsoft.AspNetCore.SignalR;

namespace DocViewer.Api.Hubs;

public class DocumentHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.Identity?.Name ?? "anonymous";
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Broadcast search activity to all connected clients
    /// </summary>
    public async Task BroadcastSearch(string query, int resultCount)
    {
        var user = Context.User?.Identity?.Name ?? "Anonymous";
        await Clients.All.SendAsync("SearchPerformed", new
        {
            User = user,
            Query = query,
            Results = resultCount,
            Timestamp = DateTime.UtcNow
        });
    }
}
```

- [ ] **Step 2: Register SignalR in Program.cs**

Modify `src/DocViewer.Api/Program.cs`:

```csharp
// Add SignalR
builder.Services.AddSignalR();

// Add CORS for tai-portal connection
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5217")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// In app.UseEndpoints()
app.MapHub<DocumentHub>("/hubs/documents");
```

- [ ] **Step 3: Commit**

```bash
git add src/DocViewer.Api/Hubs/ src/DocViewer.Api/Program.cs
git commit -m "feat: add SignalR hub for real-time features"
```

---

## Task 2: Broadcast Indexing Progress from DataGenerator

**Files:**
- Modify: `src/DocViewer.Infrastructure/Services/DataGenerator.cs`

- [ ] **Step 1: Inject IHubContext into DataGenerator**

Modify constructor and add:

```csharp
private readonly IHubContext<DocumentHub> _hubContext;

public DataGenerator(IConfiguration configuration, ILogger<DataGenerator> logger, IHubContext<DocumentHub> hubContext)
{
    // existing code...
    _hubContext = hubContext;
}
```

- [ ] **Step 2: Broadcast progress during generation**

In `GenerateDocumentsAsync`, after updating progress:

```csharp
// Broadcast progress to all connected clients
if (_hubContext != null)
{
    await _hubContext.Clients.All.SendAsync("IndexingProgress", new
    {
        DocumentsGenerated = generated,
        TotalDocuments = count,
        IsComplete = generated >= count
    });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/DocViewer.Infrastructure/Services/DataGenerator.cs
git commit -m "feat: broadcast indexing progress via SignalR"
```

---

## Task 3: Create RealTimeService in React

**Files:**
- Create: `src/DocViewer.WebApp/src/services/RealTimeService.ts`

- [ ] **Step 1: Create RealTimeService**

Create `src/DocViewer.WebApp/src/services/RealTimeService.ts`:

```typescript
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
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

const HUB_URL = 'http://localhost:5217/hubs/documents';

export function useRealTime() {
  const [connection, setConnection] = useState<any>(null);
  const [progress, setProgress] = useState<IndexingProgress | null>(null);
  const [activityFeed, setActivityFeed] = useState<SearchActivity[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<HubConnectionState>(HubConnectionState.Disconnected);

  useEffect(() => {
    const hubConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

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

    setConnection(hubConnection);

    return () => {
      hubConnection.stop();
    };
  }, []);

  const broadcastSearch = async (query: string, results: number) => {
    if (connection?.state === HubConnectionState.Connected) {
      await connection.invoke('BroadcastSearch', query, results);
    }
  };

  return {
    connectionStatus,
    progress,
    activityFeed,
    broadcastSearch
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/DocViewer.WebApp/src/services/RealTimeService.ts
git commit -m "feat: add SignalR client service in React"
```

---

## Task 4: Create Live Progress Component

**Files:**
- Create: `src/DocViewer.WebApp/src/components/LiveProgress.tsx`

- [ ] **Step 1: Create LiveProgress component**

Create `src/DocViewer.WebApp/src/components/LiveProgress.tsx`:

```tsx
import { useRealTime, IndexingProgress } from '../services/RealTimeService';

export default function LiveProgress() {
  const { progress, connectionStatus } = useRealTime();

  if (!progress || progress.isComplete) {
    return null;
  }

  const percentage = Math.round((progress.documentsGenerated / progress.totalDocuments) * 100);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-blue-800">🔄 Indexing in Progress</h3>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/DocViewer.WebApp/src/components/LiveProgress.tsx
git commit -m "feat: add live progress component"
```

---

## Task 5: Create Activity Feed Component

**Files:**
- Create: `src/DocViewer.WebApp/src/components/ActivityFeed.tsx`

- [ ] **Step 1: Create ActivityFeed component**

Create `src/DocViewer.WebApp/src/components/ActivityFeed.tsx`:

```tsx
import { useRealTime } from '../services/RealTimeService';

export default function ActivityFeed() {
  const { activityFeed, connectionStatus } = useRealTime();

  if (activityFeed.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-600 mb-2">📊 Activity Feed</h3>
        <p className="text-sm text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">📊 Activity Feed</h3>
        <span className={`text-xs px-2 py-1 rounded ${
          connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
        }`}>
          {connectionStatus}
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activityFeed.map((activity, index) => (
          <div key={index} className="flex items-start gap-2 text-sm p-2 bg-white rounded">
            <span className="text-gray-400">🔍</span>
            <div className="flex-1">
              <span className="font-medium">{activity.user}</span>
              <span className="text-gray-600"> searched </span>
              <span className="font-mono text-blue-600">"{activity.query}"</span>
              <span className="text-gray-400"> → </span>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/DocViewer.WebApp/src/components/ActivityFeed.tsx
git commit -m "feat: add activity feed component"
```

---

## Task 6: Integrate Components in App

**Files:**
- Modify: `src/DocViewer.WebApp/src/App.tsx`

- [ ] **Step 1: Add components to App**

Import and add to the render:

```tsx
import LiveProgress from './components/LiveProgress';
import ActivityFeed from './components/ActivityFeed';

// In the return JSX, add after BenchmarkPanel:
<LiveProgress />
<ActivityFeed />
```

- [ ] **Step 2: Commit**

```bash
git add src/DocViewer.WebApp/src/App.tsx
git commit -m "feat: integrate real-time components in App"
```

---

## Task 7: Broadcast Search from API

**Files:**
- Modify: `src/DocViewer.Api/Controllers/DocumentsController.cs`

- [ ] **Step 1: Inject IHubContext and broadcast searches**

```csharp
private readonly IHubContext<DocumentHub> _hubContext;

public DocumentsController(
    IFileSystemService fileSystemService,
    ISearchService searchService,
    ILogger<DocumentsController> logger,
    IHubContext<DocumentHub> hubContext)
{
    // existing...
    _hubContext = hubContext;
}

// In Search method, after getting results:
if (_hubContext != null && !string.IsNullOrWhiteSpace(q))
{
    await _hubContext.Clients.All.SendAsync("SearchPerformed", new
    {
        User = "User", // Could be from claims in future
        Query = q,
        Results = documents.Count,
        Timestamp = DateTime.UtcNow
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/DocViewer.Api/Controllers/DocumentsController.cs
git commit -m "feat: broadcast search activity via SignalR"
```

---

## Task 8: Final Verification

**Files:**
- N/A

- [ ] **Step 1: Run all tests**

```bash
npx nx run-many -t test
```

- [ ] **Step 2: Run lint**

```bash
npx nx run-many -t lint
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add real-time features with SignalR"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add SignalR Hub to API |
| 2 | Broadcast indexing progress |
| 3 | Create RealTimeService |
| 4 | Create LiveProgress component |
| 5 | Create ActivityFeed component |
| 6 | Integrate in App |
| 7 | Broadcast search activity |
| 8 | Verify and commit |

---

## NEXT: Auth Integration (Phase 2 - Later)

After these real-time features are working, we will implement:

1. Feature flag configuration in appsettings.json
2. Auth middleware that validates JWT from tai-portal
3. Login redirect to tai-portal when auth enabled
4. Role-based access control

This will be a separate implementation plan.