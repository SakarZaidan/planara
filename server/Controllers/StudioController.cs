using Microsoft.AspNetCore.Mvc;
using Planara.DTOs;
using Planara.Services;
using System.Text.Json;

namespace Planara.Controllers;

[ApiController]
[Route("v1/studio")]
public class StudioController : ControllerBase
{
    private readonly ISupabaseService _supabase;

    public StudioController(ISupabaseService supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> Overview(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(Error("AUTH_REQUIRED", "Valid JWT required"));
        var data = await _supabase.GetOverviewAsync(userId, ct);
        return Ok(data);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(Error("AUTH_REQUIRED", "Valid JWT required"));
        var profile = await _supabase.GetProfileAsync(userId, ct);
        if (profile == null) return NotFound(Error("PROFILE_NOT_FOUND", "Profile not found"));
        return Ok(profile);
    }

    [HttpPatch("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] JsonElement body, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(Error("AUTH_REQUIRED", "Valid JWT required"));

        string? displayName = body.TryGetProperty("display_name", out var dn) ? dn.GetString() : null;
        string? bio = body.TryGetProperty("design_philosophy", out var bp) ? bp.GetString() : null;
        bool deepNeural = true;
        bool autoInsight = false;

        if (body.TryGetProperty("preferences", out var prefs))
        {
            if (prefs.TryGetProperty("deep_neural_rendering", out var dnr)) deepNeural = dnr.GetBoolean();
            if (prefs.TryGetProperty("auto_insight_generation", out var aig)) autoInsight = aig.GetBoolean();
        }

        await _supabase.UpdateProfileAsync(userId, displayName, bio, deepNeural, autoInsight, ct);
        return Ok(new { message = "Settings updated" });
    }

    private string? GetUserId() => HttpContext.Items["UserId"]?.ToString();

    private static ApiErrorDto Error(string code, string message) =>
        new() { Error = new ApiErrorDetailDto { Code = code, Message = message } };
}
