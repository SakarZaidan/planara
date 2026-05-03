using Microsoft.AspNetCore.Mvc;
using Planara.DTOs;
using Planara.Services;

namespace Planara.Controllers;

[ApiController]
[Route("v1/furniture")]
public class FurnitureController : ControllerBase
{
    private readonly IFurnitureMatcher _matcher;

    public FurnitureController(IFurnitureMatcher matcher)
    {
        _matcher = matcher;
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

    private string? GetUserId() => HttpContext.Items["UserId"]?.ToString();

    private static ApiErrorDto Error(string code, string message) =>
        new() { Error = new ApiErrorDetailDto { Code = code, Message = message } };
}
