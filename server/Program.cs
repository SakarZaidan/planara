using Planara.Middleware;
using Planara.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("synthesis", context =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
    options.RejectionStatusCode = 429;
});

// HTTP Clients
builder.Services.AddHttpClient<IGeminiClient, GeminiClient>();
builder.Services.AddHttpClient<IStorageService, StorageService>();
builder.Services.AddHttpClient<ISupabaseService, SupabaseService>();
builder.Services.AddHttpClient<IFurnitureMatcher, FurnitureMatcher>();
builder.Services.AddHttpClient<IIkeaScraper, IkeaScraper>();

// Services
builder.Services.AddScoped<ISchemaGuard, SchemaGuard>();
builder.Services.AddScoped<ISynthesisOrchestrator, SynthesisOrchestrator>();
builder.Services.AddHostedService<CatalogSeederService>();

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<GlobalErrorHandlerMiddleware>();
app.UseMiddleware<PromptSanitizerMiddleware>();
app.UseMiddleware<JwtAuthMiddleware>();

app.UseCors();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.Run("http://localhost:5000");
