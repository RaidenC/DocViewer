using DocViewer.Application.Interfaces;
using DocViewer.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace DocViewer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly IFileSystemService _fileSystemService;
    private readonly ISearchService _searchService;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(
        IFileSystemService fileSystemService,
        ISearchService searchService,
        ILogger<DocumentsController> logger)
    {
        _fileSystemService = fileSystemService;
        _searchService = searchService;
        _logger = logger;
    }

    /// <summary>
    /// Get directory tree structure
    /// </summary>
    [HttpGet("tree")]
    public async Task<IActionResult> GetTree([FromQuery] string? path = null)
    {
        try
        {
            var tree = await _fileSystemService.GetDirectoryTreeAsync(path ?? "");
            return Ok(tree);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Access denied for path: {Path}", path);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tree for path: {Path}", path);
            return StatusCode(500, new { error = "Failed to retrieve directory tree" });
        }
    }

    /// <summary>
    /// Search documents with filters
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? channel,
        [FromQuery] string? client,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var documents = await _searchService.SearchDocumentsAsync(
                q, channel, client, fromDate, toDate, page, pageSize);

            return Ok(documents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Search error");
            return StatusCode(500, new { error = "Search failed" });
        }
    }

    /// <summary>
    /// Get file content for preview
    /// </summary>
    [HttpGet("{id}/preview")]
    public async Task<IActionResult> GetPreview(string id)
    {
        try
        {
            // Decode the id which is the file path
            var decodedPath = Uri.UnescapeDataString(id);
            var stream = await _fileSystemService.GetFileContentAsync(decodedPath);

            var extension = Path.GetExtension(decodedPath).ToLowerInvariant();
            var contentType = extension switch
            {
                ".txt" => "text/plain",
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                _ => "application/octet-stream"
            };

            return File(stream, contentType);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { error = "File not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting preview for: {Id}", id);
            return StatusCode(500, new { error = "Failed to retrieve file" });
        }
    }

    /// <summary>
    /// Get document metadata
    /// </summary>
    [HttpGet("{id}/metadata")]
    public async Task<IActionResult> GetMetadata(string id)
    {
        try
        {
            var decodedPath = Uri.UnescapeDataString(id);
            var metadata = await _fileSystemService.GetDocumentMetadataAsync(decodedPath);

            if (metadata == null)
            {
                return NotFound(new { error = "Metadata not found" });
            }

            return Ok(metadata);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting metadata for: {Id}", id);
            return StatusCode(500, new { error = "Failed to retrieve metadata" });
        }
    }

    /// <summary>
    /// Get unique client names
    /// </summary>
    [HttpGet("clients")]
    public async Task<ActionResult<List<string>>> GetClients()
    {
        try
        {
            var clients = await _searchService.GetClientNamesAsync();
            return Ok(clients);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get clients");
            return StatusCode(500, "Failed to retrieve clients");
        }
    }
}