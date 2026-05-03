using Planara.DTOs;

namespace Planara.Middleware;

public class PromptSanitizerMiddleware
{
    private readonly RequestDelegate _next;
    private const int MaxPromptLength = 800;

    public PromptSanitizerMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/v1/synthesis/initialize") &&
            context.Request.Method == "POST")
        {
            context.Request.EnableBuffering();
            using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;

            if (body.Length > 0)
            {
                try
                {
                    var req = System.Text.Json.JsonSerializer.Deserialize<SynthesisRequestDto>(body);
                    if (req?.Prompt.Length > MaxPromptLength)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsJsonAsync(new ApiErrorDto
                        {
                            Error = new ApiErrorDetailDto
                            {
                                Code = "PROMPT_TOO_LONG",
                                Message = $"Prompt exceeds {MaxPromptLength} character limit"
                            }
                        });
                        return;
                    }
                }
                catch { /* let controller handle malformed JSON */ }
            }
        }

        await _next(context);
    }
}
