using DocViewer.Application.Interfaces;
using DocViewer.Domain.Entities;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace DocViewer.Infrastructure.Services;

public class DocumentSyncService : BackgroundService
{
    private readonly IFileSystemService _fileSystemService;
    private readonly ISearchService _searchService;
    private readonly ILogger<DocumentSyncService> _logger;
    private readonly TimeSpan _syncInterval = TimeSpan.FromMinutes(5);

    public DocumentSyncService(
        IFileSystemService fileSystemService,
        ISearchService searchService,
        ILogger<DocumentSyncService> logger)
    {
        _fileSystemService = fileSystemService;
        _searchService = searchService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Document sync service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncDocumentsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during document sync");
            }

            await Task.Delay(_syncInterval, stoppingToken);
        }
    }

    public async Task SyncDocumentsAsync()
    {
        _logger.LogInformation("Starting document sync...");

        var dataRoot = _fileSystemService.GetDataRootPath();
        var documents = await ScanAndIndexDocumentsAsync(dataRoot, "");

        _logger.LogInformation("Found {Count} documents to index", documents.Count);

        if (documents.Count > 0)
        {
            await _searchService.IndexDocumentsAsync(documents);
        }

        _logger.LogInformation("Document sync completed");
    }

    private async Task<List<Document>> ScanAndIndexDocumentsAsync(string basePath, string relativePath)
    {
        var documents = new List<Document>();
        var fullPath = Path.Combine(basePath, relativePath);

        if (!Directory.Exists(fullPath))
            return documents;

        // Determine channel from directory name
        var channel = GetChannelFromPath(fullPath, basePath);

        var entries = Directory.GetFileSystemEntries(fullPath);
        foreach (var entry in entries)
        {
            if (Directory.Exists(entry))
            {
                var subRelativePath = Path.GetRelativePath(basePath, entry);
                var subDocs = await ScanAndIndexDocumentsAsync(basePath, subRelativePath);
                documents.AddRange(subDocs);
            }
            else if (Path.GetExtension(entry) != ".json")
            {
                // Skip .json metadata files, only index actual documents
                var docRelativePath = Path.GetRelativePath(basePath, entry);
                var document = await CreateDocumentFromFileAsync(docRelativePath, channel);
                if (document != null)
                {
                    documents.Add(document);
                }
            }
        }

        return documents;
    }

    private async Task<Document?> CreateDocumentFromFileAsync(string relativePath, string channel)
    {
        try
        {
            var parts = relativePath.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

            if (parts.Length < 3) return null;

            var client = parts[0]; // fax, email, scan, ftp
            var year = parts[1];
            var month = parts[2];
            var fileName = Path.GetFileNameWithoutExtension(parts[^1]);

            var metadata = await _fileSystemService.GetDocumentMetadataAsync(relativePath);

            // Read actual file content for indexing
            string content = "";
            try
            {
                using var stream = await _fileSystemService.GetFileContentAsync(relativePath);
                using var reader = new StreamReader(stream);
                content = await reader.ReadToEndAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not read file content for {Path}", relativePath);
            }

            var document = new Document
            {
                Id = relativePath.Replace(Path.DirectorySeparatorChar, '/'),
                FileName = Path.GetFileName(relativePath),
                FilePath = relativePath,
                Channel = channel,
                Client = client,
                Year = int.TryParse(year, out var y) ? y : 0,
                Month = month,
                Date = metadata?.date ?? DateTime.Now,
                Sender = metadata?.sender ?? "",
                Subject = metadata?.subject ?? fileName,
                Content = content
            };

            return document;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create document from {Path}", relativePath);
            return null;
        }
    }

    private string GetChannelFromPath(string fullPath, string basePath)
    {
        var relativePath = Path.GetRelativePath(basePath, fullPath);
        var parts = relativePath.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        if (parts.Length > 0)
        {
            var firstPart = parts[0].ToLowerInvariant();
            return firstPart switch
            {
                "fax" => "fax",
                "email" => "email",
                "scan" => "scan",
                "ftp" => "ftp",
                _ => "unknown"
            };
        }

        return "unknown";
    }
}