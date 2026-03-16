using DocViewer.Application.Interfaces;
using DocViewer.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging;

namespace DocViewer.Infrastructure.Services;

public class FileSystemService : IFileSystemService
{
    private readonly string _dataRoot;
    private readonly ILogger<FileSystemService> _logger;

    public FileSystemService(IConfiguration configuration, ILogger<FileSystemService> logger)
    {
        _dataRoot = configuration["DataRoot"] ?? Path.Combine(Directory.GetCurrentDirectory(), "data");
        _logger = logger;
    }

    public string GetDataRootPath() => _dataRoot;

    public async Task<List<TreeNode>> GetDirectoryTreeAsync(string relativePath)
    {
        var securePath = GetSecurePath(relativePath);
        var result = new List<TreeNode>();

        if (!Directory.Exists(securePath))
        {
            _logger.LogWarning("Directory not found: {Path}", securePath);
            return result;
        }

        var entries = Directory.GetFileSystemEntries(securePath);
        foreach (var entry in entries.OrderBy(e => e, new FileSystemEntryComparer()))
        {
            var name = Path.GetFileName(entry);
            var relativeEntryPath = Path.GetRelativePath(_dataRoot, entry);

            bool isDirectory = Directory.Exists(entry);
            var node = new TreeNode
            {
                Id = relativeEntryPath.Replace(Path.DirectorySeparatorChar, '/'),
                Name = name,
                Path = relativeEntryPath,
                IsDirectory = isDirectory
            };

            if (isDirectory)
            {
                node.Children = new List<TreeNode>();
            }

            result.Add(node);
        }

        return await Task.FromResult(result);
    }

    public async Task<Stream> GetFileContentAsync(string relativePath)
    {
        var securePath = GetSecurePath(relativePath);

        if (!File.Exists(securePath))
        {
            throw new FileNotFoundException("File not found", relativePath);
        }

        var stream = new FileStream(securePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return await Task.FromResult(stream);
    }

    public async Task<DocumentMetadata?> GetDocumentMetadataAsync(string relativePath)
    {
        var securePath = GetSecurePath(relativePath);
        var directory = Path.GetDirectoryName(securePath);
        var fileNameWithoutExt = Path.GetFileNameWithoutExtension(relativePath);
        var jsonPath = Path.Combine(directory!, $"{fileNameWithoutExt}.json");

        if (!File.Exists(jsonPath))
        {
            _logger.LogWarning("Metadata file not found: {Path}", jsonPath);
            return null;
        }

        var json = await File.ReadAllTextAsync(jsonPath);
        var metadata = System.Text.Json.JsonSerializer.Deserialize<DocumentMetadata>(json);
        return metadata;
    }

    private string GetSecurePath(string relativePath)
    {
        if (string.IsNullOrEmpty(relativePath) || relativePath == "/")
        {
            return _dataRoot;
        }

        // Normalize the path - remove leading slashes and convert to local path format
        var normalizedPath = relativePath.TrimStart('/', '\\');

        // Get full path and validate it doesn't escape the data root
        var fullPath = Path.GetFullPath(Path.Combine(_dataRoot, normalizedPath));

        if (!fullPath.StartsWith(_dataRoot, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogError("Path traversal attempt detected: {Path}", relativePath);
            throw new UnauthorizedAccessException("Access denied: Path traversal detected");
        }

        return fullPath;
    }
}

public class FileSystemEntryComparer : IComparer<string>
{
    public int Compare(string? x, string? y)
    {
        if (x == null && y == null) return 0;
        if (x == null) return -1;
        if (y == null) return 1;

        bool isDirX = Directory.Exists(x);
        bool isDirY = Directory.Exists(y);

        if (isDirX && !isDirY) return -1;
        if (!isDirX && isDirY) return 1;

        return string.Compare(Path.GetFileName(x), Path.GetFileName(y), StringComparison.OrdinalIgnoreCase);
    }
}