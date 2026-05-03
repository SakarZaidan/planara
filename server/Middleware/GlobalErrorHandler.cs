using Planara.DTOs;

namespace Planara.Middleware;

public class GlobalErrorHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalErrorHandlerMiddleware> _logger;

    public GlobalErrorHandlerMiddleware(RequestDelegate next, ILogger<GlobalErrorHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new ApiErrorDto
            {
                Error = new ApiErrorDetailDto { Code = "FORBIDDEN", Message = ex.Message }
            });
        }
        catch (InvalidOperationException ex) when (ex.Message.StartsWith("RENDER_UNAVAILABLE"))
        {
            context.Response.StatusCode = 402;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new ApiErrorDto
            {
                Error = new ApiErrorDetailDto { Code = "RENDER_UNAVAILABLE", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new ApiErrorDto
            {
                Error = new ApiErrorDetailDto { Code = "INTERNAL_ERROR", Message = "Synthesis engine failure" }
            });
        }
    }
}
