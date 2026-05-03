using System.IdentityModel.Tokens.Jwt;

namespace Planara.Middleware;

public class JwtAuthMiddleware
{
    private readonly RequestDelegate _next;

    public JwtAuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var token = ExtractToken(context);
        if (token != null)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                if (handler.CanReadToken(token))
                {
                    var jwt = handler.ReadJwtToken(token);
                    var sub = jwt.Subject ?? jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
                    if (sub != null)
                        context.Items["UserId"] = sub;
                }
            }
            catch { /* invalid token — leave UserId null */ }
        }
        await _next(context);
    }

    private static string? ExtractToken(HttpContext context)
    {
        var auth = context.Request.Headers.Authorization.ToString();
        if (auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return auth["Bearer ".Length..].Trim();
        return null;
    }
}
