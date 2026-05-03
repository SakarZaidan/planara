using Microsoft.AspNetCore.Mvc;
using Planara.DTOs;
using Planara.Services;

namespace Planara.Controllers;

[ApiController]
[Route("v1/synthesis")]
public class SynthesisController : ControllerBase
{
    private readonly ISynthesisOrchestrator _orchestrator;

    public SynthesisController(ISynthesisOrchestrator orchestrator)
    {
        _orchestrator = orchestrator;
    }

    [HttpPost("initialize")]
    public async Task<IActionResult> Initialize([FromBody] SynthesisRequestDto req, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(Error("AUTH_REQUIRED", "Valid JWT required"));
        if (string.IsNullOrWhiteSpace(req.Prompt)) return BadRequest(Error("PROMPT_REQUIRED", "Prompt is required"));

        var result = await _orchestrator.InitializeAsync(req.Prompt, userId, ct);
        return StatusCode(201, result);
    }

    [HttpPost("render-room")]
    public async Task<IActionResult> RenderRoom([FromBody] RenderRoomRequestDto req, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(Error("AUTH_REQUIRED", "Valid JWT required"));
        if (string.IsNullOrWhiteSpace(req.KernelId) || string.IsNullOrWhiteSpace(req.RoomId))
            return BadRequest(Error("INVALID_PARAMS", "kernel_id and room_id are required"));

        var result = await _orchestrator.RenderRoomAsync(req.KernelId, req.RoomId, userId, req.InlineKernel, ct);
        return Ok(result);
    }

    [HttpGet("render/{roomId}")]
    public IActionResult GetRender(string roomId)
    {
        return Ok(new { room_id = roomId, message = "Use Realtime subscription for render status" });
    }

    private string? GetUserId() =>
        HttpContext.Items["UserId"]?.ToString();

    private static ApiErrorDto Error(string code, string message) =>
        new() { Error = new ApiErrorDetailDto { Code = code, Message = message } };
}
