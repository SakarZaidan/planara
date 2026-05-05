using Microsoft.AspNetCore.Mvc;
using Planara.DTOs;
using Planara.Services;

namespace Planara.Controllers;

[ApiController]
[Route("v1/furniture")]
public class FurnitureController : ControllerBase
{
    private readonly IFurnitureMatcher _matcher;
    private readonly IIkeaScraper _scraper;
    private readonly IConfiguration _config;

    public FurnitureController(IFurnitureMatcher matcher, IIkeaScraper scraper, IConfiguration config)
    {
        _matcher = matcher;
        _scraper = scraper;
        _config = config;
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions(
        [FromQuery] string? tokens,
        [FromQuery] string? category,
        CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(Error("AUTH_REQUIRED", "Valid JWT required"));

        var tokenList = (tokens ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
        if (tokenList.Count == 0) return BadRequest(Error("TOKENS_REQUIRED", "At least one style token required"));

        var results = await _matcher.GetMatchesAsync(tokenList, category, ct);
        return Ok(results);
    }

    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog(
        [FromQuery] string? category,
        [FromQuery] string? style,
        [FromQuery] string? search,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0,
        CancellationToken ct = default)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(Error("AUTH_REQUIRED", "Valid JWT required"));

        limit = Math.Clamp(limit, 1, 50);
        var result = await _matcher.GetCatalogAsync(category, style, search, limit, offset, ct);
        return Ok(new { items = result.Items, total_count = result.TotalCount });
    }

    [HttpPost("scrape")]
    public async Task<IActionResult> Scrape([FromQuery] bool seed = false, CancellationToken ct = default)
    {
        var adminKey = _config["AdminKey"];
        if (!string.IsNullOrEmpty(adminKey))
        {
            Request.Headers.TryGetValue("X-Admin-Key", out var provided);
            if (provided != adminKey) return Unauthorized(Error("AUTH_REQUIRED", "X-Admin-Key header required"));
        }

        var count = seed
            ? await _scraper.SeedAsync(ct)
            : await _scraper.ScrapeAndUpsertAsync(ct);

        return Ok(new { upserted = count, mode = seed ? "seed" : "scrape" });
    }

    private string? GetUserId() => HttpContext.Items["UserId"]?.ToString();

    private static ApiErrorDto Error(string code, string message) =>
        new() { Error = new ApiErrorDetailDto { Code = code, Message = message } };
}
