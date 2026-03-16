using DocViewer.Application.Interfaces;
using DocViewer.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenSearch.Client;
using OpenSearch.Net;

namespace DocViewer.Infrastructure.Services;

public class OpenSearchService : ISearchService
{
    private readonly IOpenSearchClient _client;
    private readonly ILogger<OpenSearchService> _logger;
    private const string IndexName = "documents";

    public OpenSearchService(IConfiguration configuration, ILogger<OpenSearchService> logger)
    {
        _logger = logger;

        var uri = configuration["OpenSearch:Uri"] ?? "http://localhost:9200";
        var settings = new ConnectionSettings(new Uri(uri))
            .DefaultIndex(IndexName)
            .EnableDebugMode();

        _client = new OpenSearchClient(settings);
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var ping = await _client.PingAsync();
            return ping.IsValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenSearch health check failed");
            return false;
        }
    }

    public async Task<List<Document>> SearchDocumentsAsync(
        string? query,
        string? channel,
        string? client,
        DateTime? fromDate,
        DateTime? toDate,
        int page = 1,
        int pageSize = 20)
    {
        var searchDescriptor = new SearchDescriptor<Document>()
            .From((page - 1) * pageSize)
            .Size(pageSize);

        List<Func<QueryContainerDescriptor<Document>, QueryContainer>> mustQueries = new();
        List<Func<QueryContainerDescriptor<Document>, QueryContainer>> filterQueries = new();

        // Full-text search query
        if (!string.IsNullOrWhiteSpace(query))
        {
            mustQueries.Add(q => q
                .MultiMatch(mm => mm
                    .Query(query)
                    .Fields(f => f
                        .Field(d => d.FileName)
                        .Field(d => d.Subject)
                        .Field(d => d.Content)
                        .Field(d => d.Sender))
                    .Type(TextQueryType.BestFields)
                    .Fuzziness(Fuzziness.Auto)
                )
            );
        }

        // Channel filter
        if (!string.IsNullOrWhiteSpace(channel))
        {
            filterQueries.Add(q => q
                .Term(t => t.Field(f => f.Channel).Value(channel.ToLowerInvariant()))
            );
        }

        // Client filter
        if (!string.IsNullOrWhiteSpace(client))
        {
            filterQueries.Add(q => q
                .Term(t => t.Field(f => f.Client).Value(client.ToLowerInvariant()))
            );
        }

        // Date range filter
        if (fromDate.HasValue || toDate.HasValue)
        {
            filterQueries.Add(q => q
                .DateRange(dr => dr
                    .Field(f => f.Date)
                    .GreaterThanOrEquals(fromDate?.ToString("yyyy-MM-dd"))
                    .LessThanOrEquals(toDate?.ToString("yyyy-MM-dd"))
                )
            );
        }

        // Build the query
        if (mustQueries.Count > 0 || filterQueries.Count > 0)
        {
            searchDescriptor.Query(q => q
                .Bool(b =>
                {
                    if (mustQueries.Count > 0)
                        b.Must(mustQueries.ToArray());
                    if (filterQueries.Count > 0)
                        b.Filter(filterQueries.ToArray());
                    return b;
                })
            );
        }
        else
        {
            searchDescriptor.Query(q => q.MatchAll(ma => ma));
        }

        var response = await _client.SearchAsync<Document>(searchDescriptor);

        if (!response.IsValid)
        {
            _logger.LogError("OpenSearch query failed: {Error}", response.DebugInformation);
            return new List<Document>();
        }

        return response.Documents.ToList();
    }

    public async Task IndexDocumentAsync(Document document)
    {
        var response = await _client.IndexAsync(document, i => i.Index(IndexName).Id(document.Id));

        if (!response.IsValid)
        {
            _logger.LogError("Failed to index document {Id}: {Error}", document.Id, response.DebugInformation);
            throw new Exception($"Failed to index document: {response.DebugInformation}");
        }

        _logger.LogInformation("Indexed document: {Id}", document.Id);
    }

    public async Task IndexDocumentsAsync(IEnumerable<Document> documents)
    {
        var docList = documents.ToList();
        if (docList.Count == 0) return;

        var bulkResponse = await _client.BulkAsync(b => b
            .Index(IndexName)
            .IndexMany(docList)
        );

        if (!bulkResponse.IsValid)
        {
            _logger.LogError("Bulk indexing failed: {Error}", bulkResponse.DebugInformation);
            throw new Exception($"Bulk indexing failed: {bulkResponse.DebugInformation}");
        }

        _logger.LogInformation("Indexed {Count} documents", docList.Count);
    }
}