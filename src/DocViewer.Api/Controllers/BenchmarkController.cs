using DocViewer.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DocViewer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BenchmarkController : ControllerBase
{
    private readonly IDataGenerator _dataGenerator;
    private readonly ISearchService _searchService;
    private readonly ILogger<BenchmarkController> _logger;

    public BenchmarkController(
        IDataGenerator dataGenerator,
        ISearchService searchService,
        ILogger<BenchmarkController> logger)
    {
        _dataGenerator = dataGenerator;
        _searchService = searchService;
        _logger = logger;
    }

    /// <summary>
    /// Generate test documents
    /// </summary>
    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromQuery] int count = 1000000)
    {
        try
        {
            var progress = new Progress<int>(p =>
                _logger.LogInformation("Generated {Count} documents", p));

            var total = await _dataGenerator.GenerateDocumentsAsync(count, progress);
            return Ok(new { documentsGenerated = total });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate documents");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get generation progress
    /// </summary>
    [HttpGet("progress")]
    public async Task<IActionResult> GetProgress()
    {
        var progress = await _dataGenerator.GetProgressAsync();
        return Ok(progress);
    }

    /// <summary>
    /// Run benchmark tests
    /// </summary>
    [HttpGet("run")]
    public async Task<IActionResult> RunBenchmark()
    {
        var results = new List<BenchmarkResult>();
        var stopwatch = new System.Diagnostics.Stopwatch();

        // Test 1: Unfiltered search (match_all)
        stopwatch.Restart();
        var unfiltered = await _searchService.SearchDocumentsAsync(null, null, null, null, null, 1, 10000);
        stopwatch.Stop();
        var unfilteredTime = stopwatch.ElapsedMilliseconds;
        results.Add(new BenchmarkResult
        {
            Name = "Unfiltered Search",
            Query = "{ \"match_all\": {} }",
            TimeMs = unfilteredTime,
            DocumentsReturned = unfiltered.Count
        });

        // Test 2: Single filter (channel)
        stopwatch.Restart();
        var singleFilter = await _searchService.SearchDocumentsAsync(null, "fax", null, null, null, 1, 10000);
        stopwatch.Stop();
        var singleFilterTime = stopwatch.ElapsedMilliseconds;
        var singleFilterImprovement = unfilteredTime > 0
            ? Math.Round((1 - (double)singleFilterTime / unfilteredTime) * 100, 1)
            : 0;
        results.Add(new BenchmarkResult
        {
            Name = "Channel Filter (fax)",
            Query = "{ \"term\": { \"channel\": \"fax\" } }",
            TimeMs = singleFilterTime,
            DocumentsReturned = singleFilter.Count,
            Improvement = $"{singleFilterImprovement}%"
        });

        // Test 3: Multi-filter (channel + client)
        stopwatch.Restart();
        var multiFilter = await _searchService.SearchDocumentsAsync(null, "fax", "XYZ Motors", null, null, 1, 10000);
        stopwatch.Stop();
        var multiFilterTime = stopwatch.ElapsedMilliseconds;
        var multiFilterImprovement = unfilteredTime > 0
            ? Math.Round((1 - (double)multiFilterTime / unfilteredTime) * 100, 1)
            : 0;
        results.Add(new BenchmarkResult
        {
            Name = "Multi-Filter (fax + XYZ Motors)",
            Query = "{ \"term\": { \"channel\": \"fax\" }, \"term\": { \"clientName\": \"XYZ Motors\" } }",
            TimeMs = multiFilterTime,
            DocumentsReturned = multiFilter.Count,
            Improvement = $"{multiFilterImprovement}%"
        });

        return Ok(new
        {
            totalDocuments = 1000000,
            tests = results
        });
    }
}

public class BenchmarkResult
{
    public string Name { get; set; } = string.Empty;
    public string Query { get; set; } = string.Empty;
    public long TimeMs { get; set; }
    public int DocumentsReturned { get; set; }
    public string? Improvement { get; set; }
}