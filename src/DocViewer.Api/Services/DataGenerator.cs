using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using DocViewer.Api.Hubs;
using DocViewer.Domain.Entities;

namespace DocViewer.Api.Services;

public class DataGenerator
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DataGenerator> _logger;
    private readonly IHubContext<DocumentHub> _hubContext;

    public DataGenerator(
        IConfiguration configuration,
        ILogger<DataGenerator> logger,
        IHubContext<DocumentHub> hubContext)
    {
        _configuration = configuration;
        _logger = logger;
        _hubContext = hubContext;
    }

    public async Task<List<Document>> GenerateDocumentsAsync(int count, string channel = "fax")
    {
        var documents = new List<Document>();

        for (int i = 0; i < count; i++)
        {
            var document = new Document
            {
                Id = $"{channel}/2026/03/generated-{i:D8}",
                FileName = $"document-{i:D8}.txt",
                FilePath = $"{channel}/2026/03/generated-{i:D8}.txt",
                Channel = channel,
                Client = channel,
                Year = 2026,
                Month = "03",
                Date = DateTime.Now.AddDays(-i),
                Sender = $"sender{i % 100}@example.com",
                clientName = $"Client {i % 50}",
                Subject = $"Generated Document {i}",
                Content = $"This is test content for document {i}. " +
                          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
                          "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            };

            documents.Add(document);

            // Broadcast progress every 100 documents or at completion
            if ((i + 1) % 100 == 0 || i + 1 == count)
            {
                await BroadcastProgressAsync(i + 1, count);
            }
        }

        return documents;
    }

    private async Task BroadcastProgressAsync(int generated, int total)
    {
        await _hubContext.Clients.All.SendAsync("IndexingProgress", new
        {
            DocumentsGenerated = generated,
            TotalDocuments = total,
            IsComplete = generated >= total
        });

        _logger.LogInformation("Broadcast progress: {Generated}/{Total} ({Percent}%)",
            generated, total, (generated * 100 / total));
    }
}