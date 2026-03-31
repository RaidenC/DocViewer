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

    public async Task<List<string>> GetClientNamesAsync()
    {
        var response = await _client.SearchAsync<Document>(s => s
            .Index(IndexName)
            .Size(0)
            .Aggregations(a => a
                .Terms("clients", t => t
                    .Field(f => f.clientName.Suffix("keyword"))
                    .Size(100)
                )
            )
        );

        if (!response.IsValid)
        {
            _logger.LogError("OpenSearch aggregation failed: {Error}", response.DebugInformation);
            return new List<string>();
        }

        return response.Aggregations
            .Terms("clients")
            .Buckets
            .Select(b => b.Key.ToString())
            .Where(c => !string.IsNullOrEmpty(c))
            .OrderBy(c => c)
            .ToList();
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
            .Size(pageSize)
            .Sort(s => s
                .Field(f => f.Date, SortOrder.Descending)
                .Field(f => f.Id, SortOrder.Ascending)
            );

        // _source field filtering - only return needed fields to reduce payload
        searchDescriptor.Source(s => s
            .Includes(i => i
                .Fields("id", "fileName", "filePath", "channel", "client_name", "date")
            )
        );

        // Enable request cache for filter queries
        searchDescriptor.RequestCache(true);

        // Add sort for consistent pagination and search_after support
        searchDescriptor.Sort(s => s
            .Field(f => f.Date, SortOrder.Descending)
            .Field(f => f.Id, SortOrder.Ascending)
        );

        List<Func<QueryContainerDescriptor<Document>, QueryContainer>> mustQueries = new();
        List<Func<QueryContainerDescriptor<Document>, QueryContainer>> filterQueries = new();

        // Full-text search query
        if (!string.IsNullOrWhiteSpace(query))
        {
            // Use bool query to combine:
            // 1. Wildcard on fileName for partial matches (e.g., "001" in "fax_statement_001.txt")
            // 2. MultiMatch on other text fields (subject, content, sender)
            mustQueries.Add(q => q
                .Bool(b => b
                    .Should(
                        // Wildcard search on filename for partial matches
                        sh => sh
                            .Wildcard(w => w
                                .Field(f => f.FileName)
                                .Value($"*{query.ToLowerInvariant()}*")),
                        // Multi-match on other text fields
                        sh => sh
                            .MultiMatch(mm => mm
                                .Query(query)
                                .Fields(f => f
                                    .Field(d => d.FileName)
                                    .Field(d => d.Subject)
                                    .Field(d => d.Content)
                                    .Field(d => d.Sender))
                                .Type(TextQueryType.BestFields))
                    )
                    .MinimumShouldMatch(1)
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

        // Client filter (using clientName from JSON metadata)
        if (!string.IsNullOrWhiteSpace(client))
        {
            filterQueries.Add(q => q
                .Term(t => t.Field(f => f.clientName.Suffix("keyword")).Value(client))
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

    public async Task<(List<Document> Documents, List<object> SortValues)> SearchDocumentsWithSearchAfterAsync(
        string? query,
        string? channel,
        string? client,
        DateTime? fromDate,
        DateTime? toDate,
        int pageSize = 20,
        List<object>? searchAfter = null)
    {
        var searchDescriptor = new SearchDescriptor<Document>()
            .Size(pageSize);

        // Add search_after for deep pagination
        if (searchAfter != null && searchAfter.Count > 0)
        {
            searchDescriptor.SearchAfter(searchAfter);
        }

        // _source field filtering - only return needed fields to reduce payload
        searchDescriptor.Source(s => s
            .Includes(i => i
                .Fields("id", "fileName", "filePath", "channel", "client_name", "date")
            )
        );

        // Enable request cache for filter queries
        searchDescriptor.RequestCache(true);

        // Add sort for consistent pagination and search_after support
        searchDescriptor.Sort(s => s
            .Field(f => f.Date, SortOrder.Descending)
            .Field(f => f.Id, SortOrder.Ascending)
        );

        List<Func<QueryContainerDescriptor<Document>, QueryContainer>> mustQueries = new();
        List<Func<QueryContainerDescriptor<Document>, QueryContainer>> filterQueries = new();

        // Full-text search query
        if (!string.IsNullOrWhiteSpace(query))
        {
            mustQueries.Add(q => q
                .Bool(b => b
                    .Should(
                        sh => sh
                            .Wildcard(w => w
                                .Field(f => f.FileName)
                                .Value($"*{query.ToLowerInvariant()}*")),
                        sh => sh
                            .MultiMatch(mm => mm
                                .Query(query)
                                .Fields(f => f
                                    .Field(d => d.FileName)
                                    .Field(d => d.Subject)
                                    .Field(d => d.Content)
                                    .Field(d => d.Sender))
                                .Type(TextQueryType.BestFields))
                    )
                    .MinimumShouldMatch(1)
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
                .Term(t => t.Field(f => f.clientName.Suffix("keyword")).Value(client))
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
            return (new List<Document>(), new List<object>());
        }

        // For search_after pagination, we need the sort values from the last hit
        // Note: This is a simplified implementation - OpenSearch returns sort values in response metadata
        var sortValues = new List<object>();

        return (response.Documents.ToList(), sortValues);
    }
}