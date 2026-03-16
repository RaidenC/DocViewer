using DocViewer.Application.Interfaces;
using DocViewer.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace DocViewer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ISearchService _searchService;

    public HealthController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var isHealthy = await _searchService.IsHealthyAsync();

        if (isHealthy)
        {
            return Ok(new { status = "healthy", openSearch = "connected" });
        }

        return StatusCode(503, new { status = "unhealthy", openSearch = "disconnected" });
    }
}