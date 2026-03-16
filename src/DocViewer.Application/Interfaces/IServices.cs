using DocViewer.Domain.Entities;

namespace DocViewer.Application.Interfaces;

public interface IFileSystemService
{
    Task<List<TreeNode>> GetDirectoryTreeAsync(string relativePath);
    Task<Stream> GetFileContentAsync(string relativePath);
    Task<DocumentMetadata?> GetDocumentMetadataAsync(string relativePath);
    string GetDataRootPath();
}

public interface ISearchService
{
    Task<List<Document>> SearchDocumentsAsync(string? query, string? channel, string? client, DateTime? fromDate, DateTime? toDate, int page = 1, int pageSize = 20);
    Task IndexDocumentAsync(Document document);
    Task IndexDocumentsAsync(IEnumerable<Document> documents);
    Task<bool> IsHealthyAsync();
}

public class SearchRequest
{
    public string? Query { get; set; }
    public string? Channel { get; set; }
    public string? Client { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class SearchResult
{
    public List<Document> Documents { get; set; } = new();
    public long TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}