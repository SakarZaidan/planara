using Microsoft.AspNetCore.Mvc;
using Planara.DTOs;
using Planara.Services;

namespace Planara.Controllers;

[ApiController]
[Route("v1/library")]
public class LibraryController : ControllerBase
{
    private readonly ISupabaseService _supabase;

    public LibraryController(ISupabaseService supabase)
    {
        _supabase = supabase;
    }

    [HttpGet]
    public async Task<IActionResult> GetLibrary([FromQuery] int page = 0, CancellationToken ct = default)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(Error("AUTH_REQUIRED", "Valid JWT required"));
        var data = await _supabase.GetLibraryAsync(userId, page, ct);
        return Ok(data);
    }

    [HttpDelete("{kernelId}")]
    public async Task<IActionResult> DeleteProject(string kernelId, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(Error("AUTH_REQUIRED", "Valid JWT required"));
        await _supabase.DeleteProjectAsync(kernelId, userId, ct);
        return NoContent();
    }

    private string? GetUserId() => HttpContext.Items["UserId"]?.ToString();

    private static ApiErrorDto Error(string code, string message) =>
        new() { Error = new ApiErrorDetailDto { Code = code, Message = message } };
}
