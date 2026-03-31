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